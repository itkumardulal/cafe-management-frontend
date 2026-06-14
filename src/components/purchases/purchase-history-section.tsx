"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, Package, Receipt } from "lucide-react";
import { BillStatusBadge, PaymentStatusBadge } from "@/src/components/purchases/ap-status-badges";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import {
  ResponsiveTable,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import type { BillSettlementSupplierDetail } from "@/src/lib/ap-types";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";

type PurchaseBill = BillSettlementSupplierDetail["purchaseHistory"][number];

function formatPurchaseLineCalc(quantity: string, ratePerUnit: string) {
  const qty = Number(quantity);
  const rate = Number(ratePerUnit);
  const qtyText = Number.isFinite(qty)
    ? Number.isInteger(qty)
      ? String(qty)
      : qty.toLocaleString(undefined, { maximumFractionDigits: 4 })
    : quantity;
  const rateText = Number.isFinite(rate) ? rate.toFixed(2) : ratePerUnit;
  return `${qtyText}*${rateText}`;
}

function sumMoney(values: string[]) {
  return values.reduce((sum, value) => sum + Number(value), 0);
}

function billTypeLabel(billKind?: PurchaseBill["billKind"], compact = false) {
  if (billKind === "DIRECT") return "Direct";
  return compact ? "Raw mat." : "Raw material";
}

function PurchaseLineItems({ lines }: { lines: PurchaseBill["lines"] }) {
  if (lines.length === 0) {
    return <p className="px-4 py-3 text-sm text-muted">No line items recorded.</p>;
  }

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-cream-50)]/60">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
        <Package className="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
          Line items ({lines.length})
        </p>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {lines.map((line) => (
          <li
            key={line.id}
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{line.name}</p>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                {formatPurchaseLineCalc(line.quantity, line.ratePerUnit)}
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatMoney(line.lineTotal)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PurchaseBillRow({
  bill,
  expanded,
  onToggle,
}: {
  bill: PurchaseBill;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasDue = Number(bill.remainingAmount) > 0.005;

  return (
    <Fragment>
      <tr
        className={cn(
          "cursor-pointer border-t border-[var(--color-border)] transition-colors",
          expanded
            ? "bg-[var(--color-primary-soft)]/40"
            : "hover:bg-[var(--color-surface-muted)]",
        )}
        onClick={onToggle}
      >
        <td className="px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-[var(--color-muted)] transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-medium text-foreground">
                {bill.receiptNo}
              </p>
              <p className="truncate text-[11px] text-muted">{billTypeLabel(bill.billKind, true)}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <p className="text-xs text-foreground">{formatDateOnly(bill.purchaseDate)}</p>
          {bill.dueDate ? (
            <p
              className={cn(
                "mt-0.5 text-[11px] leading-tight",
                bill.billStatus === "OVERDUE"
                  ? "font-medium text-red-600 dark:text-red-400"
                  : "text-muted",
              )}
            >
              Due {formatDateOnly(bill.dueDate)}
            </p>
          ) : null}
        </td>
        <td className={cn(tableCenterCellClass, "px-3 py-2.5 font-mono text-xs tabular-nums")}>
          {formatMoney(bill.grandTotal)}
        </td>
        <td className={cn(tableCenterCellClass, "px-3 py-2.5 font-mono text-xs tabular-nums text-muted")}>
          {formatMoney(bill.paidAmount)}
        </td>
        <td
          className={cn(
            tableCenterCellClass,
            "px-3 py-2.5 font-mono text-xs tabular-nums",
            hasDue && "font-semibold tone-warning-text",
          )}
        >
          {formatMoney(bill.remainingAmount)}
        </td>
        <td className="px-3 py-2.5">
          <div className="flex flex-wrap justify-center gap-1">
            <PaymentStatusBadge status={bill.paymentStatus} />
            <BillStatusBadge status={bill.billStatus} />
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-t-0">
          <td colSpan={6} className="p-0">
            <PurchaseLineItems lines={bill.lines} />
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

function PurchaseBillMobileCard({
  bill,
  expanded,
  onToggle,
}: {
  bill: PurchaseBill;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasDue = Number(bill.remainingAmount) > 0.005;

  return (
    <div className="space-y-0">
      <ListCard
        title={bill.receiptNo}
        subtitle={`${formatDateOnly(bill.purchaseDate)} · ${billTypeLabel(bill.billKind)}`}
        badge={
          <div className="flex flex-col items-end gap-1">
            <PaymentStatusBadge status={bill.paymentStatus} />
            <BillStatusBadge status={bill.billStatus} />
          </div>
        }
        fields={[
          { label: "Total", value: formatMoney(bill.grandTotal) },
          { label: "Paid", value: formatMoney(bill.paidAmount) },
          {
            label: "Due",
            value: (
              <span className={cn(hasDue && "font-semibold tone-warning-text")}>
                {formatMoney(bill.remainingAmount)}
              </span>
            ),
          },
          bill.dueDate
            ? {
                label: "Due date",
                value: formatDateOnly(bill.dueDate),
              }
            : {
                label: "Items",
                value: String(bill.lines.length),
              },
        ]}
        actions={
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)]"
          >
            {expanded ? "Hide items" : "View items"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </button>
        }
        className={cn(expanded && "rounded-b-none border-b-0 ring-1 ring-[var(--color-primary)]/25")}
      />
      {expanded ? (
        <div className="overflow-hidden rounded-b-xl border border-t-0 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          <PurchaseLineItems lines={bill.lines} />
        </div>
      ) : null}
    </div>
  );
}

export function PurchaseHistorySection({
  bills,
  className,
}: {
  bills: PurchaseBill[];
  className?: string;
}) {
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  const totals = useMemo(
    () => ({
      grandTotal: sumMoney(bills.map((bill) => bill.grandTotal)),
      paid: sumMoney(bills.map((bill) => bill.paidAmount)),
      due: sumMoney(bills.map((bill) => bill.remainingAmount)),
    }),
    [bills],
  );

  const toggleBill = (billId: string) => {
    setExpandedBillId((current) => (current === billId ? null : billId));
  };

  if (bills.length === 0) {
    return (
      <section className={className}>
        <EmptyState
          title="No purchase history"
          description="Purchase bills from this supplier will appear here once recorded."
          icon={Receipt}
        />
      </section>
    );
  }

  return (
    <section className={className}>
      <Card className="overflow-hidden border-[var(--color-border)] p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Purchase history</h2>
              <p className="text-xs text-muted">Tap a bill to view line items</p>
            </div>
          </div>
          <Badge size="sm" variant="default">
            {bills.length} {bills.length === 1 ? "bill" : "bills"}
          </Badge>
        </div>

        <ListCardStack className="p-3">
          {bills.map((bill) => (
            <PurchaseBillMobileCard
              key={bill.id}
              bill={bill}
              expanded={expandedBillId === bill.id}
              onToggle={() => toggleBill(bill.id)}
            />
          ))}
        </ListCardStack>

        <div className="hidden md:block min-w-0">
          <ResponsiveTable
            variant="embedded"
            density="compact"
            horizontalScroll={false}
            ariaLabel="Purchase history"
            className="[&_table]:table-fixed [&_table]:w-full"
            headers={[
              { label: "Bill", thClassName: "w-[24%]" },
              { label: "Date", thClassName: "w-[18%]" },
              { label: "Total", thClassName: cn(tableCenterColumnClass, "w-[14%]") },
              { label: "Paid", thClassName: cn(tableCenterColumnClass, "w-[14%]") },
              { label: "Due", thClassName: cn(tableCenterColumnClass, "w-[14%]") },
              { label: "Status", thClassName: cn(tableCenterColumnClass, "w-[16%]") },
            ]}
          >
            {bills.map((bill) => (
              <PurchaseBillRow
                key={bill.id}
                bill={bill}
                expanded={expandedBillId === bill.id}
                onToggle={() => toggleBill(bill.id)}
              />
            ))}
          </ResponsiveTable>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border)] bg-[var(--color-cream-50)]/80 px-4 py-3 sm:grid-cols-4">
          <SummaryStat label="Bills" value={String(bills.length)} />
          <SummaryStat label="Total purchased" value={formatMoney(totals.grandTotal)} />
          <SummaryStat label="Total paid" value={formatMoney(totals.paid)} />
          <SummaryStat
            label="Outstanding"
            value={formatMoney(totals.due)}
            highlight={totals.due > 0.005}
          />
        </div>
      </Card>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-medium tabular-nums",
          highlight ? "tone-warning-text" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
