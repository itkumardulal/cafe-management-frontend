"use client";

import { Search, UtensilsCrossed } from "lucide-react";
import { Button } from "@/src/components/ui/button";

type PublicMenuEmptyStateProps = {
  variant: "empty" | "oos" | "search" | "error";
  searchQuery?: string;
  onClearSearch?: () => void;
  onRetry?: () => void;
};

export function PublicMenuEmptyState({
  variant,
  searchQuery,
  onClearSearch,
  onRetry,
}: PublicMenuEmptyStateProps) {
  const config = {
    empty: {
      title: "Menu coming soon",
      subtitle: "We're preparing something delicious for you.",
      Icon: UtensilsCrossed,
    },
    oos: {
      title: "Nothing available right now",
      subtitle: "Please ask our team about today's specials.",
      Icon: UtensilsCrossed,
    },
    search: {
      title: "No menu items found",
      subtitle: searchQuery
        ? `No match for "${searchQuery}". Try another dish or reset filters.`
        : "Try another dish name or reset filters.",
      Icon: Search,
    },
    error: {
      title: "Couldn't load menu",
      subtitle: "Check your connection and try again.",
      Icon: UtensilsCrossed,
    },
  }[variant];

  const Icon = config.Icon;

  return (
    <div className="public-menu-empty-state mt-4 flex flex-col items-center px-6 py-14 text-center">
      <span className="public-menu-icon-badge mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm">
        <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="public-menu-text text-base font-bold tracking-tight">{config.title}</p>
      <p className="public-menu-text-muted mt-2 max-w-[16rem] text-sm leading-relaxed">
        {config.subtitle}
      </p>
      {variant === "search" && onClearSearch ? (
        <button type="button" onClick={onClearSearch} className="public-menu-clear-btn mt-5">
          Reset filters
        </button>
      ) : null}
      {variant === "error" && onRetry ? (
        <Button type="button" variant="brand" size="sm" className="mt-5" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
