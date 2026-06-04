"use client";

import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { tableOrdersScrollArea } from "@/src/components/table-orders/table-orders-layout";
import { StatusChip, TABLE_STATUS, type FloorTable } from "./table-status";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";

export type { FloorTable };

type BoardFilter = "all" | "vacant" | "active" | "billing";

const filterTabs: { id: BoardFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "vacant", label: "Vacant" },
  { id: "active", label: "Serving" },
  { id: "billing", label: "Billing" },
];

type TableFloorBoardProps = {
  tables: FloorTable[];
  loading: boolean;
  selectedTableIds: string[];
  onSelectTable: (table: FloorTable) => void;
};

export function TableFloorBoard({
  tables,
  loading,
  selectedTableIds,
  onSelectTable,
}: TableFloorBoardProps) {
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      vacant: tables.filter((t) => t.status === "VACANT").length,
      active: tables.filter((t) => t.status === "IN_PROGRESS").length,
      billing: tables.filter((t) => t.status === "IN_BILLING").length,
    }),
    [tables],
  );

  const filtered = useMemo(() => {
    let list = tables;
    if (filter === "vacant") list = list.filter((t) => t.status === "VACANT");
    if (filter === "active") list = list.filter((t) => t.status === "IN_PROGRESS");
    if (filter === "billing") list = list.filter((t) => t.status === "IN_BILLING");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.tableName.toLowerCase().includes(q));
    }
    return list;
  }, [tables, filter, search]);

  return (
    <div className="flex h-full min-h-0 flex-1 basis-0 flex-col overflow-hidden">
      <div className="shrink-0 space-y-3 border-b border-[var(--color-border)] px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <StatItem label="Vacant" value={counts.vacant} status="VACANT" />
          <StatItem label="Serving" value={counts.active} status="IN_PROGRESS" />
          <StatItem label="Billing" value={counts.billing} status="IN_BILLING" />
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
            aria-hidden
          />
          <Input
            className="h-9 bg-[var(--color-surface)] pl-9"
            placeholder="Search tables…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div
          className="inline-flex w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 p-0.5"
          role="tablist"
          aria-label="Filter tables"
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "min-w-0 flex-1 rounded-md px-2 py-1.5 text-center text-[11px] font-medium transition-colors",
                filter === tab.id
                  ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn(tableOrdersScrollArea, "p-4")}>
        {loading && tables.length === 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[7.5rem] animate-pulse rounded-xl bg-[var(--color-cream-100)]"
              />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <EmptyState
            title="No tables yet"
            description="Add dining tables under Tables in settings, then return here."
            className="border-0 shadow-none"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="no-results"
            title="No tables match"
            description="Try another filter or clear your search."
            className="border-0 shadow-none"
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-2">
            {filtered.map((t) => (
              <TableCard
                key={t.tableId}
                table={t}
                selected={selectedTableIds.includes(t.tableId)}
                onSelect={() => onSelectTable(t)}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-[var(--color-border)] px-4 py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-[var(--color-muted)]">
          <LegendDot status="VACANT" />
          <LegendDot status="IN_PROGRESS" />
          <LegendDot status="IN_BILLING" />
        </div>
      </footer>
    </div>
  );
}

function TableCard({
  table: t,
  selected,
  onSelect,
}: {
  table: FloorTable;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = TABLE_STATUS[t.status];
  const merged = t.sessionTableNames.length > 1;
  const hasOrder = t.lineCount > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-[7.5rem] flex-col rounded-xl border border-[var(--color-border)] border-l-[3px] p-3 text-left transition-all duration-150",
        meta.stripeClass,
        meta.cardClass,
        "hover:border-[var(--color-input)] hover:shadow-[var(--shadow-sm)]",
        "active:scale-[0.99]",
        selected &&
          "border-[var(--color-primary)] ring-2 ring-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] shadow-[var(--shadow-sm)]",
      )}
    >
      <p className="font-mono text-base font-semibold text-[var(--color-foreground)]" title={t.tableName}>
        {t.tableName}
      </p>
      <StatusChip
        status={t.status}
        pulse={t.status === "IN_PROGRESS" && hasOrder}
        className="mt-1.5 w-fit"
      />

      {merged ? (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
          <Users className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{t.sessionTableNames.join(" · ")}</span>
        </p>
      ) : null}

      {hasOrder && t.lastItemName ? (
        <div className={cn("min-w-0", merged ? "mt-1.5" : "mt-2")}>
          <p className="text-[10px] font-medium text-[var(--color-muted)]">Last added</p>
          <p
            className="mt-0.5 truncate text-sm font-semibold text-[var(--color-foreground)]"
            title={t.lastItemName}
          >
            {t.lastItemName}
          </p>
        </div>
      ) : !merged ? (
        <p className="mt-2 text-[11px] text-[var(--color-muted)]">{meta.hint}</p>
      ) : null}

      <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
        <span className="text-[11px] font-medium text-[var(--color-muted)]">
          {hasOrder ? `${t.lineCount} item${t.lineCount === 1 ? "" : "s"}` : "No items"}
        </span>
        {t.subtotal && Number(t.subtotal) > 0 ? (
          <span className="font-mono text-sm font-semibold tabular-nums text-[var(--color-primary)]">
            {formatMoney(t.subtotal)}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function StatItem({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: keyof typeof TABLE_STATUS;
}) {
  const meta = TABLE_STATUS[status];
  const active = value > 0;
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2",
        active
          ? cn("border-transparent shadow-[var(--shadow-sm)]", meta.statClass)
          : "border-[var(--color-border)] bg-[var(--color-surface)]",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} aria-hidden />
        <span
          className={cn(
            "font-mono text-base font-semibold tabular-nums",
            active ? meta.statValueClass : "text-[var(--color-foreground)]",
          )}
        >
          {value}
        </span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
    </div>
  );
}

function LegendDot({ status }: { status: keyof typeof TABLE_STATUS }) {
  const meta = TABLE_STATUS[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} aria-hidden />
      {meta.label}
    </span>
  );
}
