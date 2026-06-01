import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function CafeAdminsLoading() {
  return (
    <div className="space-y-4">
      <CardListSkeleton rows={3} />
      <TableSkeleton rows={3} columns={5} className="hidden md:block" />
    </div>
  );
}
