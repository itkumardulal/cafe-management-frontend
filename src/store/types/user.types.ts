import type { UserRole } from "@/src/types/auth";
import type { UserStatus } from "@/src/lib/user-status";

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
  status?: UserStatus;
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
  status?: UserStatus;
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
  contactNumber?: string;
  accessMenuCodes?: string[];
  password?: string;
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
