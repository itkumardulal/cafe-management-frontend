"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ResponsiveTable } from "@/src/components/ui/table";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { RowActions } from "@/src/components/shared/row-actions";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type MenuItemRow = {
  id: string;
  name: string;
  menuCategoryId: string;
  categoryName: string;
  imageUrl?: string | null;
  unitType?: string | null;
  unitQuantity?: string | null;
  costPerUnit: string;
  sellPricePerUnit: string;
  quantityOnHand: string;
  notes?: string | null;
};

type CategoryOption = { id: string; name: string };

const emptyForm = {
  menuCategoryId: "",
  name: "",
  imageUrl: "",
  unitType: "",
  unitQuantity: "",
  costPerUnit: "",
  sellPricePerUnit: "",
  openingStockDay1: "0",
  notes: "",
};

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadEntityId, setImageUploadEntityId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MenuItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [menuData, categoryData] = await Promise.all([
        operationsApi.menuItems.list(),
        operationsApi.menuCategories.list(),
      ]);
      setItems(menuData.items);
      setCategories(
        categoryData.items.map((c) => ({ id: c.id, name: c.name })),
      );
    } catch {
      appToast.error("Failed to load menu items");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; items: MenuItemRow[] }
    >();

    for (const cat of categories) {
      map.set(cat.id, { id: cat.id, name: cat.name, items: [] });
    }

    for (const item of items) {
      const group = map.get(item.menuCategoryId) ?? {
        id: item.menuCategoryId,
        name: item.categoryName,
        items: [],
      };
      group.items.push(item);
      map.set(item.menuCategoryId, group);
    }

    return Array.from(map.values()).sort((a, b) => {
      const aHasItems = a.items.length > 0;
      const bHasItems = b.items.length > 0;
      if (aHasItems !== bHasItems) {
        return aHasItems ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [categories, items]);

  const openCreate = () => {
    setEditId(null);
    setImageUploadEntityId(crypto.randomUUID());
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item: MenuItemRow) => {
    setEditId(item.id);
    setImageUploadEntityId(item.id);
    setForm({
      menuCategoryId: item.menuCategoryId,
      name: item.name,
      imageUrl: item.imageUrl ?? "",
      unitType: item.unitType ?? "",
      unitQuantity: item.unitQuantity ?? "",
      costPerUnit: item.costPerUnit,
      sellPricePerUnit: item.sellPricePerUnit,
      openingStockDay1: item.quantityOnHand,
      notes: item.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.menuCategoryId || !form.name.trim()) {
      appToast.error("Category and item name are required");
      return;
    }
    if (!form.imageUrl) {
      appToast.error("Item image is required");
      return;
    }
    if (!form.unitType.trim()) {
      appToast.error("Unit type is required");
      return;
    }
    if (!form.unitQuantity.trim()) {
      appToast.error("Unit quantity is required");
      return;
    }

    const costPerUnit = Number(form.costPerUnit);
    const sellPricePerUnit = Number(form.sellPricePerUnit);
    if (
      Number.isNaN(costPerUnit) ||
      Number.isNaN(sellPricePerUnit) ||
      form.costPerUnit === "" ||
      form.sellPricePerUnit === ""
    ) {
      appToast.error("Cost and sell price are required");
      return;
    }
    if (sellPricePerUnit <= costPerUnit) {
      appToast.error("Selling price must be greater than cost price");
      return;
    }

    const payload = {
      menuCategoryId: form.menuCategoryId,
      name: form.name.trim(),
      imageUrl: form.imageUrl,
      unitType: form.unitType.trim(),
      unitQuantity: form.unitQuantity.trim(),
      notes: form.notes.trim() || undefined,
    };

    try {
      if (editId) {
        await operationsApi.menuItems.update(editId, {
          ...payload,
          costPerUnit,
          sellPricePerUnit,
        });
        appToast.success("Menu item updated");
      } else {
        await operationsApi.menuItems.create({
          ...payload,
          costPerUnit,
          sellPricePerUnit,
          openingStockDay1: Number(form.openingStockDay1),
        });
        appToast.success("Menu item added");
      }
      setOpen(false);
      void load();
    } catch {
      appToast.error("Failed to save menu item");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await operationsApi.menuItems.remove(deleteTarget.id);
      appToast.success("Menu item deleted");
      setDeleteTarget(null);
      void load();
    } catch {
      appToast.error("Failed to delete menu item");
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
          <h1 className="heading-display text-foreground">Menu items</h1>
          <p className="text-muted">
            Add items under menu categories with pricing and stock.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={openCreate}
          disabled={categories.length === 0}
        >
          Add item
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create menu categories first, then add items here."
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No menu items"
          description="Add your first item to a category."
        />
      ) : (
        <div className="space-y-4">
          {groupedByCategory.map((group) => (
            <Card
              key={group.id}
              density="compact"
              className="space-y-3 lg:[&_td:last-child]:min-w-[200px] lg:[&_th:last-child]:text-center"
            >
              <div className="flex items-center justify-between gap-2 border-b border-(--color-border) pb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {group.name}
                </h2>
                <span className="text-xs text-muted">
                  {group.items.length} item{group.items.length === 1 ? "" : "s"}
                </span>
              </div>

              {group.items.length === 0 ? (
                <p className="text-sm text-muted">
                  No items in this category yet.
                </p>
              ) : (
                <>
                  <ul className="space-y-2 lg:hidden">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-surface-muted) px-3 py-2.5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-10 w-10 shrink-0 rounded-lg border border-(--color-border) object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-(--color-border) text-xs text-muted">
                              —
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {item.name}
                            </p>
                            <p className="text-xs text-subtle">{item.categoryName}</p>
                            <p className="text-xs text-muted">
                              Qty {cellOrDash(item.unitQuantity)} ·{" "}
                              {cellOrDash(item.unitType)}
                              {" · "}
                              Cost {item.costPerUnit} · Sell{" "}
                              {item.sellPricePerUnit} · Stock{" "}
                              {item.quantityOnHand}
                            </p>
                            {item.notes ? (
                              <p
                                className="truncate text-xs text-subtle"
                                title={item.notes}
                              >
                                {item.notes}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <RowActions
                          showLabels
                          onEdit={() => openEdit(item)}
                          onDelete={() => setDeleteTarget(item)}
                        />
                      </li>
                    ))}
                  </ul>

                  <div className="hidden lg:block">
                    <ResponsiveTable
                      headers={[
                        "Name",
                        "Category",
                        "Unit qty",
                        "Unit type",
                        "Cost",
                        "Sell price",
                        "Stock",
                        "Notes",
                        "Actions",
                      ]}
                      ariaLabel={`Menu items in ${group.name}`}
                      density="comfortable"
                      className="min-w-0 border-0 shadow-none [&_table]:min-w-full [&_thead_th:last-child]:text-center"
                    >
                      {group.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-(--color-border) last:border-b-0"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex min-w-0 items-center gap-3">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="h-9 w-9 shrink-0 rounded-lg border border-(--color-border) object-cover"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-(--color-border) text-[10px] text-muted">
                                  —
                                </div>
                              )}
                              <span className="truncate text-sm font-medium text-foreground">
                                {item.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted">
                            {cellOrDash(item.categoryName)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground">
                            {cellOrDash(item.unitQuantity)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted">
                            {cellOrDash(item.unitType)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground">
                            {item.costPerUnit}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground">
                            {item.sellPricePerUnit}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground">
                            {item.quantityOnHand}
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
                          <td className="px-4 py-3.5">
                            <div className="flex justify-center">
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
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={deleteTarget !== null}
        title="Delete menu item?"
        description="This action cannot be undone."
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-[var(--color-muted)]">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[var(--color-foreground)]">
              {deleteTarget?.name}
            </span>
            ?
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
        title={editId ? "Edit menu item" : "Add menu item"}
        description={
          editId
            ? "Update details, pricing, and stock for this item."
            : "Add a new item under a category with image, units, and pricing."
        }
        onClose={() => setOpen(false)}
      >
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Basics
            </h3>
            <Field id="category" label="Menu category" required>
              <Select
                value={form.menuCategoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, menuCategoryId: e.target.value }))
                }
              >
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field id="name" label="Item name" required>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Chicken momo"
              />
            </Field>
          </section>

          <section className="space-y-3 border-t border-[var(--color-border)] pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Item details
            </h3>
            <ImageUploadField
              id="itemImage"
              label="Item image"
              required
              hint="PNG, JPG, or JPEG, max 5MB"
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              assetType="module"
              module="menu-items"
              entityId={imageUploadEntityId}
              dropTitle="Drag & drop item image here"
              previewAlt="Menu item image preview"
              uploadedLabel="Item image uploaded"
              onUploadingChange={setImageUploading}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="unitType"
                label="Unit type"
                required
                hint="e.g. ml, kg, plate"
              >
                <Input
                  value={form.unitType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitType: e.target.value }))
                  }
                  placeholder="ml, kg, plate"
                />
              </Field>
              <Field
                id="unitQuantity"
                label="Unit quantity"
                required
                hint="e.g. 250"
              >
                <Input
                  value={form.unitQuantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitQuantity: e.target.value }))
                  }
                  placeholder="e.g. 250"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3 border-t border-[var(--color-border)] pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Pricing & stock
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="cost" label="Cost per unit" required hint="Must be less than sell price">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.costPerUnit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, costPerUnit: e.target.value }))
                  }
                />
              </Field>

              <Field id="sell" label="Sell price" required hint="Must be greater than cost price">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.sellPricePerUnit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sellPricePerUnit: e.target.value }))
                  }
                />
              </Field>
            </div>

            {!editId ? (
              <Field id="opening" label="Opening stock" required>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={form.openingStockDay1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, openingStockDay1: e.target.value }))
                  }
                />
              </Field>
            ) : null}
          </section>

          <section className="space-y-3 border-t border-[var(--color-border)] pt-5">
            <Field id="notes" label="Notes" hint="Optional">
              <Input
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Serving notes, variants, etc."
              />
            </Field>
          </section>

          <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:-mx-6 sm:px-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              loading={imageUploading}
            >
              {editId ? "Save changes" : "Add item"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
