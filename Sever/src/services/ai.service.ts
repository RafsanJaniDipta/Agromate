import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

// One place to talk to the AI model set in .env (AI_PROVIDER, AI_API_KEY, AI_MODEL).
// Callers ask for a JSON answer or a plain-text chat reply; any failure becomes a 502 they can show.

// OpenRouter, OpenAI and Groq all speak the same "chat completions" API
const OPENAI_COMPATIBLE_URLS: Partial<Record<typeof env.AI_PROVIDER, string>> = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  groq: "https://api.groq.com/openai/v1/chat/completions",
};
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Room for models that think before answering; the answers asked for here are short
const MAX_OUTPUT_TOKENS = 2000;

// One turn of a conversation
export type ChatTurn = { role: "user" | "assistant"; content: string };

// "auto" lets OpenRouter pick a suitable model
const modelName = () =>
  env.AI_PROVIDER === "openrouter" && env.AI_MODEL === "auto" ? "openrouter/auto" : env.AI_MODEL;

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(env.AI_TIMEOUT_MS),
  }).catch(() => null);
  if (!res?.ok) {
    throw AppError.badGateway("AI service is unavailable");
  }
  return res.json();
}

// The model's reply text, from whichever provider is configured
async function replyText(instructions: string, turns: ChatTurn[], asJson: boolean): Promise<string> {
  if (!env.AI_API_KEY) {
    throw AppError.badGateway("AI is not configured (AI_API_KEY is empty)");
  }

  const compatibleUrl = OPENAI_COMPATIBLE_URLS[env.AI_PROVIDER];
  if (compatibleUrl) {
    const data = (await post(
      compatibleUrl,
      { Authorization: `Bearer ${env.AI_API_KEY}` },
      {
        model: modelName(),
        max_tokens: MAX_OUTPUT_TOKENS,
        ...(asJson && { response_format: { type: "json_object" } }),
        messages: [{ role: "system", content: instructions }, ...turns],
      },
    )) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? "";
  }

  if (env.AI_PROVIDER === "gemini") {
    const data = (await post(
      `${GEMINI_URL}/${modelName()}:generateContent`,
      { "x-goog-api-key": env.AI_API_KEY },
      {
        systemInstruction: { parts: [{ text: instructions }] },
        // Gemini calls the assistant "model"
        contents: turns.map((turn) => ({
          role: turn.role === "assistant" ? "model" : "user",
          parts: [{ text: turn.content }],
        })),
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          ...(asJson && { responseMimeType: "application/json" }),
        },
      },
    )) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  }

  throw AppError.badGateway(`AI provider "${env.AI_PROVIDER}" is not supported yet`);
}

// Asks the model and returns its answer parsed as JSON
export async function askForJson(instructions: string, request: string): Promise<unknown> {
  const text = await replyText(instructions, [{ role: "user", content: request }], true);
  try {
    // Some models wrap JSON in a code fence despite being asked not to
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw AppError.badGateway("AI returned an answer that isn't JSON");
  }
}

// Continues a conversation and returns the model's plain-text reply
export async function askForText(instructions: string, turns: ChatTurn[]): Promise<string> {
  const text = (await replyText(instructions, turns, false)).trim();
  if (!text) throw AppError.badGateway("AI returned an empty answer");
  return text;
}
