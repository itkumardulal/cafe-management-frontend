import { Card } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export function ReportsHubSkeleton() {
  return (
    <section className="page-shell page-content space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Card density="compact" className="space-y-3">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-9 w-80 max-w-full" />
      </Card>
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`p-${i}`} density="compact" className="space-y-2 p-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-28" />
            </Card>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`s-${i}`} density="compact" className="space-y-2 p-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-28" />
            </Card>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={`r-${i}`} density="comfortable" className="h-40 space-y-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReportDetailSkeleton({
  columns = 4,
  summaryCards = 4,
  showWaterfall = false,
}: {
  columns?: number;
  summaryCards?: number;
  showWaterfall?: boolean;
}) {
  return (
    <section className="page-shell page-content space-y-5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-lg" />
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: summaryCards }).map((_, i) => (
            <Card key={i} density="compact" className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
            </Card>
          ))}
        </div>
        {showWaterfall ? (
          <Card density="compact" className="space-y-3 p-4">
            <Skeleton className="h-3 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </Card>
        ) : null}
      </div>
      <TableSkeleton columns={columns} rows={6} />
    </section>
  );
}
