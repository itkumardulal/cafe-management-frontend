import { Skeleton } from "@/src/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <section className="space-y-4">
      <Skeleton className="h-8 w-44" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </section>
  );
}
