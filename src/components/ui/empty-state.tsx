import { Card } from "./card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="text-center">
      <h3 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
    </Card>
  );
}
