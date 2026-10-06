import { api } from "@/lib/api";

export type Profile = {
  id: string;
  name: string;
  phone: string | null;
  location: string | null;
  image: string | null;
};

export type ProfileChange = { name?: string; location?: string; phone?: string };

type Envelope<T> = { data: T };

export async function getProfile() {
  const { data } = await api<Envelope<Profile>>("/api/users/me");
  return data;
}

export async function updateProfile(change: ProfileChange) {
  const { data } = await api<Envelope<Profile>>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(change),
  });
  return data;
}

// Uploads a new profile picture; the server stores it on Cloudinary and returns the updated profile
export async function uploadAvatar(file: File) {
  const body = new FormData();
  body.append("avatar", file);
  const { data } = await api<Envelope<Profile>>("/api/users/me/avatar", { method: "POST", body });
  return data;
}
