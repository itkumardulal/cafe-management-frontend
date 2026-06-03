"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ResponsiveTable, tableActionsCellClass, tableActionsColumnClass, tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { RowActions } from "@/src/components/shared/row-actions";
import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { cn } from "@/src/lib/cn";
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
  openingStockDay1: string;
  trackStock: boolean;
  reorderLevel?: string | null;
  quantityOnHand: string | null;
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
  trackStock: false,
  openingStockDay1: "",
  stockAdjustmentQty: "",
  reorderLevel: "",
  notes: "",
};

export default function MenuItemsPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <CardListSkeleton />
            <TableSkeleton columns={6} className="hidden md:block" />
            <PaginationSkeleton />
          </div>
        }
      >
        <MenuItemsContent />
      </Suspense>
    </section>
  );
}

function MenuItemsContent() {
  const {
    items,
    meta,
    loading,
    isFetching,
    hasActiveFilters,
    searchInput,
    setSearch,
    clearSearch,
    isSearching,
    searchPlaceholder,
    searchResultSummary,
    setPage,
    setPageSize,
    setSort,
    params,
    clearFilters,
    refetch,
  } = usePaginatedList<MenuItemRow>({
    queryKey: "menu-items",
    fetchFn: (p) => operationsApi.menuItems.list(p),
    defaultSort: { sortBy: "name", sortOrder: "asc" },
    errorMessage: "Failed to load menu items",
  });

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadEntityId, setImageUploadEntityId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MenuItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const categoryData = await operationsApi.menuCategories.list({ limit: 100 });
      setCategories(categoryData.items.map((c) => ({ id: c.id, name: c.name })));
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, { id: string; name: string; items: MenuItemRow[] }>();
    for (const item of items) {
      const group = map.get(item.menuCategoryId) ?? {
        id: item.menuCategoryId,
        name: item.categoryName,
        items: [],
      };
      group.items.push(item);
      map.set(item.menuCategoryId, group);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

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
      trackStock: item.trackStock,
      openingStockDay1: item.openingStockDay1 ?? item.quantityOnHand ?? "",
      stockAdjustmentQty: "",
      reorderLevel: item.reorderLevel ?? "",
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
      const reorderLevel =
        form.reorderLevel.trim() === "" ? undefined : Number(form.reorderLevel);

      if (editId) {
        await operationsApi.menuItems.update(editId, {
          ...payload,
          costPerUnit,
          sellPricePerUnit,
          trackStock: form.trackStock,
          reorderLevel: reorderLevel ?? null,
        });
        if (
          form.trackStock &&
          form.stockAdjustmentQty.trim() !== "" &&
          Number(form.stockAdjustmentQty) !== 0
        ) {
          await operationsApi.menuItems.stockAdjustment(editId, {
            quantity: Number(form.stockAdjustmentQty),
            notes: "Stock updated from menu item form",
          });
        }
        appToast.success("Menu item updated");
      } else {
        await operationsApi.menuItems.create({
          ...payload,
          costPerUnit,
          sellPricePerUnit,
          trackStock: form.trackStock,
          openingStockDay1:
            form.trackStock && form.openingStockDay1.trim() !== ""
              ? Number(form.openingStockDay1)
              : undefined,
          reorderLevel,
        });
        appToast.success("Menu item added");
      }
      setOpen(false);
      await refetch();
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
      await refetch();
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
    <>
      <PageHeader
        title="Menu items"
        description="Add items under menu categories with pricing and stock."
        action={
          <Button type="button" size="sm" onClick={openCreate} disabled={categories.length === 0}>
            Add item
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create menu categories first, then add items here."
        />
      ) : (
        <PaginatedListSection
          loading={loading}
          isFetching={isFetching}
          itemsCount={items.length}
          hasActiveFilters={hasActiveFilters}
          searchValue={searchInput}
          onSearchChange={setSearch}
          onSearchClear={clearSearch}
          searchPlaceholder={searchPlaceholder}
          isSearching={isSearching}
          searchResultSummary={searchResultSummary}
          tableColumns={6}
          emptyTitle="No Menu Items Found"
          emptyDescription="Add your first item to a category."
          emptyIcon={UtensilsCrossed}
          emptyAction={{ label: "Add item", onClick: openCreate }}
          onClearFilters={() => {
            clearSearch();
            clearFilters();
          }}
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalRecords={meta.total}
          pageSize={meta.limit}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          mobileSort={
            <MobileSortSelect
              options={[
                { label: "Name (A–Z)", sortBy: "name", sortOrder: "asc" },
                { label: "Name (Z–A)", sortBy: "name", sortOrder: "desc" },
                { label: "Highest stock", sortBy: "quantityOnHand", sortOrder: "desc" },
                { label: "Lowest stock", sortBy: "quantityOnHand", sortOrder: "asc" },
              ]}
              currentSortBy={params.sortBy}
              currentSortOrder={params.sortOrder}
              onSort={setSort}
            />
          }
        >
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
                  <ListCardStack>
                    {group.items.map((item) => (
                      <ListCard
                        key={item.id}
                        leading={
                          item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              loading="lazy"
                              className="h-10 w-10 rounded-lg border border-[var(--color-border)] object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] text-xs text-muted">
                              —
                            </div>
                          )
                        }
                        title={item.name}
                        subtitle={item.categoryName}
                        fields={[
                          {
                            label: "Unit",
                            value: `${cellOrDash(item.unitQuantity)} · ${cellOrDash(item.unitType)}`,
                          },
                          { label: "Cost", value: item.costPerUnit },
                          { label: "Sell", value: item.sellPricePerUnit },
                          {
                            label: "Stock",
                            value: item.trackStock
                              ? (item.quantityOnHand ?? "0")
                              : "Not tracked",
                          },
                          ...(item.notes ? [{ label: "Notes", value: item.notes }] : []),
                        ]}
                        actions={
                          <RowActions
                            showLabels
                            onEdit={() => openEdit(item)}
                            onDelete={() => setDeleteTarget(item)}
                          />
                        }
                      />
                    ))}
                  </ListCardStack>

                  <div className="hidden md:block">
                    <ResponsiveTable
                      headers={[
                        "Name",
                        { label: "Category", thClassName: tableCenterColumnClass },
                        { label: "Unit qty", thClassName: tableCenterColumnClass },
                        { label: "Unit type", thClassName: tableCenterColumnClass },
                        { label: "Cost", thClassName: tableCenterColumnClass },
                        { label: "Sell price", thClassName: tableCenterColumnClass },
                        { label: "Stock", thClassName: tableCenterColumnClass },
                        "Notes",
                        { label: "Actions", thClassName: tableActionsColumnClass },
                      ]}
                      ariaLabel={`Menu items in ${group.name}`}
                      density="comfortable"
                      className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
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
                                  loading="lazy"
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
                          <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
                            {cellOrDash(item.categoryName)}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>
                            {cellOrDash(item.unitQuantity)}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
                            {cellOrDash(item.unitType)}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>
                            {item.costPerUnit}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>
                            {item.sellPricePerUnit}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>
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
                  </div>
                </>
              )}
            </Card>
          ))}
          </div>
        </PaginatedListSection>
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
        mobileVariant="fullscreen"
        title={editId ? "Edit menu item" : "Add menu item"}
        description={
          editId
            ? "Update details, pricing, and stock for this item."
            : "Add a new item under a category with image, units, and pricing."
        }
        onClose={() => setOpen(false)}
        footer={
          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} loading={imageUploading}>
              {editId ? "Save changes" : "Add item"}
            </Button>
          </FormFooter>
        }
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

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.trackStock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, trackStock: e.target.checked }))
                }
                className="rounded border-[var(--color-border)]"
              />
              Track stock for this item
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              {!editId ? (
                <Field
                  id="opening"
                  label="Opening stock"
                  hint={
                    form.trackStock
                      ? "Optional — leave empty to start from 0"
                      : "Optional — used only when stock tracking is enabled"
                  }
                >
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={form.openingStockDay1}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, openingStockDay1: e.target.value }))
                    }
                    disabled={!form.trackStock}
                    placeholder="Optional"
                  />
                </Field>
              ) : (
                <Field
                  id="openingView"
                  label="Opening stock"
                  hint={
                    form.trackStock
                      ? "Initial configured stock"
                      : "Stock tracking is disabled for this item"
                  }
                >
                  <Input
                    type="number"
                    value={form.openingStockDay1}
                    disabled
                    placeholder="0"
                  />
                </Field>
              )}
              <Field
                id="reorder"
                label="Reorder level"
                hint={
                  form.trackStock
                    ? "Optional — alerts when at or below"
                    : "Optional — enabled when stock tracking is on"
                }
              >
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={form.reorderLevel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reorderLevel: e.target.value }))
                  }
                  disabled={!form.trackStock}
                  placeholder="Optional"
                />
              </Field>
            </div>
            {editId ? (
              <Field
                id="stockAdjustment"
                label="Stock quantity update"
                hint={
                  form.trackStock
                    ? "Optional — use + for add, - for reduce (e.g. 10 or -3)"
                    : "Enable stock tracking to update quantity"
                }
              >
                <Input
                  type="number"
                  step="1"
                  value={form.stockAdjustmentQty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stockAdjustmentQty: e.target.value }))
                  }
                  disabled={!form.trackStock}
                  placeholder="e.g. 10 or -3"
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
        </div>
      </Modal>
    </>
  );
}
