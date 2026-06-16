import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function AssetDetailLoading() {
  return (
    <div className="page-shell page-content space-y-4">
      <TableSkeleton columns={4} />
    </div>
  );
}
