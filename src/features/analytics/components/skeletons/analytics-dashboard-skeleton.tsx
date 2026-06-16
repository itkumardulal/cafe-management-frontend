import { Card } from "@/src/components/ui/card";

export function AnalyticsDashboardSkeleton() {
  return (
    <div className="min-w-0 w-full max-w-full space-y-6 animate-pulse">
      <Card density="compact" className="h-24 w-full min-w-0" />
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} density="compact" className="h-28 w-full min-w-0" />
        ))}
      </div>
      <Card density="comfortable" className="h-80 w-full min-w-0" />
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card density="comfortable" className="h-72 w-full min-w-0" />
        <Card density="comfortable" className="h-72 w-full min-w-0" />
      </div>
    </div>
  );
}
