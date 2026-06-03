import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function CustomerReceivablesLoading() {
  return <TableSkeleton columns={7} rows={8} />;
}
