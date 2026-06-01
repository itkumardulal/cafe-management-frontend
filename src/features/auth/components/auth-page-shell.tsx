"use client";

import Image from "next/image";
import { useEffect, type ReactNode } from "react";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";

export const authPasswordToggleClass =
  "input-password-toggle absolute right-2 top-1/2 z-20 -translate-y-1/2";

type AuthPageShellProps = {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  banner?: ReactNode;
  compact?: boolean;
};

export function AuthPageShell({
  title,
  subtitle,
  children,
  banner,
  compact = false,
}: AuthPageShellProps) {
  useEffect(() => {
    const { body, documentElement } = document;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = documentElement.style.overflow;
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevBodyOverflow;
      documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <div className="grid h-svh max-h-svh w-full overflow-hidden bg-[var(--color-background)] lg:grid-cols-2">
      <div className="relative hidden lg:block lg:h-full lg:min-h-0">
        <Image
          src="/logo.jpeg"
          alt="Cafe interior"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-black/20 to-transparent" />
      </div>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <main
          className={cn(
            "safe-bottom flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden",
            compact ? "px-3 py-3 sm:px-6" : "px-3 py-4 sm:px-8 sm:py-6",
          )}
        >
          <Card
            density={compact ? "compact" : "comfortable"}
            className="w-full max-w-md shrink-0 rounded-2xl sm:rounded-3xl"
          >
            <div className="mb-3 flex justify-center lg:hidden">
              <Image
                src="/logo.jpeg"
                alt=""
                width={120}
                height={40}
                className="h-9 w-auto rounded-lg object-cover"
                loading="lazy"
              />
            </div>
            <h1 className="heading-display text-[var(--color-foreground)]">{title}</h1>
            <div className="mt-1.5 text-sm leading-snug text-muted">{subtitle}</div>
            {banner ? <div className="mt-3">{banner}</div> : null}
            <div className={banner ? "mt-4" : "mt-4"}>{children}</div>
          </Card>
        </main>
      </div>
    </div>
  );
}
