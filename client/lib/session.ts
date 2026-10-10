import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

export type Role = "ADMIN" | "EXPERT" | "FARMER";

// `image` is the profile picture's URL, or null when there isn't one
export type CurrentUser = { id: string; name: string; role: Role; image: string | null };

// Better Auth stores roles in mixed case ("admin", "FARMER"); anything unknown is a farmer
export function toRole(role?: string | null): Role {
  const upper = role?.toUpperCase();
  return upper === "ADMIN" || upper === "EXPERT" ? upper : "FARMER";
}

// Where each role lands after logging in
const dashboards: Record<Role, string> = {
  ADMIN: "/admin",
  EXPERT: "/expert",
  FARMER: "/dashboard",
};

// Farmers log in by phone; admins and experts have email accounts
const loginPages: Record<Role, string> = {
  ADMIN: "/admin/login",
  EXPERT: "/admin/login",
  FARMER: "/login",
};

// Each role's own profile page; admins have none
const profilePages: Record<Role, string | null> = {
  ADMIN: null,
  EXPERT: "/expert/profile",
  FARMER: "/dashboard/profile",
};

export const profilePageFor = (role: Role) => profilePages[role];

export const dashboardFor = (role?: string | null) => dashboards[toRole(role)];

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data } = await api<{ data: Omit<CurrentUser, "role" | "image"> & { role: string; image?: string | null } }>(
    "/api/users/me",
  );
  return { ...data, role: toRole(data.role), image: data.image ?? null };
}

// Who is signed in, for public pages that look different to members:
// undefined while checking, null for a visitor (or when the check fails).
export function useSignedInUser() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return [user, setUser] as const;
}

export async function signOut() {
  await api("/api/auth/sign-out", { method: "POST", body: "{}" });
}

// Lets only `role` see the page: logged-out visitors go to that role's login,
// other roles go to their own dashboard. Returns the user once allowed.
export function useRoleGuard(role: Role) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((current) => {
        if (current.role === role) setUser(current);
        else router.replace(dashboards[current.role]);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) router.replace(loginPages[role]);
        else setFailed(true);
      });
  }, [role, router]);

  return { user, failed };
}
