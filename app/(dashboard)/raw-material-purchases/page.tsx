"use client";

import { AlertCircle, Eye, Plus, Printer, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  RawMaterialPurchaseReceipt,
  type RmPurchaseReceiptData,
} from "@/src/components/purchases/raw-material-purchase-receipt";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { ResponsiveTable, tableActionsCellClass, tableActionsColumnClass } from "@/src/components/ui/table";
import { Select } from "@/src/components/ui/select";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatDateTime, formatMoney } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppSelector } from "@/src/store/hooks";

type Line = {
  rawMaterialItemId: string;
  supplierId: string;
  quantity: string;
  ratePerUnit: string;
};

const emptyLine = (): Line => ({
  rawMaterialItemId: "",
  supplierId: "",
  quantity: "1",
  ratePerUnit: "",
});

function lineTotal(quantity: string, ratePerUnit: string): number {
  const qty = Number(quantity);
  const rate = Number(ratePerUnit);
  if (Number.isNaN(qty) || Number.isNaN(rate)) {
    return 0;
  }
  return qty * rate;
}

type PurchaseRow = {
  id: string;
  receiptNo: string;
  purchaseDate: string;
  createdAt: string;
  notes?: string | null;
  lineCount: number;
  grandTotal: string;
};

const actionIconClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50";

