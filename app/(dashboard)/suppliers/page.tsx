"use client";

import { useCallback, useEffect, useState } from "react";
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
import { RowActions } from "@/src/components/shared/row-actions";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type Row = {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

const emptyForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function SuppliersPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const data = await operationsApi.suppliers.list();
      setItems(data.items);
    } catch {
      appToast.error("Failed to load suppliers");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEdit(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item: Row) => {
    setEdit(item);
    setForm({
      name: item.name,
      contactPerson: item.contactPerson ?? "",
      phone: item.phone ?? "",
      email: item.email ?? "",
      address: item.address ?? "",
      notes: item.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      appToast.error("Supplier name is required");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (edit) {
        await operationsApi.suppliers.update(edit.id, payload);
        appToast.success("Supplier updated");
      } else {
        await operationsApi.suppliers.create(payload);
        appToast.success("Supplier added");
      }
      setOpen(false);
      void load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save supplier"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await operationsApi.suppliers.remove(deleteTarget.id);
      appToast.success("Supplier deleted");
      setDeleteTarget(null);
      void load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete supplier"));
    } finally {
      setDeleting(false);
    }
  };

  const cellOrDash = (value?: string | null) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : "—";
  };

  return (
    <section className="page-shell page-content space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Suppliers</h1>
          <p className="text-muted">Vendors for raw material purchases.</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          Add supplier
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No suppliers" description="Add suppliers used for purchase receipts." />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    {[item.contactPerson, item.phone, item.email].filter(Boolean).join(" · ") ||
                      "No contact details"}
                  </p>
                  {item.address ? (
                    <p className="mt-1 truncate text-xs text-muted" title={item.address}>
                      {item.address}
                    </p>
                  ) : null}
                  {item.notes ? (
                    <p className="mt-1 line-clamp-2 text-xs text-subtle" title={item.notes}>
                      {item.notes}
                    </p>
                  ) : null}
                </div>
                <RowActions
                  showLabels
                  onEdit={() => openEdit(item)}
                  onDelete={() => setDeleteTarget(item)}
                />
              </div>
            ))}
          </div>

          <Card density="compact" className="hidden overflow-hidden p-0 md:block">
            <ResponsiveTable
              headers={[
                "Name",
                "Contact",
                "Phone",
                "Email",
                "Address",
                "Notes",
                {
                  label: "Actions",
                  thClassName: "text-right",
                  labelWrapperClassName: tableActionsColumnClass,
                },
              ]}
              ariaLabel="Suppliers"
              density="comfortable"
              className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
            >
              {items.map((item) => (
                <tr key={item.id} className="border-t border-(--color-border) last:border-b-0">
                  <td className="px-4 py-3.5 text-sm font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3.5 text-sm text-muted">{cellOrDash(item.contactPerson)}</td>
                  <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                    {cellOrDash(item.phone)}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted">{cellOrDash(item.email)}</td>
                  <td className="max-w-[180px] px-4 py-3.5 text-sm text-muted">
                    {item.address ? (
                      <span className="line-clamp-2" title={item.address}>
                        {item.address}
                      </span>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </td>
                  <td className="max-w-[200px] px-4 py-3.5 text-sm text-muted">
                    {item.notes ? (
                      <span className="line-clamp-2" title={item.notes}>
                        {item.notes}
                      </span>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className={tableActionsCellClass}>
                      <RowActions
                        showLabels
                        onEdit={() => openEdit(item)}
                        onDelete={() => setDeleteTarget(item)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </ResponsiveTable>
          </Card>
        </>
      )}

      <Modal
        open={deleteTarget !== null}
        title="Delete supplier?"
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
            <Button type="button" variant="danger" onClick={() => void confirmDelete()} loading={deleting}>
              Yes, delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={open}
        size="lg"
        title={edit ? "Edit supplier" : "Add supplier"}
        description={
          edit
            ? "Update vendor details used on purchase receipts."
            : "Register a vendor for raw material purchases."
        }
        onClose={() => setOpen(false)}
      >
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Supplier</h3>
            <Field id="name" label="Supplier name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Valley Foods Pvt. Ltd."
              />
            </Field>
          </section>

          <section className="space-y-3 border-t border-(--color-border) pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Contact</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="contact" label="Contact person" hint="Optional">
                <Input
                  value={form.contactPerson}
                  onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                  placeholder="Full name"
                />
              </Field>
              <Field id="phone" label="Phone" hint="Optional">
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+977 …"
                />
              </Field>
            </div>
            <Field id="email" label="Email" hint="Optional">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="vendor@example.com"
              />
            </Field>
            <Field id="address" label="Address" hint="Optional">
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street, city"
              />
            </Field>
          </section>

          <section className="space-y-3 border-t border-(--color-border) pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Additional</h3>
            <Field id="notes" label="Notes" hint="Optional — payment terms, delivery window, etc.">
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Delivers on Tuesdays, NET 15 payment"
                className={cn(
                  "w-full resize-y rounded-xl border bg-(--color-surface) px-3 py-2.5 text-sm text-foreground",
                  "placeholder:text-subtle outline-none transition-colors",
                  "border-(--color-input) focus:border-primary",
                )}
              />
            </Field>
          </section>

          <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-(--color-border) bg-(--color-surface) px-5 py-4 sm:-mx-6 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()}>
              {edit ? "Save changes" : "Add supplier"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
