import type { UserRole } from "@/src/types/auth";

export interface StaffMenuAccess {
  menu: { code: string; name: string };
}

export interface StaffRecord {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  isActive: boolean;
  menuAccess?: StaffMenuAccess[];
}

export interface AssignableMenu {
  code: string;
  name: string;
}

export interface CreatedUserRecord {
  id: string;
  staffId?: string | null;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  cafe?: {
    id: string;
    cafeName: string;
    slug: string;
    isActive: boolean;
  } | null;
}

export interface CreateStaffPayload {
  fullName: string;
  email: string;
  password: string;
  contactNumber?: string;
  accessMenuCodes?: string[];
}

export interface UpdateStaffPayload {
  id: string;
  fullName?: string;
  contactNumber?: string;
  accessMenuCodes?: string[];
}

export interface UserState {
  staff: StaffRecord[];
  createdUsers: CreatedUserRecord[];
  assignableMenus: AssignableMenu[];
  loading: boolean;
  error: string | null;
}
