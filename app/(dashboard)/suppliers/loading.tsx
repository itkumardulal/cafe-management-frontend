import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function SuppliersLoading() {
  return (
    <section className="page-shell page-content space-y-4">
      <div className="space-y-4">
        <TableSkeleton columns={4} />
        <PaginationSkeleton />
      </div>
    </section>
  );
}
