import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PublicMenuView } from "@/src/components/public-menu/public-menu-view";
import { PublicMenuInvalidSlug } from "@/src/components/public-menu/public-menu-invalid";
import {
  fetchPublicMenu,
  PublicMenuInvalidSlugError,
  PublicMenuNotFoundError,
  resolvePublicMenuAssetUrl,
} from "@/src/services/public-menu-api";
import PublicMenuLoading from "./loading";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await fetchPublicMenu(slug);
    const title = `${data.cafe.cafeName} · Menu`;
    const logoUrl = resolvePublicMenuAssetUrl(data.cafe.logo);
    return {
      title,
      openGraph: {
        title,
        type: "website",
        ...(logoUrl ? { images: [{ url: logoUrl }] } : {}),
      },
    };
  } catch {
    return { title: "Menu" };
  }
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const data = await fetchPublicMenu(slug);
    return (
      <Suspense fallback={<PublicMenuLoading />}>
        <PublicMenuView data={data} />
      </Suspense>
    );
  } catch (error) {
    if (error instanceof PublicMenuNotFoundError) {
      notFound();
    }
    if (error instanceof PublicMenuInvalidSlugError) {
      return <PublicMenuInvalidSlug />;
    }
    throw error;
  }
}
