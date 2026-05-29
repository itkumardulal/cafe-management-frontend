import type { MenuItem } from "@/src/types/auth";

export interface MenuState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
}
