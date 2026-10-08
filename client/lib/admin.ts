import { api } from "@/lib/api";
import type { Crop } from "@/lib/crops";
import { signOut, toRole, type Role } from "@/lib/session";

type SignInResponse = { user: { role?: string | null } };

type Paginated<T> = { data: T[]; meta: { page: number; limit: number; total: number } };

export type AdminStats = {
  totalUsers: number;
  totalFarms: number;
  totalCropCycles: number;
  totalQuestions: number;
  totalDiseaseDetections: number;
};

export type AdminUser = {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  role: string;
  banned: boolean | null;
  createdAt: string;
};

export type ExpertApplication = {
  userId: string;
  specialization: string;
  organization: string | null;
  experienceYears: number;
  createdAt: string;
  user: { name: string; phone: string | null };
};

export type MarketPrice = {
  id: string;
  district: string;
  pricePerUnit: number;
  unit: string;
  date: string;
  crop: Pick<Crop, "id" | "name" | "nameBn">;
};

export type MarketPriceInput = { cropId: string; district: string; pricePerUnit: number; unit: string };

export class FarmerAccountError extends Error {}

// Better Auth's email sign-in for admins and experts, who have no phone number.
// Returns the role so the caller can open the right dashboard.
export async function signInStaff(email: string, password: string, rememberMe: boolean): Promise<Role> {
  const { user } = await api<SignInResponse>("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });

  const role = toRole(user.role);

  // Farmers have their own phone login, so don't keep a session from this page
  if (role === "FARMER") {
    await signOut();
    throw new FarmerAccountError();
  }

  return role;
}

export async function getAdminStats() {
  const { data } = await api<{ data: AdminStats }>("/api/admin/statistics");
  return data;
}

export async function getPendingExperts() {
  const { data } = await api<{ data: ExpertApplication[] }>("/api/admin/experts?status=PENDING");
  return data;
}

export async function reviewExpert(userId: string, status: "VERIFIED" | "REJECTED") {
  await api(`/api/admin/experts/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getUsers(page: number, limit = 10) {
  return api<Paginated<AdminUser>>(`/api/admin/users?page=${page}&limit=${limit}`);
}

// Changes a user's role and/or blocks them ("BANNED") or lets them back in ("ACTIVE")
export async function updateUser(id: string, change: { role?: Role; status?: "ACTIVE" | "BANNED" }) {
  await api(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(change),
  });
}

export async function getMarketPrices(page: number, limit = 10) {
  return api<Paginated<MarketPrice>>(`/api/market-prices?page=${page}&limit=${limit}`);
}

export async function createMarketPrice(input: MarketPriceInput) {
  await api("/api/market-prices", { method: "POST", body: JSON.stringify(input) });
}

export async function deleteMarketPrice(id: string) {
  await api(`/api/market-prices/${id}`, { method: "DELETE" });
}
