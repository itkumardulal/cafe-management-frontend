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
import { appToast } from "@/src/lib/toast";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { operationsApi } from "@/src/services/operations-api";

type Category = { id: string; name: string; menuItemCount: number };

export default function MenuCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [catModal, setCatModal] = useState<"create" | "edit" | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationsApi.menuCategories.list({ limit: 100 });
      setCategories(data.items);
    } catch {
      appToast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setCatName(cat.name);
    setCatModal("edit");
  };

  const requestDelete = (cat: Category) => {
    if (cat.menuItemCount > 0) {
      appToast.error(
        `This category has ${cat.menuItemCount} menu item${cat.menuItemCount === 1 ? "" : "s"}. Remove them from Menu items first.`,
      );
      return;
    }
    setDeleteTarget(cat);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await operationsApi.menuCategories.remove(deleteTarget.id);
      appToast.success("Category deleted");
      setDeleteTarget(null);
      void loadCategories();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete category"));
    } finally {
      setDeleting(false);
    }
  };

  const saveCategory = async () => {
    try {
      if (catModal === "edit" && editCat) {
        await operationsApi.menuCategories.update(editCat.id, catName.trim());
        appToast.success("Category updated");
      } else {
        await operationsApi.menuCategories.create(catName.trim());
        appToast.success("Category created");
      }
      setCatModal(null);
      setCatName("");
      void loadCategories();
    } catch {
      appToast.error("Failed to save category");
    }
  };

  return (
    <section className="page-shell page-content space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Menu categories</h1>
          <p className="text-muted">Organize your menu by category. Add items from the Menu items page.</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCatModal("create");
            setEditCat(null);
            setCatName("");
          }}
        >
          Add category
        </Button>
      </div>

      {!loading && categories.length === 0 ? (
        <EmptyState title="No categories" description="Create your first menu category." />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted">
                    {cat.menuItemCount} menu item{cat.menuItemCount === 1 ? "" : "s"}
                  </p>
                </div>
                <RowActions
                  showLabels
                  onEdit={() => openEdit(cat)}
                  onDelete={() => requestDelete(cat)}
                />
              </div>
            ))}
          </div>

          <Card density="compact" className="hidden overflow-hidden p-0 md:block">
            <ResponsiveTable
              headers={[
                "Name",
                "Menu items",
                {
                  label: "Actions",
                  thClassName: "text-right",
                  labelWrapperClassName: tableActionsColumnClass,
                },
              ]}
              ariaLabel="Menu categories"
              density="comfortable"
              className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
            >
              {categories.map((cat) => (
                <tr key={cat.id} className="border-t border-(--color-border) last:border-b-0">
                  <td className="px-4 py-3.5 text-sm font-medium text-foreground">{cat.name}</td>
                  <td className="px-4 py-3.5 text-sm text-muted">{cat.menuItemCount}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className={tableActionsCellClass}>
                      <RowActions
                        showLabels
                        onEdit={() => openEdit(cat)}
                        onDelete={() => requestDelete(cat)}
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
        title="Delete category?"
        description="Only empty categories can be deleted."
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
        open={catModal !== null}
        title={catModal === "edit" ? "Edit category" : "New category"}
        onClose={() => setCatModal(null)}
      >
        <div className="space-y-4">
          <Field id="catName" label="Name" required>
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Momos" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCatModal(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveCategory()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
