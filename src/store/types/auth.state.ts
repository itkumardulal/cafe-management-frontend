import type { AuthUser } from "@/src/types/auth";

export interface LoginPayload {
  email: string;
  password: string;
  csrfToken: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}
