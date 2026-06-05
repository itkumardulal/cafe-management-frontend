import type { UserRole } from "@/src/types/auth";
import type { UserStatus } from "@/src/lib/user-status";
import type { LoadStatus } from "./load-status";

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
  staffRole?: { id: string; name: string } | null;
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
  staffRoleId: string;
  password?: string;
}

export interface UpdateStaffPayload {
  id: string;
  fullName?: string;
  contactNumber?: string;
  staffRoleId?: string;
}

export interface UserState {
  staff: StaffRecord[];
  createdUsers: CreatedUserRecord[];
  createdUsersStatus: LoadStatus;
  assignableMenus: AssignableMenu[];
  assignableMenusStatus: LoadStatus;
  loading: boolean;
  error: string | null;
}
