"use client";

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
import { RowActions } from "@/src/components/shared/row-actions";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type ExpenseEntryRow = {
  id: string;
  expenseItemId: string;
  expenseItemName: string;
  amount: string;
  expenseDate: string;
  notes?: string | null;
  createdAt: string;
};

type ExpenseItemOption = { id: string; name: string };

const emptyForm = {
  expenseItemId: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function DailyExpensesPage() {
  const [entries, setEntries] = useState<ExpenseEntryRow[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItemOption[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<ExpenseEntryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseEntryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadExpenseItems = useCallback(async () => {
    try {
      const data = await operationsApi.expenseItems.list({ limit: 100 });
      setExpenseItems(data.items.map((i) => ({ id: i.id, name: i.name })));
    } catch {
      setExpenseItems([]);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await operationsApi.expenseEntries.list({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: 100,
      });
      setEntries(
        data.items.map((item) => ({
          ...item,
          createdAt: item.createdAt ?? "",
        })),
      );
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load expenses"));
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void loadExpenseItems();
  }, [loadExpenseItems]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEdit(null);
    setForm({
      ...emptyForm,
      expenseDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const openEdit = (entry: ExpenseEntryRow) => {
    setEdit(entry);
    setForm({
      expenseItemId: entry.expenseItemId,
      amount: entry.amount,
      expenseDate: String(entry.expenseDate).slice(0, 10),
      notes: entry.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!edit && !form.expenseItemId) {
      appToast.error("Select an expense item");
      return;
    }
    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      appToast.error("Enter a valid amount greater than zero");
      return;
    }
    if (!form.expenseDate) {
      appToast.error("Expense date is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        expenseItemId: form.expenseItemId,
        amount,
        expenseDate: form.expenseDate,
        notes: form.notes.trim() || undefined,
      };
      if (edit) {
        await operationsApi.expenseEntries.update(edit.id, payload);
        appToast.success("Expense updated");
      } else {
        await operationsApi.expenseEntries.create(payload);
        appToast.success("Expense recorded");
      }
      setOpen(false);
      void load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save expense"));
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
      await operationsApi.expenseEntries.remove(deleteTarget.id);
      appToast.success("Expense deleted");
      setDeleteTarget(null);
      void load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete expense"));
    } finally {
      setDeleting(false);
    }
  };

  const canAddExpense = expenseItems.length > 0;

  return (
    <section className="page-shell page-content space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Daily expenses</h1>
          <p className="text-muted">Log day-to-day cafe expenses from your expense item catalog.</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate} disabled={!canAddExpense}>
          Add expense
        </Button>
      </div>

      {!canAddExpense ? (
        <p className="text-sm text-muted">
          Add at least one expense item before recording daily expenses.
        </p>
      ) : null}

      <Card density="compact" className="p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle">Date range</h2>
          <p className="mt-1 text-sm text-muted">Filter entries by expense date.</p>
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

      {entries.length === 0 ? (
        <EmptyState
          title="No expenses"
          description="Record expenses for the selected period, or clear the date filter."
        />
      ) : (
        <Card density="compact" className="overflow-hidden p-0">
          <ResponsiveTable
            headers={[
              "Expense item",
              { label: "Amount", thClassName: "text-right" },
              "Expense date",
              "Recorded",
              "Notes",
              {
                label: "Actions",
                thClassName: "text-right",
                labelWrapperClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Daily expenses"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[52rem]"
          >
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-(--color-border) last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                  {entry.expenseItemName}
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                  {formatMoney(entry.amount)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {formatDateOnly(entry.expenseDate)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {entry.createdAt ? formatDateOnly(entry.createdAt) : "—"}
                </td>
                <td className="max-w-[220px] px-4 py-3.5 text-sm text-muted">
                  {entry.notes?.trim() ? (
                    <span className="line-clamp-2" title={entry.notes}>
                      {entry.notes}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className={tableActionsCellClass}>
                    <RowActions
                      showLabels
                      onEdit={() => openEdit(entry)}
                      onDelete={() => setDeleteTarget(entry)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      )}

      <Modal
        open={deleteTarget !== null}
        title="Delete expense?"
        description="This action cannot be undone."
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Are you sure you want to delete the expense for{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.expenseItemName}</span>
            {deleteTarget ? ` (${formatMoney(deleteTarget.amount)})` : null}?
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
        open={open}
        size="lg"
        title={edit ? "Edit expense" : "New expense"}
        description={
          edit
            ? "Update amount, date, or notes for this expense entry."
            : "Record a daily expense against an item from your catalog."
        }
        onClose={() => {
          if (!saving) {
            setOpen(false);
          }
        }}
      >
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Expense details
            </h3>

            {edit ? (
              <div className="rounded-xl border border-(--color-border) bg-surface-muted px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  Expense item
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{edit.expenseItemName}</p>
                <p className="mt-0.5 text-xs text-muted">
                  To change the item, delete this entry and create a new one.
                </p>
              </div>
            ) : (
              <Field id="item" label="Expense item" required hint="From your expense items catalog">
                <Select
                  value={form.expenseItemId}
                  onChange={(e) => setForm((f) => ({ ...f, expenseItemId: e.target.value }))}
                  disabled={expenseItems.length === 0}
                >
                  <option value="">Choose expense item</option>
                  {expenseItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="amount" label="Amount" required hint="Expense amount in your local currency">
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 1500.00"
                />
              </Field>
              <Field id="date" label="Expense date" required>
                <Input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
                />
              </Field>
            </div>

            <Field id="notes" label="Notes" hint="Optional — receipt ref, payment method, etc.">
              <textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Paid in cash, invoice #1042"
                className={cn(
                  "w-full resize-y rounded-xl border bg-(--color-surface) px-3 py-2.5 text-sm text-foreground",
                  "placeholder:text-subtle outline-none transition-colors",
                  "border-input focus:border-primary",
                )}
              />
            </Field>
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-(--color-border) pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} loading={saving}>
              {edit ? "Save changes" : "Record expense"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
