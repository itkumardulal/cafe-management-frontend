import type { MenuItem } from "@/src/types/auth";

export interface MenuState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  /** True after the first authorized-menus fetch completes (success or failure). */
  initialized: boolean;
}
