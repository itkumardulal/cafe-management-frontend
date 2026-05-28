"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/src/lib/cn";

export function Dropdown({
  label,
  items,
}: {
  label: string;
  items: { id: string; label: string; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <div className="relative">
      <button
        type="button"
        className="touch-target inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-muted)]"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        {label}
        <ChevronDown size={16} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-2 min-w-36 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-md)]"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={cn(
                "touch-target w-full rounded-lg px-3 text-left text-sm text-[var(--color-muted)] hover:bg-[var(--color-cream-100)]",
              )}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
