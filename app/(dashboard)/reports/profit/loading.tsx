import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";

export default function ProfitReportLoading() {
  return <ReportDetailSkeleton columns={6} summaryCards={2} showWaterfall />;
}
