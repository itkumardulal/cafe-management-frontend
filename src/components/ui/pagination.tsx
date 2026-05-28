"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={onPrev} disabled={page <= 1}>
        <ChevronLeft size={16} />
      </Button>
      <span className="text-sm text-[var(--color-muted)]">
        Page {page} / {totalPages}
      </span>
      <Button variant="secondary" size="sm" onClick={onNext} disabled={page >= totalPages}>
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
