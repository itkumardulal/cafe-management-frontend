import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function BankTransactionsLoading() {
  return (
    <section className="page-shell page-content space-y-4">
      <div className="space-y-4">
        <TableSkeleton columns={7} />
        <PaginationSkeleton />
      </div>
    </section>
  );
}
