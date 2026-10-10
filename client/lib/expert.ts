import { api, API_URL, ApiError } from "@/lib/api";

export type ExpertStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type ExpertProfile = {
  specialization: string;
  organization: string | null;
  experienceYears: number;
  bio: string | null;
  qualifications: string | null;
  status: ExpertStatus;
  rejectionReason: string | null;
  categories: ExpertCategory[];
};

export type ProfileInput = Pick<
  ExpertProfile,
  "specialization" | "organization" | "experienceYears" | "bio" | "qualifications"
> & { categoryIds?: string[] };

// The API nests each category in a join row
type ExpertProfileRow = Omit<ExpertProfile, "categories"> & { categories: { category: ExpertCategory }[] };

const toProfile = ({ categories, ...profile }: ExpertProfileRow): ExpertProfile => ({
  ...profile,
  categories: categories.map(({ category }) => category),
});

// The expert's own profile, or null before they have filled one in
export async function getOwnProfile(): Promise<ExpertProfile | null> {
  try {
    const { data } = await api<{ data: ExpertProfileRow }>("/api/experts/me");
    return toProfile(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function saveOwnProfile(profile: ProfileInput): Promise<ExpertProfile> {
  const { data } = await api<{ data: ExpertProfileRow }>("/api/experts/me", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  return toProfile(data);
}

// ---- Expert directory (farmer dashboard) ----

export type ExpertCategory = { id: string; slug: string; nameBn: string; nameEn: string };

// A verified expert as farmers see them. Contact goes through the chat, so phone and email aren't kept.
export type VerifiedExpert = Omit<ExpertProfile, "status" | "rejectionReason"> & {
  id: string;
  user: { id: string; name: string; image: string | null; location: string | null };
};

type VerifiedExpertRow = Omit<VerifiedExpert, "categories"> & { categories: { category: ExpertCategory }[] };

const toVerifiedExpert = ({ user, categories, ...profile }: VerifiedExpertRow): VerifiedExpert => ({
  ...profile,
  user: { id: user.id, name: user.name, image: user.image, location: user.location },
  categories: categories.map(({ category }) => category),
});

// Every expert the admin has verified, most experienced first
export async function getVerifiedExperts(): Promise<VerifiedExpert[]> {
  const { data } = await api<{ data: VerifiedExpertRow[] }>("/api/experts");
  return data.map(toVerifiedExpert);
}

// The same list for the public pages, called on the server and cached for a few minutes.
// Empty when the API is down, so the page still renders.
export async function getPublicExperts(): Promise<VerifiedExpert[]> {
  try {
    const res = await fetch(`${API_URL}/api/experts`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return ((await res.json()) as { data: VerifiedExpertRow[] }).data.map(toVerifiedExpert);
  } catch {
    return [];
  }
}

export async function getExpertCategories(): Promise<ExpertCategory[]> {
  const { data } = await api<{ data: ExpertCategory[] }>("/api/experts/categories");
  return data;
}

// A category's name in the page's language
export const categoryName = (category: ExpertCategory, locale: string) =>
  locale === "bn" ? category.nameBn : category.nameEn;
