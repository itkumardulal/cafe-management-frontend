import { Skeleton } from "@/src/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-7 w-28" />
      {Array.from({ length: 6 }).map((_, idx) => (
        <Skeleton key={idx} className="h-10 w-full" />
      ))}
    </div>
  );
}
