const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// Carries the HTTP status so callers can tell "not logged in" (401) from "not allowed" (403)
export class ApiError extends Error {
  constructor(public status: number) {
    super(`Request failed: ${status}`);
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    // Sends the session cookie, which lives on the API's origin
    credentials: "include",
    ...options,
    credentials: "include",
  });

  if (!res.ok) {
    throw new ApiError(res.status);
  }

  return res.json() as Promise<T>;
}
