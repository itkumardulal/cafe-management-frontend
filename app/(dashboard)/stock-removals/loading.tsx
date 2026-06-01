import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function StockRemovalsLoading() {
  return (
    <section className="page-shell page-content space-y-4">
      <div className="space-y-4">
        <TableSkeleton columns={7} />
        <CardListSkeleton rows={3} />
        <PaginationSkeleton />
      </div>
    </section>
  );
}
