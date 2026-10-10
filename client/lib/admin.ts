import { api } from "@/lib/api";
import { signOut, toRole, type Role } from "@/lib/session";

type SignInResponse = { user: { role?: string | null } };

type Paginated<T> = { data: T[]; meta: { page: number; limit: number; total: number } };

export type AdminStats = {
  totalUsers: number;
  totalFarms: number;
  totalCropCycles: number;
  totalDiseaseDetections: number;
  pendingExperts?: number;
  pendingStories?: number;
  openSupportTickets?: number;
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

export type SupportTicket = {
  id: string;
  name: string;
  phone: string;
  topic: string;
  message: string;
  locale: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  user?: { id: string; name: string } | null;
};

export type BroadcastPayload = {
  role?: string;
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "ALERT";
};

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

export async function getUsers(page = 1, limit = 10, search?: string, role?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  return api<Paginated<AdminUser>>(`/api/admin/users?${params.toString()}`);
}

// Changes a user's role and/or blocks them ("BANNED") or lets them back in ("ACTIVE")
export async function updateUser(id: string, change: { role?: Role; status?: "ACTIVE" | "BANNED" }) {
  await api(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(change),
  });
}

export async function getSupportTickets(page = 1, limit = 10, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  return api<Paginated<SupportTicket>>(`/api/admin/support-tickets?${params.toString()}`);
}

export async function updateSupportTicketStatus(id: string, status: "OPEN" | "RESOLVED") {
  const { data } = await api<{ data: SupportTicket }>(`/api/admin/support-tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return data;
}

export async function broadcastNotification(payload: BroadcastPayload) {
  const { data } = await api<{ data: { count: number; message: string } }>("/api/admin/notifications/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

