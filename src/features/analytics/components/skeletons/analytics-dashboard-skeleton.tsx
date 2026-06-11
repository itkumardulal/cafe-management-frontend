import { Card } from "@/src/components/ui/card";

export function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Card density="compact" className="h-24" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} density="compact" className="h-28" />
        ))}
      </div>
      <Card density="comfortable" className="h-80" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card density="comfortable" className="h-72" />
        <Card density="comfortable" className="h-72" />
      </div>
    </div>
  );
}
