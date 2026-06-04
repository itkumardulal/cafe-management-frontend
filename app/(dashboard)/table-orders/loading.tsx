import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";

export default function TableOrdersLoading() {
  return (
    <section className="page-shell page-content">
      <CardListSkeleton />
    </section>
  );
}
