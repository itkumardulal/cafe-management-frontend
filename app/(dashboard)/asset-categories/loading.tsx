import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function AssetCategoriesLoading() {
  return (
    <div className="page-shell page-content space-y-4">
      <TableSkeleton columns={3} />
      <PaginationSkeleton />
      <CardListSkeleton />
    </div>
  );
}
