import { Skeleton } from "@/src/components/ui/skeleton";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="surface-card p-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: rows }).map((_, idx) => (
          <Skeleton key={idx} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
