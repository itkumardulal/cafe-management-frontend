import { Skeleton } from "@/src/components/ui/skeleton";

export function CustomerReceivableDetailSkeleton() {
  return (
    <div className="page-shell page-content animate-pulse space-y-6 pb-10">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
