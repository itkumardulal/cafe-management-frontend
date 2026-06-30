import type { Metadata } from "next";
import { PublicMenuThemeLock } from "@/src/components/public-menu/public-menu-theme-lock";
import "./public-menu.css";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function PublicMenuLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="public-menu-page" data-theme="light">
      <PublicMenuThemeLock />
      {children}
    </div>
  );
}
