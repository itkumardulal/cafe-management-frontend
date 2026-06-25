"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/src/lib/cn";

type MenuSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
};

export function MenuSearchBar({
  value,
  onChange,
  className,
  placeholder = "Search dishes…",
}: MenuSearchBarProps) {
  return (
    <div className={cn("public-menu-search-wrap", className)}>
      <span className="public-menu-search-icon" aria-hidden>
        <Search className="h-4 w-4" strokeWidth={2} />
      </span>
      <input
        type="text"
        role="searchbox"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search menu items"
        className="public-menu-search-input search-field-custom-clear"
      />
      {value.trim() ? (
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            onChange("");
          }}
          aria-label="Clear search"
          className="public-menu-search-clear touch-target absolute right-1 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
