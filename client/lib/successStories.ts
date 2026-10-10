import type { Locale } from "next-intl";
import { api } from "@/lib/api";

export type StoryStatus = "PENDING" | "APPROVED" | "REJECTED";

// A story as the farmer sees it. Text is stored per language; the farmer writes one
// language and the admin fills in the other before approving.
export type MyStory = {
  id: string;
  nameBn: string | null;
  nameEn: string | null;
  roleBn: string | null;
  roleEn: string | null;
  locationBn: string | null;
  locationEn: string | null;
  quoteBn: string | null;
  quoteEn: string | null;
  imageUrl: string;
  imageKey: string;
  yieldChangePercent: number;
  costChangePercent: number;
  incomeChangePercent: number;
  status: StoryStatus;
  rejectionReason: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

// The story text in one language
export type StoryText = { name: string; role: string; location: string; quote: string };

export type StoryResults = {
  yieldChangePercent: number;
  costChangePercent: number;
  incomeChangePercent: number;
};

export type StoryPhoto = { imageUrl: string; imageKey: string };

type Envelope<T> = { data: T };

const TEXT_FIELDS = ["name", "role", "location", "quote"] as const;

// "bn" -> "Bn": the suffix of the matching database column
const columnSuffix = (locale: Locale) => (locale === "bn" ? "Bn" : "En");

// Text in the reader's language, falling back to the other language if that one is empty
export function storyTextFor(story: MyStory, locale: Locale): StoryText {
  const [first, second] = locale === "bn" ? (["Bn", "En"] as const) : (["En", "Bn"] as const);
  const pick = (field: (typeof TEXT_FIELDS)[number]) =>
    story[`${field}${first}`] ?? story[`${field}${second}`] ?? "";

  return { name: pick("name"), role: pick("role"), location: pick("location"), quote: pick("quote") };
}

// { name: "..." } -> { nameBn: "..." } for the language the farmer is writing in
function toColumns(text: StoryText, locale: Locale) {
  const suffix = columnSuffix(locale);
  return Object.fromEntries(TEXT_FIELDS.map((field) => [`${field}${suffix}`, text[field]]));
}

export async function getMyStories() {
  const { data } = await api<Envelope<MyStory[]>>("/api/success-stories/mine");
  return data;
}

export async function submitStory(text: StoryText, results: StoryResults, photo: StoryPhoto, locale: Locale) {
  const { data } = await api<Envelope<MyStory>>("/api/success-stories", {
    method: "POST",
    body: JSON.stringify({ ...toColumns(text, locale), ...results, ...photo, consent: true }),
  });
  return data;
}

// Any edit sends the story back to the admin for review
export async function updateStory(
  id: string,
  text: StoryText,
  results: StoryResults,
  photo: StoryPhoto | null,
  locale: Locale,
) {
  const { data } = await api<Envelope<MyStory>>(`/api/success-stories/mine/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...toColumns(text, locale), ...results, ...photo }),
  });
  return data;
}

export async function deleteStory(id: string) {
  await api(`/api/success-stories/mine/${id}`, { method: "DELETE" });
}

type UploadSignature = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
};

// Sends the photo straight to Cloudinary, signed by our API, so big files never pass through our server
export async function uploadStoryPhoto(file: File): Promise<StoryPhoto> {
  const { data: signed } = await api<Envelope<UploadSignature>>("/api/success-stories/upload-signature", {
    method: "POST",
  });

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("timestamp", String(signed.timestamp));
  body.append("folder", signed.folder);
  body.append("signature", signed.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(`Photo upload failed: ${res.status}`);

  const uploaded: { secure_url: string; public_id: string } = await res.json();
  return { imageUrl: uploaded.secure_url, imageKey: uploaded.public_id };
}

// ---- Admin moderation ----

export type AdminStory = MyStory & {
  // Face position in the photo ("x% y%"), so round crops on the home page keep the face in view
  imageFocus: string;
  sortOrder: number;
  user: { id: string; name: string; phone: string | null; email: string };
};

// Everything the admin may change in one review; omitted fields stay as they are
export type StoryReview = Partial<
  Pick<
    MyStory,
    | "nameBn" | "nameEn" | "roleBn" | "roleEn"
    | "locationBn" | "locationEn" | "quoteBn" | "quoteEn"
    | "rejectionReason" | "isFeatured"
  >
> & { status?: StoryStatus; imageFocus?: string; sortOrder?: number };

// All stories, or only those with `status`; newest first
export async function getAdminStories(status?: StoryStatus) {
  const query = status ? `?status=${status}` : "";
  const { data } = await api<Envelope<AdminStory[]>>(`/api/success-stories/admin${query}`);
  return data;
}

// Returns the saved story without its `user`, so callers merge it into the one they have
export async function reviewStory(id: string, review: StoryReview) {
  const { data } = await api<Envelope<MyStory & Pick<AdminStory, "imageFocus" | "sortOrder">>>(
    `/api/success-stories/${id}/review`,
    { method: "PATCH", body: JSON.stringify(review) },
  );
  return data;
}

// AI suggestions for the text the farmer didn't write in the other language, e.g. { quoteEn: "…" }.
// Nothing is saved until the admin saves the review.
export async function translateStory(id: string) {
  const { data } = await api<Envelope<Partial<Record<string, string>>>>(`/api/success-stories/${id}/translate`, {
    method: "POST",
  });
  return data;
}

export async function deleteStoryAsAdmin(id: string) {
  await api(`/api/success-stories/${id}`, { method: "DELETE" });
}

// ---- Home page ----

// An approved, featured story with its text already in the requested language
export type PublicStory = StoryResults & {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  imageUrl: string;
  imageFocus: string;
};

// How many approved stories the home page shows
const HOME_STORY_LIMIT = 6;

// Cache tag of the home page story list; admin changes clear it (see lib/homeStoriesCache.ts)
export const HOME_STORIES_TAG = "home-stories";

// Called on the server; cached for at most 5 minutes, and cleared at once when an admin
// approves, rejects or removes a story
export async function getHomeStories(locale: Locale) {
  const { data } = await api<Envelope<PublicStory[]>>(
    `/api/success-stories?locale=${locale}&limit=${HOME_STORY_LIMIT}`,
    { next: { revalidate: 300, tags: [HOME_STORIES_TAG] } },
  );
  return data;
}

// The same list fetched from the browser, to keep an open home page up to date
export async function getLiveHomeStories(locale: Locale) {
  const { data } = await api<Envelope<PublicStory[]>>(
    `/api/success-stories?locale=${locale}&limit=${HOME_STORY_LIMIT}`,
    { cache: "no-store" },
  );
  return data;
}
