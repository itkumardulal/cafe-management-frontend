import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";

export default function Loading() {
  return (
    <section className="page-shell page-content">
      <TableSkeleton columns={4} />
    </section>
  );
}
