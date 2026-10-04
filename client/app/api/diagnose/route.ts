import { CONFIDENCE_LEVELS, type DiagnoseError, type Diagnosis } from "@/lib/diseases";

// Server-only proxy to Google Gemini, so the API key never reaches the browser.
// Set GEMINI_API_KEY in .env.local (free key from https://aistudio.google.com).
export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const fail = (error: DiagnoseError, status: number) => Response.json({ error }, { status });

// Gemini must answer in exactly this JSON shape
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    isPlant: { type: "BOOLEAN" },
    crop: { type: "STRING" },
    healthy: { type: "BOOLEAN" },
    disease: { type: "STRING" },
    confidence: { type: "STRING", enum: [...CONFIDENCE_LEVELS] },
    symptoms: { type: "STRING" },
    advice: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["isPlant", "crop", "healthy", "disease", "confidence", "symptoms", "advice"],
};

function buildPrompt(locale: string) {
  const language = locale === "bn" ? "Bangla (Bengali script), simple words a farmer understands" : "simple English";
  return [
    "You are an agricultural plant-pathology assistant for smallholder farmers in Bangladesh.",
    "The photo shows a crop plant or part of one: leaf, fruit, vegetable, stem, root, tuber,",
    "flower, grain/panicle or the whole plant. First identify the crop, then diagnose the most",
    "likely disease, pest damage, nutrient problem or physiological disorder in what is shown.",
    "Rules:",
    "- isPlant: false only if there is no plant or plant part in the photo, or it is too blurry/dark to judge.",
    "- crop: the common local name of the crop (e.g. rice/paddy, potato, jute). If unsure, your best guess.",
    "- healthy: true only if you see no disease, pest or deficiency signs; then disease is an empty string.",
    "- confidence: 'high' only when the signs are clear and typical; otherwise 'medium' or 'low'.",
    "- symptoms: one or two sentences on what you see that supports the diagnosis.",
    "- advice: 2 to 4 short, practical steps (cultural practices first, e.g. remove infected leaves,",
    "  drainage, resistant varieties). You may name a common type of fungicide/pesticide,",
    "  but never give doses; tell them to follow the product label and ask the local",
    "  Upazila Agriculture Officer before spraying.",
    `Write crop, disease, symptoms and advice in ${language}.`,
  ].join("\n");
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fail("notConfigured", 500);

  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof File) || !image.type.startsWith("image/")) return fail("badImage", 400);
  if (image.size > MAX_BYTES) return fail("tooLarge", 413);

  const locale = form?.get("locale") === "bn" ? "bn" : "en";

  const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");

  let res: Response;
  try {
    res = await fetch(`${API_URL}/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: image.type, data: base64 } },
              { text: buildPrompt(locale) },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[diagnose] Gemini unreachable", err);
    return fail("upstream", 502);
  }

  // 429: free-tier limit reached; 503: model overloaded. Both pass after a short wait.
  if (res.status === 429 || res.status === 503) return fail("busy", 503);
  if (!res.ok) {
    console.error("[diagnose] Gemini error", res.status, await res.text().catch(() => ""));
    return fail("upstream", 502);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  try {
    const raw = JSON.parse(text) as Partial<Diagnosis>;
    const diagnosis: Diagnosis = {
      isPlant: raw.isPlant !== false,
      crop: String(raw.crop ?? ""),
      healthy: raw.healthy === true,
      disease: String(raw.disease ?? ""),
      confidence: CONFIDENCE_LEVELS.find((c) => c === raw.confidence) ?? "low",
      symptoms: String(raw.symptoms ?? ""),
      advice: Array.isArray(raw.advice) ? raw.advice.map(String).slice(0, 4) : [],
    };
    return Response.json(diagnosis);
  } catch {
    console.error("[diagnose] Gemini returned non-JSON", text.slice(0, 500));
    return fail("upstream", 502);
  }
}
