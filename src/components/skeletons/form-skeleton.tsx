import { Skeleton } from "@/src/components/ui/skeleton";

export function FormSkeleton() {
  return (
    <div className="surface-card space-y-3 p-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
