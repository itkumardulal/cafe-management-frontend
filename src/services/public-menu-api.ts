import { cache } from "react";

export type PublicMenuItem = {
  catalogItemId: string;
  name: string;
  imageUrl: string | null;
  itemType: string | null;
  unitType: string | null;
  unitQuantity: string | null;
  sellPricePerUnit: string;
  isSpecial: boolean;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
  items: PublicMenuItem[];
};

export type PublicMenuData = {
  cafe: {
    cafeName: string;
    logo: string | null;
    address: string | null;
    contactNumber: string | null;
  };
  specials: PublicMenuItem[];
  categories: PublicMenuCategory[];
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

function getPublicMenuApiBase(): string {
  if (typeof window === "undefined") {
    const origin = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
    return `${origin}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
}

export class PublicMenuNotFoundError extends Error {
  constructor() {
    super("Menu not found");
    this.name = "PublicMenuNotFoundError";
  }
}

export class PublicMenuInvalidSlugError extends Error {
  constructor() {
    super("Invalid menu slug");
    this.name = "PublicMenuInvalidSlugError";
  }
}

async function fetchPublicMenuUncached(slug: string): Promise<PublicMenuData> {
  const apiBase = getPublicMenuApiBase();
  const res = await fetch(`${apiBase}/public/menu/${encodeURIComponent(slug)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (res.status === 404) {
    throw new PublicMenuNotFoundError();
  }

  if (res.status === 400) {
    throw new PublicMenuInvalidSlugError();
  }

  if (!res.ok) {
    throw new Error(`Failed to load menu (${res.status})`);
  }

  const json = (await res.json()) as ApiEnvelope<PublicMenuData>;
  return json.data;
}

export const getPublicMenu = cache(fetchPublicMenuUncached);

export async function fetchPublicMenu(slug: string): Promise<PublicMenuData> {
  return getPublicMenu(slug);
}

export function getPublicMenuUrl(slug: string): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${appUrl.replace(/\/$/, "")}/menu/${slug}`;
}

export function resolvePublicMenuAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = getPublicMenuApiBase().replace(/\/api\/?$/, "");
  return `${apiBase}${url.startsWith("/") ? url : `/${url}`}`;
}

