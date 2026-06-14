import type { UserStatus } from "@/src/lib/user-status";
import type { LoadStatus } from "./load-status";

export interface ManagedCafeAdmin {
  id: string;
  staffId?: string | null;
  fullName: string;
  email: string;
  isActive: boolean;
  status?: UserStatus;
  createdAt: string;
}

export interface ManagedCafe {
  id: string;
  cafeName: string;
  slug: string;
  email: string;
  address?: string | null;
  logo?: string | null;
  contactNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  users: ManagedCafeAdmin[];
}

export interface CafeOverview {
  cafe: {
    id: string;
    cafeName: string;
    slug: string;
    email: string;
    contactNumber?: string | null;
    isActive: boolean;
    createdAt: string;
    users: Array<{
      id: string;
      fullName: string;
      email: string;
      isActive: boolean;
    }>;
  };
  metrics: {
    totalStaff: number;
    activeStaff: number;
    totalUsers: number;
  };
}

export interface CreateCafePayload {
  cafeName: string;
  email: string;
  slug?: string;
  address?: string;
  contactNumber?: string;
  logo?: string;
  password?: string;
}

export interface CreateCafeResult {
  cafe: ManagedCafe;
  cafeAdmin: ManagedCafeAdmin;
}

export interface CafeState {
  selectedCafeId: string | null;
  managedCafes: ManagedCafe[];
  managedCafesStatus: LoadStatus;
  selectedCafeOverview: CafeOverview | null;
  overviewStatus: LoadStatus;
  overviewLoadedCafeId: string | null;
  loading: boolean;
  error: string | null;
}
