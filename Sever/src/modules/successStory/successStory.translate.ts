import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";
import { askForJson } from "../../services/ai.service.js";

// A story's text is kept in Bangla and English. Farmers write in one language; before approving,
// the admin needs the other. This asks the AI for the missing half so the admin only has to check it.

// Text fields and their database limits (same as the validation schemas)
const TEXT_FIELDS = [
  { name: "name", maxLength: 40 },
  { name: "role", maxLength: 30 },
  { name: "location", maxLength: 30 },
  { name: "quote", maxLength: 200, minLength: 60 },
] as const;

type Language = "Bn" | "En";
const otherLanguage = (language: Language): Language => (language === "Bn" ? "En" : "Bn");

const INSTRUCTIONS = [
  "You translate short texts for a farming website in Bangladesh, between Bangla (Bengali script) and English.",
  "Rules:",
  "- Names of people and places are transliterated, not translated (e.g. 'মোঃ রহিম' <-> 'Md. Rahim', 'রামগতি, লক্ষ্মীপুর' <-> 'Ramgati, Lakshmipur').",
  "- Use simple, everyday words a farmer would use; keep the meaning and tone of the original.",
  "- Stay within each text's maxLength (in characters); a quote must also be at least its minLength.",
  "- Reply with JSON only: an object with exactly the keys you were given, each holding the translation as a string.",
].join("\n");

type Story = Record<`${(typeof TEXT_FIELDS)[number]["name"]}${Language}`, string | null>;

// Suggested text for every field that is filled in one language but empty in the other.
// Nothing is saved; the admin reviews the suggestions and saves them with the review.
export async function translateStoryText(id: string): Promise<Record<string, string>> {
  const story = (await prisma.successStory.findUnique({ where: { id } })) as Story | null;
  if (!story) {
    throw AppError.notFound("Story not found");
  }

  // "quoteEn": { from: "Bangla", text: "…", maxLength: 200, minLength: 60 }, one per missing field
  const tasks: Record<string, { from: string; text: string; maxLength: number; minLength?: number }> = {};
  for (const field of TEXT_FIELDS) {
    for (const source of ["Bn", "En"] as const) {
      const text = story[`${field.name}${source}`]?.trim();
      const target = `${field.name}${otherLanguage(source)}` as keyof Story;
      if (text && !story[target]?.trim()) {
        tasks[target] = {
          from: source === "Bn" ? "Bangla" : "English",
          text,
          maxLength: field.maxLength,
          ...("minLength" in field ? { minLength: field.minLength } : {}),
        };
      }
    }
  }
  if (Object.keys(tasks).length === 0) return {};

  const answer = await askForJson(
    INSTRUCTIONS,
    `Translate each text into the other language. Keys ending in "Bn" need Bangla, keys ending in "En" need English.\n${JSON.stringify(tasks)}`,
  );

  // Keep only the keys that were asked for, as trimmed strings within their limits
  const suggestions: Record<string, string> = {};
  for (const [key, task] of Object.entries(tasks)) {
    const value = (answer as Record<string, unknown>)?.[key];
    if (typeof value === "string" && value.trim()) {
      suggestions[key] = value.trim().slice(0, task.maxLength);
    }
  }
  return suggestions;
}
