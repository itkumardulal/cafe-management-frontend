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
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type Row = {
  id: string;
  name: string;
  unit: string;
  description?: string | null;
  createdAt: string;
};

function formatAddedDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RawMaterialsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "", description: "" });

  const load = useCallback(async () => {
    try {
      const data = await operationsApi.rawMaterials.list();
      setItems(data.items);
    } catch {
      appToast.error("Failed to load raw materials");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEdit(null);
    setForm({ name: "", unit: "", description: "" });
    setOpen(true);
  };

  const openEdit = (item: Row) => {
    setEdit(item);
    setForm({
      name: item.name,
      unit: item.unit,
      description: item.description ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      appToast.error("Name is required");
      return;
    }
    if (!form.unit.trim()) {
      appToast.error("Unit is required");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim(),
        description: form.description.trim() || undefined,
      };
      if (edit) {
        await operationsApi.rawMaterials.update(edit.id, payload);
        appToast.success("Raw material updated");
      } else {
        await operationsApi.rawMaterials.create(payload);
        appToast.success("Raw material added");
      }
      setOpen(false);
      void load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save raw material"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await operationsApi.rawMaterials.remove(deleteTarget.id);
      appToast.success("Raw material deleted");
      setDeleteTarget(null);
      void load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete raw material"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="page-shell page-content space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Raw materials</h1>
          <p className="text-muted">Catalog of ingredients and supplies.</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          Add material
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No raw materials" description="Add your first raw material item." />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.unit}
                    {item.description ? ` · ${item.description}` : ""}
                  </p>
                  <p className="text-xs text-subtle">Added {formatAddedDate(item.createdAt)}</p>
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
                "Unit",
                "Description",
                "Added on",
                {
                  label: "Actions",
                  thClassName: "text-right",
                  labelWrapperClassName: tableActionsColumnClass,
                },
              ]}
              ariaLabel="Raw materials"
              density="comfortable"
              className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
            >
              {items.map((item) => (
                <tr key={item.id} className="border-t border-(--color-border) last:border-b-0">
                  <td className="px-4 py-3.5 text-sm font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3.5 text-sm text-foreground">{item.unit}</td>
                  <td className="max-w-[240px] px-4 py-3.5 text-sm text-muted">
                    {item.description ? (
                      <span className="line-clamp-2" title={item.description}>
                        {item.description}
                      </span>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                    {formatAddedDate(item.createdAt)}
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
        title="Delete raw material?"
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
        title={edit ? "Edit material" : "Add material"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-3">
          <Field id="name" label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field id="unit" label="Unit" required hint="e.g. kg, pcs, liter">
            <Input
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="kg, pcs"
            />
          </Field>
          <Field id="desc" label="Description" hint="Optional">
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()}>
              {edit ? "Save changes" : "Add material"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
