"use client";

import { Menu } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ThemeToggle } from "@/src/components/shared/theme-toggle";
import { getUserInitials } from "@/src/lib/user-initials";
import { useAppSelector } from "@/src/store/hooks";

export function Header({
  onOpenMobileNav,
  mobileNavOpen = false,
}: {
  onOpenMobileNav: () => void;
  mobileNavOpen?: boolean;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const cafeName = user?.cafe?.cafeName ?? "Cafe Management";
  const cafeLogo = user?.cafe?.logo;
  const initials = getUserInitials(user?.fullName);

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-(--color-border) bg-(--color-surface)/95 px-4 py-2.5 backdrop-blur sm:px-6 lg:py-3">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="shrink-0 lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation"
          >
            <Menu size={18} aria-hidden />
          </Button>
          <div className="flex min-w-0 items-center gap-2.5">
            {cafeLogo ? (
              <img
                src={cafeLogo}
                alt={`${cafeName} logo`}
                loading="lazy"
                className="h-8 w-8 shrink-0 rounded-full border border-(--color-border) object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{cafeName}</p>
              <p className="hidden text-xs text-muted sm:block">Workspace</p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-cream-100) text-[11px] font-semibold text-foreground sm:hidden"
            aria-hidden
          >
            {initials}
          </div>
          <p className="hidden text-sm text-muted sm:block">{user?.fullName ?? "Team member"}</p>
        </div>
      </div>
    </header>
  );
}
