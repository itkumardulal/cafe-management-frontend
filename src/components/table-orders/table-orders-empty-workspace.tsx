import { ConciergeBell } from "lucide-react";

const steps = [
  { n: 1, title: "Select table", text: "Tap a vacant or serving table on the floor plan." },
  { n: 2, title: "Add dishes", text: "Search the menu and use Add on each dish to build the order." },
  { n: 3, title: "Send to POS", text: "Generate bill when guests are ready to pay." },
] as const;

export function TableOrdersEmptyWorkspace() {
  return (
    <div className="table-orders-scroll flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
        <ConciergeBell className="h-7 w-7" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-[var(--color-foreground)]">No table selected</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-[var(--color-muted)]">
        Choose a table from the floor plan to start or continue a dine-in order. Orders sync across
        devices automatically.
      </p>
      <ol className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-4"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] font-bold text-[var(--color-primary-foreground)]">
              {s.n}
            </span>
            <p className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
