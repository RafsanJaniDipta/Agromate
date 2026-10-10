export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  location?: string | null;
}

export interface AuthSession {
  id: string;
  expiresAt: Date;
}
