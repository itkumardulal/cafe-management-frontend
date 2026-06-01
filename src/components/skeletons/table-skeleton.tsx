import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/cn";

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("surface-card overflow-hidden p-0", className)} aria-hidden>
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[640px] w-full">
          <div className="sticky top-0 flex gap-4 border-b border-[var(--color-border)] bg-[var(--color-cream-100)] px-4 py-3">
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={`head-${index}`} className="h-4 flex-1" />
            ))}
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex gap-4 px-4 py-3.5">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
