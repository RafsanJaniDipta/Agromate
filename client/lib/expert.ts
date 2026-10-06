import { api, ApiError } from "@/lib/api";

export type ExpertStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type ExpertProfile = {
  specialization: string;
  organization: string | null;
  experienceYears: number;
  bio: string | null;
  qualifications: string | null;
  status: ExpertStatus;
  rejectionReason: string | null;
};

export type ProfileInput = Pick<
  ExpertProfile,
  "specialization" | "organization" | "experienceYears" | "bio" | "qualifications"
>;

export type OpenQuestion = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  user: { name: string };
  crop: { name: string; nameBn: string | null } | null;
  _count: { answers: number };
};

type Paginated<T> = { data: T[]; meta: { total: number } };

// The expert's own profile, or null before they have filled one in
export async function getOwnProfile(): Promise<ExpertProfile | null> {
  try {
    const { data } = await api<{ data: ExpertProfile }>("/api/experts/me");
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function saveOwnProfile(profile: ProfileInput): Promise<ExpertProfile> {
  const { data } = await api<{ data: ExpertProfile }>("/api/experts/me", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  return data;
}

// Newest farmer questions still waiting for an answer, plus how many there are
export async function getOpenQuestions(limit = 10) {
  const { data, meta } = await api<Paginated<OpenQuestion>>(`/api/questions?status=OPEN&limit=${limit}`);
  return { questions: data, total: meta.total };
}

// Platform-wide number of questions that already have an answer
export async function countAnsweredQuestions() {
  const { meta } = await api<Paginated<OpenQuestion>>("/api/questions?status=ANSWERED&limit=1");
  return meta.total;
}

export async function answerQuestion(questionId: string, content: string) {
  await api(`/api/questions/${questionId}/answers`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
