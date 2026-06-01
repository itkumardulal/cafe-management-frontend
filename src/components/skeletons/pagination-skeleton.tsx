import { Skeleton } from "@/src/components/ui/skeleton";

export function PaginationSkeleton() {
  return (
    <div
      aria-hidden
      className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6 sm:py-3.5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-44" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
    </div>
  );
}
