import { Suspense } from "react";
import { ReportsHubPage } from "@/src/features/reports/components/reports-hub-content";

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsHubPage />
    </Suspense>
  );
}
