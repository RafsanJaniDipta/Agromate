export type StoryStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CreateSuccessStoryInput {
  nameBn?: string;
  nameEn?: string;
  roleBn?: string;
  roleEn?: string;
  locationBn?: string;
  locationEn?: string;
  quoteBn?: string;
  quoteEn?: string;
  imageUrl: string;
  imageKey: string;
  yieldChangePercent: number;
  costChangePercent: number;
  incomeChangePercent: number;
  consent: boolean;
}

export interface UpdateSuccessStoryInput {
  nameBn?: string;
  nameEn?: string;
  roleBn?: string;
  roleEn?: string;
  locationBn?: string;
  locationEn?: string;
  quoteBn?: string;
  quoteEn?: string;
  imageUrl?: string;
  imageKey?: string;
  yieldChangePercent?: number;
  costChangePercent?: number;
  incomeChangePercent?: number;
}

export interface AdminReviewSuccessStoryInput {
  nameBn?: string;
  nameEn?: string;
  roleBn?: string;
  roleEn?: string;
  locationBn?: string;
  locationEn?: string;
  quoteBn?: string;
  quoteEn?: string;
  imageFocus?: string;
  status?: StoryStatus;
  rejectionReason?: string;
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface PublicSuccessStoryQuery {
  locale?: "bn" | "en";
  limit?: number;
}

export interface PublicSuccessStoryResponse {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  imageUrl: string;
  imageFocus: string;
  yieldChangePercent: number;
  costChangePercent: number;
  incomeChangePercent: number;
}
