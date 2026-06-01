import { Skeleton } from "@/src/components/ui/skeleton";

export function CardListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 md:hidden" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
        >
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
