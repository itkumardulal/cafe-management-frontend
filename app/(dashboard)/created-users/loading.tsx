import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function CreatedUsersLoading() {
  return (
    <div className="space-y-4">
      <CardListSkeleton rows={4} />
      <TableSkeleton rows={4} columns={5} className="hidden md:block" />
    </div>
  );
}
