import { EmptyState } from "@/src/components/ui/empty-state";

export function NotAuthorized({ description }: { description: string }) {
  return (
    <section className="page-shell page-content">
      <EmptyState title="Access denied" description={description} />
    </section>
  );
}
