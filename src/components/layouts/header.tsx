"use client";

import { Menu } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useTheme } from "@/src/components/shared/theme-provider";
import { useAppSelector } from "@/src/store/hooks";
import { Moon, Sun } from "lucide-react";

export function Header({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const user = useAppSelector((state) => state.auth.user);
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = mounted && theme === "dark";
  const cafeName = user?.cafe?.cafeName ?? "Cafe Management";
  const cafeLogo = user?.cafe?.logo;

  return (
    <header className="sticky top-0 z-30 border-b border-(--color-border) bg-(--color-surface)/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
          >
            <Menu size={16} />
          </Button>
          <div className="flex items-center gap-2.5">
            {cafeLogo ? (
              <img
                src={cafeLogo}
                alt={`${cafeName} logo`}
                className="h-8 w-8 rounded-full border border-(--color-border) object-cover"
              />
            ) : null}
            <div>
              <p className="text-sm font-semibold text-foreground">{cafeName}</p>
              <p className="text-xs text-muted">Workspace</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-10 px-0 text-foreground"
          >
            {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </Button>
          <p className="hidden text-sm text-muted sm:block">
            {user?.fullName ?? "Team member"}
          </p>
        </div>
      </div>
    </header>
  );
}
