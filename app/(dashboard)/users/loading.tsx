import { FormSkeleton } from "@/src/components/skeletons/form-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function UsersLoading() {
  return (
    <section className="space-y-4">
      <FormSkeleton />
      <TableSkeleton />
    </section>
  );
}
