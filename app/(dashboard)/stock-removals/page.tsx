"use client";

import { Eye, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
} from "@/src/components/ui/table";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { formatDateTime, formatMoney } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type Line = { menuItemId: string; quantity: string };

type RemovalRow = {
  id: string;
  receiptNo: string;
  entryAt: string;
  createdAt: string;
  reason: string;
  notes?: string | null;
  staffName: string | null;
  createdByName: string | null;
  lineCount: number;
};

type RemovalDetail = RemovalRow & {
  lines: Array<{
    id: string;
    menuItemId: string;
    menuItemName: string;
    quantity: string;
  }>;
};

type StaffOption = { id: string; fullName: string; staffId: string | null };

function reasonLabel(reason: string) {
  return reason === "STAFF_USE" ? "Staff use" : "Damage";
}

const emptyLine = (): Line => ({ menuItemId: "", quantity: "1" });

export default function StockRemovalsPage() {
  const [removals, setRemovals] = useState<RemovalRow[]>([]);
  const [sellable, setSellable] = useState<{ id: string; name: string; quantityOnHand: string }[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entryAt, setEntryAt] = useState(new Date().toISOString().slice(0, 16));
  const [reason, setReason] = useState<"DAMAGE" | "STAFF_USE">("DAMAGE");
  const [staffUserId, setStaffUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRemoval, setViewRemoval] = useState<RemovalDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RemovalRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRefs = useCallback(async () => {
    const [stockResult, staffResult] = await Promise.allSettled([
      operationsApi.menuItems.sellableStock(),
      operationsApi.stockRemovals.staffOptions(),
    ]);
    if (stockResult.status === "fulfilled") {
      setSellable(stockResult.value);
    } else {
      setSellable([]);
    }
    if (staffResult.status === "fulfilled") {
      setStaffOptions(staffResult.value);
    } else {
      setStaffOptions([]);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await operationsApi.stockRemovals.list({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: 100,
      });
      setRemovals(
        data.items.map((item) => ({
          ...item,
          createdAt: item.createdAt ?? "",
          lineCount: item.lineCount ?? 0,
        })),
      );
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load stock removals"));
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEntryAt(new Date().toISOString().slice(0, 16));
    setReason("DAMAGE");
    setStaffUserId("");
    setNotes("");
    setLines([emptyLine()]);
    setOpen(true);
  };

  const openView = async (id: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewRemoval(null);
    try {
      const detail = await operationsApi.stockRemovals.getOne(id);
      setViewRemoval({
        ...detail,
        createdAt: detail.createdAt ?? "",
        lineCount: detail.lineCount ?? detail.lines.length,
      });
    } catch (error) {
      setViewOpen(false);
      appToast.error(getApiErrorMessage(error, "Failed to load removal details"));
    } finally {
      setViewLoading(false);
    }
  };

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const removeLine = (index: number) => {
    setLines((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
  };

  const addLine = () => {
    setLines((current) => [...current, emptyLine()]);
  };

  const submit = async () => {
    if (reason === "STAFF_USE" && !staffUserId) {
      appToast.error("Select a staff member for staff use");
      return;
    }

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const row = i + 1;
      if (!line.menuItemId) {
        appToast.error(`Line ${row}: select a menu item`);
        return;
      }
      const qty = Number(line.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        appToast.error(`Line ${row}: enter a valid quantity`);
        return;
      }
    }

    setSaving(true);
    try {
      await operationsApi.stockRemovals.create({
        entryAt: new Date(entryAt).toISOString(),
        reason,
        staffUserId: reason === "STAFF_USE" ? staffUserId : undefined,
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: Number(l.quantity),
        })),
      });
      appToast.success("Stock removal recorded");
      setOpen(false);
      void load();
      void loadRefs();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save removal"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await operationsApi.stockRemovals.remove(deleteTarget.id);
      appToast.success("Stock removal deleted");
      setDeleteTarget(null);
      void load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete stock removal"));
    } finally {
      setDeleting(false);
    }
  };

  const canCreate = sellable.length > 0;

  return (
    <section className="page-shell page-content space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Stock removals</h1>
          <p className="text-muted">
            Record damage or staff use — reduces menu item stock. Staff use requires a staff name.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate} disabled={!canCreate}>
          New removal
        </Button>
      </div>

      {!canCreate ? (
        <p className="text-sm text-muted">
          Add menu items with stock before recording removals.
        </p>
      ) : null}

      <Card density="compact" className="p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle">Date range</h2>
          <p className="mt-1 text-sm text-muted">Filter by entry date and time.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field id="from" label="From">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </Field>
          <Field id="to" label="To">
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </Field>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Apply filter
          </Button>
        </div>
      </Card>

      {removals.length === 0 ? (
        <EmptyState
          title="No removals"
          description="Record stock removals when items are lost or used by staff."
        />
      ) : (
        <Card density="compact" className="overflow-hidden p-0">
          <ResponsiveTable
            headers={[
              "Receipt",
              "Entry date",
              "Recorded",
              "Reason",
              { label: "Lines", thClassName: "text-right" },
              "Notes",
              {
                label: "Actions",
                thClassName: "text-right",
                labelWrapperClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Stock removals"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[56rem]"
          >
            {removals.map((r) => (
              <tr key={r.id} className="border-t border-(--color-border) last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                  {r.receiptNo}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {formatDateTime(r.entryAt)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {r.createdAt ? formatDateTime(r.createdAt) : "—"}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted">
                  <span>{reasonLabel(r.reason)}</span>
                  {r.reason === "STAFF_USE" && r.staffName ? (
                    <span className="mt-0.5 block text-xs text-subtle">{r.staffName}</span>
                  ) : null}
                  {r.createdByName ? (
                    <span className="mt-0.5 block text-xs text-subtle">
                      Recorded by {r.createdByName}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted">
                  {r.lineCount}
                </td>
                <td className="max-w-[200px] px-4 py-3.5 text-sm text-muted">
                  {r.notes?.trim() ? (
                    <span className="line-clamp-2" title={r.notes}>
                      {r.notes}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className={tableActionsCellClass}>
                    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
                      <Button type="button" size="sm" variant="secondary" onClick={() => void openView(r.id)}>
                        <span className="inline-flex items-center gap-1.5">
                          <Eye size={15} strokeWidth={1.75} aria-hidden />
                          View
                        </span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setDeleteTarget(r)}
                        className="border-danger/50 text-danger hover:border-danger hover:bg-danger/10 hover:text-danger"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                          Delete
                        </span>
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      )}

      <Modal
        open={deleteTarget !== null}
        title="Delete stock removal?"
        description="This action cannot be undone. Stock quantities will not be restored."
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Are you sure you want to delete removal{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.receiptNo}</span>?
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              No
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void confirmDelete()}
              loading={deleting}
            >
              Yes, delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={viewOpen}
        size="lg"
        title="Removal details"
        description={
          viewRemoval
            ? `${viewRemoval.receiptNo} · ${formatDateTime(viewRemoval.entryAt)}`
            : "Loading removal details…"
        }
        onClose={() => {
          if (!viewLoading) {
            setViewOpen(false);
            setViewRemoval(null);
          }
        }}
      >
        <div className="space-y-5">
          {viewLoading ? (
            <p className="py-8 text-center text-sm text-muted">Loading removal…</p>
          ) : viewRemoval ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Reason</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {reasonLabel(viewRemoval.reason)}
                  </p>
                  {viewRemoval.staffName ? (
                    <p className="mt-0.5 text-xs text-muted">Staff: {viewRemoval.staffName}</p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Recorded</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {viewRemoval.createdAt ? formatDateTime(viewRemoval.createdAt) : "—"}
                  </p>
                  {viewRemoval.createdByName ? (
                    <p className="mt-0.5 text-xs text-muted">by {viewRemoval.createdByName}</p>
                  ) : null}
                </div>
              </div>

              {viewRemoval.notes?.trim() ? (
                <div className="rounded-xl border border-(--color-border) bg-surface-muted px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Notes</p>
                  <p className="mt-1 text-sm text-foreground">{viewRemoval.notes.trim()}</p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-sm)">
                <div className="border-b border-(--color-border) bg-surface-muted px-4 py-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Line items</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {viewRemoval.lineCount} {viewRemoval.lineCount === 1 ? "item" : "items"} removed
                  </p>
                </div>
                <ResponsiveTable
                  headers={["Menu item", { label: "Quantity", thClassName: "text-right" }]}
                  ariaLabel="Removal line items"
                  density="compact"
                  className="border-0 shadow-none [&_table]:min-w-full"
                >
                  {viewRemoval.lines.map((line, idx) => (
                    <tr key={line.id ?? idx} className="border-t border-(--color-border) last:border-b-0">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {line.menuItemName}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-foreground">
                        {formatMoney(line.quantity)}
                      </td>
                    </tr>
                  ))}
                </ResponsiveTable>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setViewOpen(false);
                setViewRemoval(null);
              }}
              disabled={viewLoading}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={open}
        size="xl"
        title="New stock removal"
        description="Record items removed from stock due to damage or staff use."
        onClose={() => {
          if (!saving) {
            setOpen(false);
          }
        }}
      >
        <div className="space-y-6 pb-2">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Removal details
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="entryAt" label="Date & time" required>
                <Input
                  type="datetime-local"
                  value={entryAt}
                  onChange={(e) => setEntryAt(e.target.value)}
                />
              </Field>
              <Field id="reason" label="Reason" required>
                <Select
                  value={reason}
                  onChange={(e) => {
                    const next = e.target.value as "DAMAGE" | "STAFF_USE";
                    setReason(next);
                    if (next === "DAMAGE") {
                      setStaffUserId("");
                    }
                  }}
                >
                  <option value="DAMAGE">Damage</option>
                  <option value="STAFF_USE">Staff use</option>
                </Select>
              </Field>
            </div>
            {reason === "STAFF_USE" ? (
              <Field id="staff" label="Staff name" required hint="Who used the stock">
                <Select value={staffUserId} onChange={(e) => setStaffUserId(e.target.value)}>
                  <option value="">Choose staff</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                      {s.staffId ? ` (${s.staffId})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field id="notes" label="Notes" hint="Optional — context for this removal">
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Broken during prep, staff meal"
                className={cn(
                  "w-full resize-y rounded-xl border bg-(--color-surface) px-3 py-2.5 text-sm text-foreground",
                  "placeholder:text-subtle outline-none transition-colors",
                  "border-input focus:border-primary",
                )}
              />
            </Field>
          </section>

          <section className="space-y-3 border-t border-(--color-border) pt-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Line items</h3>
                <p className="mt-1 text-sm text-muted">Menu items and quantities removed from stock.</p>
              </div>
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                {lines.length} {lines.length === 1 ? "line" : "lines"}
              </span>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => (
                <article
                  key={idx}
                  className="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-sm)"
                >
                  <header className="flex items-center justify-between gap-3 border-b border-(--color-border) bg-surface-muted px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-sm font-semibold text-primary">
                      {idx + 1}
                    </span>
                    {lines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface) text-danger transition-colors hover:border-danger/30 hover:bg-danger/8"
                        aria-label={`Remove line ${idx + 1}`}
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    ) : null}
                  </header>
                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <Field id={`item-${idx}`} label="Menu item" required>
                      <Select
                        value={line.menuItemId}
                        onChange={(e) => updateLine(idx, { menuItemId: e.target.value })}
                        disabled={sellable.length === 0}
                      >
                        <option value="">Choose menu item</option>
                        {sellable.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (stock: {formatMoney(s.quantityOnHand)})
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field id={`qty-${idx}`} label="Quantity" required>
                      <Input
                        type="number"
                        min={0.0001}
                        step="0.01"
                        placeholder="e.g. 2"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                      />
                    </Field>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex justify-start">
              <Button type="button" variant="secondary" size="sm" onClick={addLine} disabled={!canCreate}>
                <span className="inline-flex items-center gap-1.5">
                  <Plus size={15} aria-hidden />
                  Add line
                </span>
              </Button>
            </div>
          </section>

          <div className="sticky bottom-0 -mx-5 flex flex-wrap justify-end gap-2 border-t border-(--color-border) bg-(--color-surface)/95 px-5 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submit()} loading={saving} disabled={!canCreate}>
              Record removal
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
