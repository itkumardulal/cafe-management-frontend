import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function RecipesLoading() {
  return (
    <div className="space-y-4">
      <CardListSkeleton />
      <TableSkeleton columns={4} className="hidden md:block" />
      <PaginationSkeleton />
    </div>
  );
}
