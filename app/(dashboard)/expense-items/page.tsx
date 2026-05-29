"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
} from "@/src/components/ui/table";
import { Select } from "@/src/components/ui/select";
import { RowActions } from "@/src/components/shared/row-actions";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { MONTHLY_SHEET_CATEGORIES } from "@/src/lib/expense-categories";
import { formatDateOnly } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type Row = {
  id: string;
  name: string;
  description?: string | null;
  monthlySheetCategory: string;
  createdAt: string;
  salaryStaffUserId?: string | null;
  salaryStaffName?: string | null;
};
type StaffOption = { id: string; fullName: string; staffId: string | null };

export default function ExpenseItemsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    monthlySheetCategory: "NONE",
    salaryStaffUserId: "",
  });

  const categoryOptions = useMemo(() => MONTHLY_SHEET_CATEGORIES, []);

  const load = useCallback(async () => {
    try {
      const [itemResult, staffResult] = await Promise.allSettled([
        operationsApi.expenseItems.list({ limit: 100 }),
        operationsApi.stockRemovals.staffOptions(),
      ]);

      if (itemResult.status === "fulfilled") {
        setItems(itemResult.value.items);
      } else {
        throw itemResult.reason;
      }

      if (staffResult.status === "fulfilled") {
        setStaffOptions(staffResult.value);
      } else {
        setStaffOptions([]);
      }
    } catch {
      appToast.error("Failed to load expense items");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      appToast.error("Expense item name is required");
      return;
    }
    if (form.monthlySheetCategory === "STAFF_SALARY" && !form.salaryStaffUserId) {
      appToast.error("Select a staff member for salary category");
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        description: form.description.trim() || undefined,
        monthlySheetCategory: form.monthlySheetCategory,
        salaryStaffUserId:
          form.monthlySheetCategory === "STAFF_SALARY" ? form.salaryStaffUserId : undefined,
      };
      if (edit) {
        await operationsApi.expenseItems.update(edit.id, payload);
        appToast.success("Updated");
      } else {
        await operationsApi.expenseItems.create(payload);
        appToast.success("Created");
      }
      setOpen(false);
      void load();
    } catch {
      appToast.error("Failed to save");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await operationsApi.expenseItems.remove(deleteTarget.id);
      appToast.success("Expense item deleted");
      setDeleteTarget(null);
      void load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete expense item"));
    } finally {
      setDeleting(false);
    }
  };

  const categoryLabel = useCallback(
    (value: string, salaryStaffName?: string | null) => {
      if (value === "STAFF_SALARY" && salaryStaffName) {
        return `${salaryStaffName} salary`;
      }
      return categoryOptions.find((c) => c.value === value)?.label ?? value;
    },
    [categoryOptions],
  );

  return (
    <section className="page-shell page-content space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Expense items</h1>
          <p className="text-muted">Catalog for daily expense entries.</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEdit(null);
            setForm({ name: "", description: "", monthlySheetCategory: "NONE", salaryStaffUserId: "" });
            setOpen(true);
          }}
        >
          Add item
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No expense items" description="Create expense categories for daily logging." />
      ) : (
        <Card density="compact" className="overflow-hidden p-0">
          <ResponsiveTable
            headers={[
              "Name",
              "Sheet category",
              "Added on",
              "Description",
              {
                label: "Actions",
                thClassName: "text-right",
                labelWrapperClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Expense items"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[48rem]"
          >
            {items.map((item) => (
              <tr key={item.id} className="border-t border-(--color-border) last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3.5 text-sm text-muted">
                  {categoryLabel(item.monthlySheetCategory, item.salaryStaffName)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {item.createdAt ? formatDateOnly(item.createdAt) : "—"}
                </td>
                <td className="max-w-[240px] px-4 py-3.5 text-sm text-muted">
                  {item.description ? (
                    <span className="line-clamp-2" title={item.description}>
                      {item.description}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className={tableActionsCellClass}>
                    <RowActions
                      showLabels
                      onEdit={() => {
                        setEdit(item);
                        setForm({
                          name: item.name,
                          description: item.description ?? "",
                          monthlySheetCategory: item.monthlySheetCategory,
                          salaryStaffUserId: item.salaryStaffUserId ?? "",
                        });
                        setOpen(true);
                      }}
                      onDelete={() => setDeleteTarget(item)}
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
        title="Delete expense item?"
        description="This action cannot be undone."
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
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
        title={edit ? "Edit expense item" : "New expense item"}
        description="Create an expense catalog item and map it to a monthly sheet category."
        onClose={() => setOpen(false)}
      >
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Expense details
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="name" label="Item name" required hint="Shown while logging daily expenses">
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Internet bill, John Doe salary"
                />
              </Field>
              <Field id="cat" label="Monthly sheet category" hint="Used for monthly reports">
                <Select
                  value={form.monthlySheetCategory}
                  onChange={(e) => {
                    const nextCategory = e.target.value;
                    setForm((current) => {
                      const currentName = current.name.trim().toLowerCase();
                      const autoName =
                        currentName === "" ||
                        currentName.endsWith("salary") ||
                        currentName.startsWith("staff ");
                      const selectedStaff = staffOptions.find(
                        (option) => option.id === current.salaryStaffUserId,
                      );
                      const nextSalaryName = selectedStaff
                        ? `${selectedStaff.fullName} salary`
                        : current.name;
                      return {
                        ...current,
                        monthlySheetCategory: nextCategory,
                        salaryStaffUserId:
                          nextCategory === "STAFF_SALARY" ? current.salaryStaffUserId : "",
                        name:
                          autoName && nextCategory === "STAFF_SALARY"
                            ? nextSalaryName
                            : current.name,
                      };
                    });
                  }}
                >
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {form.monthlySheetCategory === "STAFF_SALARY" ? (
              <Field
                id="salaryStaffUserId"
                label="Staff name"
                required
                hint="This salary category will be linked to the selected staff member"
              >
                <Select
                  value={form.salaryStaffUserId}
                  onChange={(e) => {
                    const nextStaffId = e.target.value;
                    const nextStaff = staffOptions.find((option) => option.id === nextStaffId);
                    setForm((current) => {
                      const currentName = current.name.trim().toLowerCase();
                      const autoName = currentName === "" || currentName.endsWith("salary");
                      return {
                        ...current,
                        salaryStaffUserId: nextStaffId,
                        name: autoName && nextStaff ? `${nextStaff.fullName} salary` : current.name,
                      };
                    });
                  }}
                >
                  <option value="">Choose staff</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field id="desc" label="Description" hint="Optional short context for your team">
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Monthly salary paid to kitchen staff"
              />
            </Field>
          </section>

          <div className="rounded-xl border border-(--color-border) bg-surface-muted px-4 py-3 text-xs text-muted">
            Choose "Staff salary" and pick a staff member to keep salary entries explicit (for example:
            "John Doe salary").
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-(--color-border) pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()}>
              Save item
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