export default function RawMaterialPurchasesPage() {
  const authUser = useAppSelector((state) => state.auth.user);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [materials, setMaterials] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<RmPurchaseReceiptData | null>(null);
  const [printPurchase, setPrintPurchase] = useState<RmPurchaseReceiptData | null>(null);
  const printAfterRender = useRef(false);

  const grandTotal = useMemo(
    () => lines.reduce((sum, line) => sum + lineTotal(line.quantity, line.ratePerUnit), 0),
    [lines],
  );

  const load = useCallback(async () => {
    try {
      const data = await operationsApi.rmPurchases.list({ limit: 50 });
      setPurchases(
        data.items.map((item) => ({
          id: item.id,
          receiptNo: item.receiptNo,
          purchaseDate: item.purchaseDate,
          createdAt: item.createdAt ?? "",
          notes: item.notes,
          lineCount: item.lineCount ?? 0,
          grandTotal: item.grandTotal ?? "0",
        })),
      );
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load purchases"));
    }
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const [m, s] = await Promise.all([
        operationsApi.rawMaterials.list(),
        operationsApi.suppliers.list(),
      ]);
      setMaterials(m.items.map((i) => ({ id: i.id, name: i.name })));
      setSuppliers(s.items.map((i) => ({ id: i.id, name: i.name })));
    } catch {
      appToast.error("Failed to load materials or suppliers");
    }
  }, []);

  useEffect(() => {
    void load();
    void loadRefs();
  }, [load, loadRefs]);

  const openCreate = () => {
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setLines([emptyLine()]);
    setOpen(true);
  };

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  };

  const removeLine = (index: number) => {
    setLines((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
  };

  const addLine = () => {
    setLines((current) => [...current, emptyLine()]);
  };

  const submit = async () => {
    if (!purchaseDate) {
      appToast.error("Purchase date is required");
      return;
    }

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const row = i + 1;
      if (!line.rawMaterialItemId) {
        appToast.error(`Line ${row}: select a raw material`);
        return;
      }
      if (!line.supplierId) {
        appToast.error(`Line ${row}: select a supplier`);
        return;
      }
      const qty = Number(line.quantity);
      const rate = Number(line.ratePerUnit);
      if (Number.isNaN(qty) || qty <= 0) {
        appToast.error(`Line ${row}: enter a valid quantity`);
        return;
      }
      if (Number.isNaN(rate) || rate < 0) {
        appToast.error(`Line ${row}: enter a valid rate`);
        return;
      }
    }

    setSaving(true);
    try {
      await operationsApi.rmPurchases.create({
        purchaseDate,
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({
          rawMaterialItemId: l.rawMaterialItemId,
          supplierId: l.supplierId,
          quantity: Number(l.quantity),
          ratePerUnit: Number(l.ratePerUnit),
        })),
      });
      appToast.success("Purchase recorded");
      setOpen(false);
      void load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save purchase"));
    } finally {
      setSaving(false);
    }
  };

  const hasRefs = materials.length > 0 && suppliers.length > 0;

  const cafeNameFallback = authUser?.cafe?.cafeName;

  const fetchPurchaseDetail = useCallback(async (id: string) => {
    const detail = await operationsApi.rmPurchases.getOne(id);
    const lines = detail.lines ?? [];
    const grandTotal =
      detail.grandTotal ??
      String(lines.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0));
    return {
      receiptNo: detail.receiptNo,
      purchaseDate: detail.purchaseDate,
      createdAt: detail.createdAt ?? "",
      notes: detail.notes,
      createdByName: detail.createdByName,
      lineCount: detail.lineCount ?? lines.length,
      grandTotal,
      cafe: detail.cafe,
      lines,
    } satisfies RmPurchaseReceiptData;
  }, []);

  const openView = async (id: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewPurchase(null);
    try {
      setViewPurchase(await fetchPurchaseDetail(id));
    } catch (error) {
      setViewOpen(false);
      appToast.error(getApiErrorMessage(error, "Failed to load purchase"));
    } finally {
      setViewLoading(false);
    }
  };

  const handlePrint = async (id: string) => {
    try {
      const detail = await fetchPurchaseDetail(id);
      printAfterRender.current = true;
      setPrintPurchase(detail);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load receipt for printing"));
    }
  };

  useEffect(() => {
    if (!printPurchase || !printAfterRender.current) {
      return;
    }
    printAfterRender.current = false;
    const timer = window.setTimeout(() => {
      window.print();
      setPrintPurchase(null);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [printPurchase]);

  return (
    <section className="page-shell page-content space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Raw material purchases</h1>
          <p className="text-muted">
            Purchase receipts for expenses. These records do not update inventory stock.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          New purchase
        </Button>
      </div>

      {!hasRefs ? (
        <p className="text-sm text-muted">
          Add at least one raw material and one supplier before you can save a purchase.
        </p>
      ) : null}

      {purchases.length === 0 ? (
        <EmptyState title="No purchases" description="Record your first raw material purchase." />
      ) : (
        <Card density="compact" className="overflow-hidden p-0">
          <ResponsiveTable
            headers={[
              "Receipt",
              "Purchase date",
              "Recorded",
              { label: "Lines", thClassName: "text-right" },
              { label: "Grand total", thClassName: "text-right", labelWrapperClassName: "ml-auto text-right" },
              { label: "Actions", thClassName: "text-right", labelWrapperClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Purchases"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[52rem]"
          >
            {purchases.map((p) => (
              <tr key={p.id} className="border-t border-(--color-border) last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                  {p.receiptNo}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {formatDateOnly(p.purchaseDate)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  <span title={p.createdAt}>{formatDateTime(p.createdAt)}</span>
                </td>
                <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted">
                  {p.lineCount ?? 0}
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                  {formatMoney(p.grandTotal)}
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className={actionIconClass}
                        aria-label={`View receipt ${p.receiptNo}`}
                        onClick={() => void openView(p.id)}
                      >
                        <Eye size={16} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={actionIconClass}
                        aria-label={`Print receipt ${p.receiptNo}`}
                        onClick={() => void handlePrint(p.id)}
                      >
                        <Printer size={16} strokeWidth={1.75} aria-hidden />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      )}

      <Modal
        open={viewOpen}
        size="lg"
        title="Purchase details"
        description={
          viewPurchase
            ? `${viewPurchase.receiptNo} · ${formatDateOnly(viewPurchase.purchaseDate)}`
            : "Loading purchase details…"
        }
        onClose={() => {
          if (!viewLoading) {
            setViewOpen(false);
            setViewPurchase(null);
          }
        }}
      >
        <div className="space-y-5">
          {viewLoading ? (
            <p className="py-8 text-center text-sm text-muted">Loading purchase…</p>
          ) : viewPurchase ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                    Purchase date
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDateOnly(viewPurchase.purchaseDate)}
                  </p>
                </div>
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                    Recorded
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDateTime(viewPurchase.createdAt)}
                  </p>
                  {viewPurchase.createdByName ? (
                    <p className="mt-0.5 text-xs text-muted">
                      by {viewPurchase.createdByName}
                    </p>
                  ) : null}
                </div>
              </div>

              {viewPurchase.notes?.trim() ? (
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface-muted) px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                    Notes
                  </p>
                  <p className="mt-1 text-sm text-foreground">{viewPurchase.notes.trim()}</p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-sm)">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-(--color-border) bg-(--color-surface-muted) px-4 py-3.5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                      Line items
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {viewPurchase.lineCount}{" "}
                      {viewPurchase.lineCount === 1 ? "line" : "lines"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                      Grand total
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                      {formatMoney(viewPurchase.grandTotal)}
                    </p>
                  </div>
                </div>

                <div className="p-0">
                  <ResponsiveTable
                    headers={[
                      "Item",
                      "Supplier",
                      { label: "Qty", thClassName: "text-right" },
                      { label: "Rate", thClassName: "text-right" },
                      { label: "Total", thClassName: "text-right" },
                    ]}
                    ariaLabel="Purchase line items"
                    density="compact"
                    className="border-0 shadow-none [&_table]:min-w-full"
                  >
                    {viewPurchase.lines.map((line, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-(--color-border) last:border-b-0"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          <div className="min-w-0">
                            <p className="truncate">{line.rawMaterialItem.name}</p>
                            <p className="mt-0.5 text-xs text-muted">
                              Unit: {line.rawMaterialItem.unit}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">
                          {line.supplier.name}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-muted">
                          {formatMoney(line.quantity)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-muted">
                          {formatMoney(line.ratePerUnit)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-foreground">
                          {formatMoney(line.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </ResponsiveTable>
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setViewOpen(false);
                setViewPurchase(null);
              }}
              disabled={viewLoading}
            >
              Close
            </Button>
            {viewPurchase ? (
              <Button
                type="button"
                onClick={() => {
                  printAfterRender.current = true;
                  setPrintPurchase(viewPurchase);
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Printer size={16} aria-hidden />
                  Print receipt
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      {typeof document !== "undefined" && printPurchase
        ? createPortal(
            <div id="rm-purchase-print-host" className="hidden print:flex">
              <RawMaterialPurchaseReceipt
                id="rm-purchase-receipt"
                purchase={printPurchase}
                cafeName={cafeNameFallback}
              />
            </div>,
            document.body,
          )
        : null}

      <Modal
        open={open}
        size="xl"
        title="New purchase"
        description="Record a purchase receipt with one or more line items. Totals are calculated automatically."
        onClose={() => {
          if (!saving) {
            setOpen(false);
          }
        }}
      >
        <div className="space-y-6 pb-2">
          {!hasRefs ? (
            <div
              className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3.5"
              role="status"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-[var(--color-primary)]"
                aria-hidden
              />
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                Before saving, add at least one entry on{" "}
                <a
                  href="/raw-materials"
                  className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  Raw materials
                </a>{" "}
                and{" "}
                <a
                  href="/suppliers"
                  className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  Suppliers
                </a>
                .
              </p>
            </div>
          ) : null}

          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
                Purchase details
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Receipt date and optional notes for this purchase.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
              <Field id="date" label="Purchase date" required>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </Field>
              <Field id="notes" label="Notes" hint="Optional — invoice ref, delivery note, etc.">
                <textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid in cash, delivery next week"
                  className={cn(
                    "w-full resize-y rounded-xl border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)]",
                    "placeholder:text-[var(--color-subtle)] outline-none transition-colors",
                    "border-[var(--color-input)] focus:border-[var(--color-primary)]",
                  )}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-[var(--color-border)] pt-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
                  Line items
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Each row is one material from a supplier with quantity and rate.
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
                {lines.length} {lines.length === 1 ? "line" : "lines"}
              </span>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => {
                const total = lineTotal(line.quantity, line.ratePerUnit);
                return (
                  <article
                    key={idx}
                    className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
                  >
                    <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/12 text-sm font-semibold text-[var(--color-primary)]"
                          aria-hidden
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--color-foreground)]">
                            Line item {idx + 1}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            Material, supplier, quantity & rate
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                            Line total
                          </p>
                          <p className="text-base font-semibold tabular-nums text-[var(--color-foreground)]">
                            {formatMoney(total)}
                          </p>
                        </div>
                        {lines.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-danger)] transition-colors hover:border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/8"
                            aria-label={`Remove line ${idx + 1}`}
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </header>

                    <div className="grid gap-4 p-4 sm:grid-cols-2">
                      <Field id={`material-${idx}`} label="Raw material" required>
                        <Select
                          value={line.rawMaterialItemId}
                          onChange={(e) =>
                            updateLine(idx, { rawMaterialItemId: e.target.value })
                          }
                          disabled={!hasRefs}
                        >
                          <option value="">Choose material</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field id={`supplier-${idx}`} label="Supplier" required>
                        <Select
                          value={line.supplierId}
                          onChange={(e) => updateLine(idx, { supplierId: e.target.value })}
                          disabled={!hasRefs}
                        >
                          <option value="">Choose supplier</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field id={`qty-${idx}`} label="Quantity" required>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                          placeholder="e.g. 10"
                          disabled={!hasRefs}
                        />
                      </Field>
                      <Field id={`rate-${idx}`} label="Rate per unit" required>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.ratePerUnit}
                          onChange={(e) => updateLine(idx, { ratePerUnit: e.target.value })}
                          placeholder="e.g. 120.00"
                          disabled={!hasRefs}
                        />
                      </Field>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
              <button
                type="button"
                onClick={addLine}
                disabled={!hasRefs}
                className={cn(
                  "flex w-full items-center justify-start gap-2 border-b border-dashed border-[var(--color-border)] px-4 py-3.5 text-sm font-medium transition-colors",
                  hasRefs
                    ? "text-[var(--color-primary)] hover:bg-[var(--color-cream-100)]"
                    : "cursor-not-allowed text-[var(--color-subtle)]",
                )}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8">
                  <Plus size={16} aria-hidden />
                </span>
                Add another line item
              </button>
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--color-surface-muted)] px-4 py-4 sm:px-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                    Summary
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                    {lines.length} line {lines.length === 1 ? "item" : "items"} on this receipt
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                    Grand total
                  </p>
                  <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-[var(--color-foreground)]">
                    {formatMoney(grandTotal)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 -mx-5 flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-5 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submit()}
              loading={saving}
              disabled={!hasRefs || saving}
            >
              Save purchase
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
