export type UserRole = "SUPER_ADMIN" | "CAFE_ADMIN" | "STAFF";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  cafeId: string | null;
  cafe?: {
    id: string;
    cafeName: string;
    slug: string;
    logo?: string | null;
  } | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  icon?: string | null;
  route: string;
  sortOrder: number;
}
