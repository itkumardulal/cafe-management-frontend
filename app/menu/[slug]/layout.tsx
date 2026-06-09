import type { Metadata } from "next";
import Script from "next/script";
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
      <Script id="public-menu-theme-lock" strategy="beforeInteractive">
        {`(function(){try{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}catch(e){}})();`}
      </Script>
      <PublicMenuThemeLock />
      {children}
    </div>
  );
}
