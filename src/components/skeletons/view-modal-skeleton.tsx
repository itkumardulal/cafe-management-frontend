import { Skeleton } from "@/src/components/ui/skeleton";

export function ViewModalSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
