"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Download, Star, UtensilsCrossed } from "lucide-react";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { DigitalMenuQrCard } from "@/src/components/admin/digital-menu-qr-card";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { usePrintableMenu } from "@/src/features/menu-export/hooks/use-printable-menu";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ResponsiveTable, tableActionsCellClass, tableActionsColumnClass, tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NumberInput } from "@/src/components/ui/number-input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { FilterSelect } from "@/src/components/shared/filter-select";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { RowActions } from "@/src/components/shared/row-actions";
import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { useUploadEntityId } from "@/src/hooks/use-upload-entity-id";
import { cn } from "@/src/lib/cn";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { hasEditChanges } from "@/src/lib/form-snapshot";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchMenuCategoryOptionsThunk } from "@/src/store/slices/reference-data.slice";

type MenuItemRow = {
  id: string;
  name: string;
  menuCategoryId: string;
  primaryMenuCategoryId?: string;
  categoryName: string;
  categories?: Array<{ id: string; name: string; sortOrder: number; isPrimary: boolean }>;
  imageUrl?: string | null;
  itemType?: string | null;
  unitType?: string | null;
  unitQuantity?: string | null;
  costPerUnit: string;
  sellPricePerUnit: string;
  openingStockDay1: string;
  trackStock: boolean;
  isActive: boolean;
  isSpecial: boolean;
  specialSortOrder: number;
  directPurchaseItemId?: string | null;
  reorderLevel?: string | null;
  quantityOnHand: string | null;
  notes?: string | null;
};

const emptyForm = {
  menuCategoryIds: [] as string[],
  primaryMenuCategoryId: "",
  name: "",
  itemType: "",
  imageUrl: "",
  unitType: "",
  unitQuantity: "",
  costPerUnit: "",
  sellPricePerUnit: "",
  trackStock: false,
  isActive: true,
  isSpecial: false,
  specialSortOrder: "0",
  directPurchaseItemId: "",
  openingStockDay1: "",
  currentStock: "",
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
            <TableSkeleton columns={7} className="hidden md:block" />
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
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.referenceData.menuCategoryOptions);
  const menuCategoryOptionsStatus = useAppSelector(
    (state) => state.referenceData.menuCategoryOptionsStatus,
  );

  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive" | "special">("");
  const { downloadPdf, exporting: downloadingMenu, portal: menuPrintPortal } = usePrintableMenu();
  const [hasActiveMenuItems, setHasActiveMenuItems] = useState(false);

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
    fetchFn: (p) =>
      operationsApi.menuItems.list({
        ...p,
        ...(categoryFilter ? { menuCategoryId: categoryFilter } : {}),
        ...(statusFilter === "active" ? { isActive: true } : {}),
        ...(statusFilter === "inactive" ? { isActive: false } : {}),
        ...(statusFilter === "special" ? { isSpecial: true } : {}),
      }),
    defaultSort: { sortBy: "name", sortOrder: "asc" },
    errorMessage: "Failed to load menu items",
    extraCacheKey: `${categoryFilter}:${statusFilter}`,
  });

  useEffect(() => {
    void operationsApi.menuItems
      .list({ limit: 1, page: 1, isActive: true })
      .then((res) => setHasActiveMenuItems(res.meta.total > 0))
      .catch(() => setHasActiveMenuItems(false));
  }, [items.length]);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialForm, setInitialForm] = useState<typeof emptyForm | null>(null);
  const { entityId: imageUploadEntityId, resetForCreate: resetImageUploadEntityId, setForEdit: setImageUploadEntityForEdit } =
    useUploadEntityId();
  const [form, setForm] = useState(emptyForm);

  const canSave = hasEditChanges(Boolean(editId), form, initialForm);
  const [linkOptions, setLinkOptions] = useState<
    Array<{
      id: string;
      name: string;
      unitType?: string | null;
      unitQuantity?: string | null;
      quantityOnHand?: string;
      ratePerUnit?: string | null;
    }>
  >([]);
  const [linkedDirectPurchaseNames, setLinkedDirectPurchaseNames] = useState<string[]>([]);
  const [linkOptionsLoading, setLinkOptionsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [existingMenuNames, setExistingMenuNames] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    if (menuCategoryOptionsStatus === "loaded" || menuCategoryOptionsStatus === "loading") {
      return;
    }
    void dispatch(fetchMenuCategoryOptionsThunk());
  }, [dispatch, menuCategoryOptionsStatus]);

  const loadLinkOptions = useCallback(() => {
    setLinkOptionsLoading(true);
    void operationsApi.directPurchases
      .linkOptions({ force: true })
      .then((result) => {
        setLinkOptions(result.items);
        setLinkedDirectPurchaseNames(result.linkedNames);
      })
      .catch((error) => {
        setLinkOptions([]);
        setLinkedDirectPurchaseNames([]);
        appToast.error(getApiErrorMessage(error, "Failed to load direct purchase items"));
      })
      .finally(() => setLinkOptionsLoading(false));
  }, []);

  useEffect(() => {
    if (!open || editId || !form.trackStock) {
      return;
    }
    loadLinkOptions();
  }, [open, editId, form.trackStock, loadLinkOptions]);

  useEffect(() => {
    if (!open) return;
    void operationsApi.menuItems
      .list({ limit: 500, page: 1, sortBy: "name", sortOrder: "asc" })
      .then((res) =>
        setExistingMenuNames(res.items.map((i) => ({ id: i.id, name: i.name }))),
      )
      .catch(() => setExistingMenuNames([]));
  }, [open]);

  const selectedDirectPurchase = useMemo(
    () => linkOptions.find((option) => option.id === form.directPurchaseItemId),
    [form.directPurchaseItemId, linkOptions],
  );

  const directPurchaseCostLocked = !editId && form.trackStock && Boolean(selectedDirectPurchase?.ratePerUnit);

  const nameError = useMemo(() => {
    const trimmed = form.name.trim();
    if (!trimmed) return undefined;
    const duplicate = existingMenuNames.find(
      (item) =>
        item.id !== editId &&
        item.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    return duplicate ? "Menu item already exists" : undefined;
  }, [form.name, existingMenuNames, editId]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, { id: string; name: string; items: MenuItemRow[] }>();
    for (const item of items) {
      const groupId = item.primaryMenuCategoryId || item.menuCategoryId;
      const groupName =
        item.categories?.find((c) => c.isPrimary)?.name ?? item.categoryName;
      const group = map.get(groupId) ?? {
        id: groupId,
        name: groupName,
        items: [],
      };
      group.items.push(item);
      map.set(groupId, group);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const openCreate = () => {
    setEditId(null);
    resetImageUploadEntityId();
    setForm(emptyForm);
    setInitialForm(null);
    setLinkOptions([]);
    setLinkedDirectPurchaseNames([]);
    setOpen(true);
  };

  const openEdit = (item: MenuItemRow) => {
    const categoryIds =
      item.categories?.map((c) => c.id) ?? (item.menuCategoryId ? [item.menuCategoryId] : []);
    const primary =
      item.categories?.find((c) => c.isPrimary)?.id ??
      item.primaryMenuCategoryId ??
      item.menuCategoryId;
    const next = {
      menuCategoryIds: categoryIds,
      primaryMenuCategoryId: primary,
      name: item.name,
      itemType: item.itemType ?? "",
      imageUrl: item.imageUrl ?? "",
      unitType: item.unitType ?? "",
      unitQuantity: item.unitQuantity ?? "",
      costPerUnit: item.costPerUnit,
      sellPricePerUnit: item.sellPricePerUnit,
      trackStock: item.trackStock,
      isActive: item.isActive ?? true,
      isSpecial: item.isSpecial ?? false,
      specialSortOrder: String(item.specialSortOrder ?? 0),
      directPurchaseItemId: "",
      openingStockDay1: item.openingStockDay1 ?? "",
      currentStock: item.trackStock ? (item.quantityOnHand ?? "0") : "",
      stockAdjustmentQty: "",
      reorderLevel: item.reorderLevel ?? "",
      notes: item.notes ?? "",
    };
    setEditId(item.id);
    setImageUploadEntityForEdit(item.id);
    setForm(next);
    setInitialForm(next);
    setOpen(true);
  };

  const setMenuCategory = (categoryId: string) => {
    setForm((f) => {
      if (!categoryId) {
        const remaining = f.menuCategoryIds.filter((id) => id !== f.primaryMenuCategoryId);
        return {
          ...f,
          menuCategoryIds: remaining,
          primaryMenuCategoryId: remaining[0] ?? "",
        };
      }
      const others = f.menuCategoryIds.filter(
        (id) => id !== f.primaryMenuCategoryId && id !== categoryId,
      );
      return {
        ...f,
        menuCategoryIds: [categoryId, ...others],
        primaryMenuCategoryId: categoryId,
      };
    });
  };

  const addAdditionalCategory = (categoryId: string) => {
    if (!categoryId) return;
    setForm((f) => {
      if (f.menuCategoryIds.includes(categoryId)) return f;
      return { ...f, menuCategoryIds: [...f.menuCategoryIds, categoryId] };
    });
  };

  const removeCategory = (categoryId: string) => {
    setForm((f) => {
      const nextIds = f.menuCategoryIds.filter((id) => id !== categoryId);
      const primary =
        f.primaryMenuCategoryId === categoryId ? (nextIds[0] ?? "") : f.primaryMenuCategoryId;
      return {
        ...f,
        menuCategoryIds: nextIds,
        primaryMenuCategoryId: primary,
      };
    });
  };

  const additionalCategoryOptions = useMemo(
    () => categories.filter((c) => !form.menuCategoryIds.includes(c.id)),
    [categories, form.menuCategoryIds],
  );

  const handleDownloadMenu = async () => {
    try {
      const data = await operationsApi.menuItems.printable();
      await downloadPdf(data);
      appToast.success("Menu downloaded");
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to download menu"));
    }
  };

  const toggleItemActive = async (item: MenuItemRow) => {
    try {
      await operationsApi.menuItems.update(item.id, { isActive: !item.isActive });
      appToast.success(item.isActive ? "Item marked inactive" : "Item marked active");
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to update item status"));
    }
  };

  const save = async () => {
    if (form.menuCategoryIds.length === 0) {
      appToast.error("Select at least one menu category");
      return;
    }
    if (!editId && form.trackStock && !form.directPurchaseItemId) {
      appToast.error(
        "Select a direct purchase item — add item names in Direct Purchases first",
      );
      return;
    }
    if (!form.name.trim()) {
      appToast.error("Item name is required");
      return;
    }
    if (nameError) {
      appToast.error(nameError);
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
    if (editId && !canSave) {
      return;
    }

    const primaryMenuCategoryId =
      form.primaryMenuCategoryId || form.menuCategoryIds[0]!;
    const specialSortOrder = form.isSpecial
      ? Math.max(0, Number.parseInt(form.specialSortOrder, 10) || 0)
      : 0;

    const payload = {
      menuCategoryIds: form.menuCategoryIds,
      primaryMenuCategoryId,
      name: form.name.trim(),
      imageUrl: form.imageUrl,
      unitType: form.unitType.trim(),
      unitQuantity: form.unitQuantity.trim(),
      notes: form.notes.trim() || undefined,
      isActive: form.isActive,
      isSpecial: form.isSpecial,
      specialSortOrder,
    };

    setSaving(true);
    try {
      const reorderLevel =
        form.trackStock && form.reorderLevel.trim() !== ""
          ? Number(form.reorderLevel)
          : undefined;

      if (editId) {
        await operationsApi.menuItems.update(editId, {
          ...payload,
          costPerUnit,
          sellPricePerUnit,
          trackStock: form.trackStock,
          reorderLevel: form.trackStock ? (reorderLevel ?? null) : null,
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
          reorderLevel,
          ...(form.trackStock && form.directPurchaseItemId
            ? { directPurchaseItemId: form.directPurchaseItemId }
            : {}),
        });
        appToast.success("Menu item added");
      }
      setOpen(false);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save menu item"));
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
      await operationsApi.menuItems.remove(deleteTarget.id);
      appToast.success("Menu item deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete menu item"));
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void handleDownloadMenu()}
              loading={downloadingMenu}
              disabled={!hasActiveMenuItems || downloadingMenu}
              title={
                hasActiveMenuItems
                  ? "Download printable A4 menu PDF"
                  : "Add active menu items to download a menu"
              }
            >
              {!downloadingMenu ? <Download className="h-4 w-4" aria-hidden /> : null}
              Download menu
            </Button>
            <Button type="button" size="sm" onClick={openCreate} disabled={categories.length === 0}>
              Add item
            </Button>
          </div>
        }
      />

      {menuPrintPortal}

      <DigitalMenuQrCard />

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
          hasActiveFilters={hasActiveFilters || Boolean(categoryFilter) || Boolean(statusFilter)}
          searchValue={searchInput}
          onSearchChange={setSearch}
          onSearchClear={clearSearch}
          searchPlaceholder={searchPlaceholder}
          isSearching={isSearching}
          searchResultSummary={searchResultSummary}
          filters={
            <>
              <FilterSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                fullWidth={false}
                className="w-[10.5rem]"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                fullWidth={false}
                className="w-[9.5rem]"
              >
                <option value="">All items</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="special">Special</option>
              </FilterSelect>
            </>
          }
          tableColumns={7}
          emptyTitle="No Menu Items Found"
          emptyDescription="Add your first item to a category."
          emptyIcon={UtensilsCrossed}
          emptyAction={{ label: "Add item", onClick: openCreate }}
          onClearFilters={() => {
            clearSearch();
            clearFilters();
            setCategoryFilter("");
            setStatusFilter("");
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
                        title={
                          <span className="inline-flex flex-wrap items-center gap-1.5">
                            {item.name}
                            {item.isSpecial ? (
                              <Badge variant="warning" className="gap-0.5 text-[10px]">
                                <Star className="h-3 w-3" aria-hidden />
                                Special
                              </Badge>
                            ) : null}
                            {!item.isActive ? (
                              <Badge className="text-[10px]">
                                Inactive
                              </Badge>
                            ) : null}
                          </span>
                        }
                        subtitle={
                          item.categories && item.categories.length > 1
                            ? `${item.categoryName} +${item.categories.length - 1}`
                            : item.categoryName
                        }
                        fields={[
                          {
                            label: "Unit",
                            value: `${cellOrDash(item.unitQuantity)} · ${cellOrDash(item.unitType)}`,
                          },
                          { label: "Item type", value: cellOrDash(item.itemType) },
                          { label: "Cost", value: item.costPerUnit },
                          { label: "Sell", value: item.sellPricePerUnit },
                          {
                            label: "Type",
                            value: item.trackStock ? "Direct purchase" : "Prepared dish",
                          },
                          {
                            label: "Stock",
                            value: item.trackStock
                              ? (item.quantityOnHand ?? "0")
                              : "—",
                          },
                          ...(item.notes ? [{ label: "Notes", value: item.notes }] : []),
                        ]}
                        actions={
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => toggleItemActive(item)}
                            >
                              {item.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <RowActions
                              showLabels
                              onEdit={() => openEdit(item)}
                              onDelete={() => setDeleteTarget(item)}
                            />
                          </div>
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
                        { label: "Item type", thClassName: tableCenterColumnClass },
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
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="truncate text-sm font-medium text-foreground">
                                    {item.name}
                                  </span>
                                  {item.isSpecial ? (
                                    <Badge variant="warning" className="gap-0.5 text-[10px]">
                                      <Star className="h-3 w-3" aria-hidden />
                                      Special
                                    </Badge>
                                  ) : null}
                                  {!item.isActive ? (
                                    <Badge className="text-[10px]">
                                      Inactive
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
                            {item.categories && item.categories.length > 1
                              ? `${cellOrDash(item.categoryName)} +${item.categories.length - 1}`
                              : cellOrDash(item.categoryName)}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>
                            {cellOrDash(item.unitQuantity)}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
                            {cellOrDash(item.unitType)}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
                            {cellOrDash(item.itemType)}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>
                            {item.costPerUnit}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>
                            {item.sellPricePerUnit}
                          </td>
                          <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>
                            {item.trackStock ? (item.quantityOnHand ?? "0") : "—"}
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
                              <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => toggleItemActive(item)}
                                >
                                  {item.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <RowActions
                                  showLabels
                                  onEdit={() => openEdit(item)}
                                  onDelete={() => setDeleteTarget(item)}
                                />
                              </div>
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
        onClose={() => {
          if (!saving && !imageUploading) {
            setOpen(false);
          }
        }}
        footer={
          <FormFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={saving || imageUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              loading={saving || imageUploading}
              disabled={Boolean(nameError) || saving || imageUploading || !canSave}
            >
              {editId ? "Save changes" : "Add item"}
            </Button>
          </FormFooter>
        }
      >
        <div className="form-body">
          <section className="form-fields">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Basics
            </h3>
            <Field id="categories" label="Menu category" required>
              <Select
                searchable
                value={form.primaryMenuCategoryId || form.menuCategoryIds[0] || ""}
                onChange={(e) => setMenuCategory(e.target.value)}
              >
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            {form.menuCategoryIds.length > 0 && additionalCategoryOptions.length > 0 ? (
              <Field id="additionalCategories" label="Additional categories">
                <Select
                  key={form.menuCategoryIds.join(",")}
                  searchable
                  value=""
                  onChange={(e) => addAdditionalCategory(e.target.value)}
                >
                  <option value="">Add another category…</option>
                  {additionalCategoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            {form.menuCategoryIds.length > 1 ? (
              <div className="flex flex-wrap gap-1.5">
                {form.menuCategoryIds
                  .filter((id) => id !== form.primaryMenuCategoryId)
                  .map((id) => {
                    const cat = categories.find((c) => c.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-cream-100)] px-2 py-1 text-xs text-[var(--color-foreground)]"
                      >
                        {cat?.name ?? id}
                        <button
                          type="button"
                          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                          aria-label={`Remove ${cat?.name ?? id}`}
                          onClick={() => removeCategory(id)}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
              </div>
            ) : null}

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Active</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Visible on QR menu, POS, table orders, and waiter app.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isSpecial}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      isSpecial: e.target.checked,
                      specialSortOrder: e.target.checked ? f.specialSortOrder : "0",
                    }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Special</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Highlight in the Specials section at the top of the menu.
                  </span>
                </span>
              </label>
              {form.isSpecial ? (
                <Field id="specialSortOrder" label="Special order">
                  <NumberInput
                    value={form.specialSortOrder}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, specialSortOrder: value }))
                    }
                    decimals={0}
                    min={0}
                  />
                </Field>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--color-foreground)]">Item type</p>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="itemTypeKind"
                  checked={!form.trackStock}
                  onChange={() =>
                    setForm((f) => ({
                      ...f,
                      trackStock: false,
                      directPurchaseItemId: "",
                      reorderLevel: "",
                    }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Prepared dish</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Made in the cafe — no stock tracking on the menu.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="itemTypeKind"
                  checked={form.trackStock}
                  onChange={() => {
                    setForm((f) => ({ ...f, trackStock: true }));
                    loadLinkOptions();
                  }}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Direct purchase product</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Items added manually in Direct Purchases — select one below to sell on the menu.
                  </span>
                </span>
              </label>
            </div>

            {!editId && form.trackStock ? (
              <Field
                id="directPurchaseLink"
                label="Direct purchase item"
                required
                hint="Items you typed in Direct Purchases that are not yet on the menu"
              >
                {linkOptionsLoading ? (
                  <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-50)] px-3 py-2 text-sm text-[var(--color-muted)]">
                    Loading direct purchase items…
                  </p>
                ) : linkOptions.length === 0 ? (
                  <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-50)] px-3 py-2 text-sm text-[var(--color-muted)]">
                    {linkedDirectPurchaseNames.length > 0 ? (
                      <>
                        All direct purchase items are already on the menu (
                        {linkedDirectPurchaseNames.join(", ")}). Record a purchase with a{" "}
                        <span className="font-medium text-[var(--color-foreground)]">new item name</span>{" "}
                        in{" "}
                        <a href="/direct-purchases" className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline">
                          Direct Purchases
                        </a>{" "}
                        first, then return here to add it to the menu.
                      </>
                    ) : (
                      <>
                        No direct purchase items yet. Save a purchase with item names in{" "}
                        <a href="/direct-purchases" className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline">
                          Direct Purchases
                        </a>{" "}
                        first.
                      </>
                    )}
                  </p>
                ) : (
                  <Select
                    searchable
                    value={form.directPurchaseItemId}
                    onChange={(e) => {
                      const selected = linkOptions.find((o) => o.id === e.target.value);
                      setForm((f) => ({
                        ...f,
                        directPurchaseItemId: e.target.value,
                        ...(selected
                          ? {
                              name: selected.name,
                              unitType: selected.unitType ?? f.unitType,
                              unitQuantity: selected.unitQuantity ?? f.unitQuantity,
                              costPerUnit: selected.ratePerUnit ?? "",
                            }
                          : { name: "", directPurchaseItemId: "", costPerUnit: "" }),
                      }));
                    }}
                  >
                    <option value="">Choose direct purchase item</option>
                    {linkOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                        {o.unitQuantity || o.unitType
                          ? ` (${[o.unitQuantity, o.unitType].filter(Boolean).join(" ")})`
                          : ""}
                        {o.ratePerUnit ? ` — rate: ${o.ratePerUnit}` : ""}
                        {o.quantityOnHand && Number(o.quantityOnHand) > 0
                          ? ` — stock: ${o.quantityOnHand}`
                          : ""}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            ) : null}

            <Field
              id="name"
              label="Item name"
              required
              error={nameError}
              hint={
                !editId && form.trackStock
                  ? "Filled from the direct purchase item you selected"
                  : undefined
              }
            >
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Chicken momo"
                disabled={!editId && form.trackStock}
                hasError={Boolean(nameError)}
              />
            </Field>

          </section>

          <section className="form-fields border-t border-[var(--color-border)] pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Item details
            </h3>
            <ImageUploadField
              id="itemImage"
              label="Item image"
              required
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

            <div className="form-grid">
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
                  disabled={!editId && form.trackStock}
                />
              </Field>
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
                  disabled={!editId && form.trackStock}
                />
              </Field>
            </div>
          </section>

          <section className="form-fields border-t border-[var(--color-border)] pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Pricing & stock
            </h3>
            <div className="form-grid">
              <Field
                id="cost"
                label="Cost per unit"
                required
                hint={
                  editId
                    ? "Changing cost affects future sales only. Past bills keep the cost recorded at checkout."
                    : directPurchaseCostLocked
                      ? "Filled from the latest rate per unit in Direct Purchases"
                      : !editId && form.trackStock
                        ? "Record a direct purchase with a rate first, or enter cost manually"
                        : "Must be less than sell price"
                }
              >
                <NumberInput
                  min={0}
                  value={form.costPerUnit}
                  onValueChange={(costPerUnit) =>
                    setForm((f) => ({ ...f, costPerUnit }))
                  }
                  disabled={directPurchaseCostLocked}
                />
              </Field>

              <Field id="sell" label="Sell price" required hint="Must be greater than cost price">
                <NumberInput
                  min={0}
                  value={form.sellPricePerUnit}
                  onValueChange={(sellPricePerUnit) =>
                    setForm((f) => ({ ...f, sellPricePerUnit }))
                  }
                />
              </Field>
            </div>

            {form.trackStock ? (
              <div
                className={cn(
                  "form-grid",
                  !editId && "sm:grid-cols-1",
                )}
              >
                {editId ? (
                  <Field
                    id="currentStock"
                    label="Current stock"
                    hint="Updated via Direct Purchases and POS sales"
                  >
                    <Input
                      value={form.currentStock}
                      disabled
                      placeholder="0"
                    />
                  </Field>
                ) : null}
                <Field
                  id="reorder"
                  label="Reorder level"
                  hint="Optional — alerts when at or below"
                >
                  <NumberInput
                    min={0}
                    decimals={0}
                    value={form.reorderLevel}
                    onValueChange={(reorderLevel) =>
                      setForm((f) => ({ ...f, reorderLevel }))
                    }
                    placeholder="Optional"
                  />
                </Field>
              </div>
            ) : null}
            {editId ? (
              <Field
                id="stockAdjustment"
                label="Stock quantity update"
                hint={
                  form.trackStock
                    ? "Optional — use + for add, - for reduce (e.g. 10 or -3)"
                    : "Enable direct purchase product to update quantity"
                }
              >
                <NumberInput
                  decimals={0}
                  allowNegative
                  value={form.stockAdjustmentQty}
                  onValueChange={(stockAdjustmentQty) =>
                    setForm((f) => ({ ...f, stockAdjustmentQty }))
                  }
                  disabled={!form.trackStock}
                  placeholder="e.g. 10 or -3"
                />
              </Field>
            ) : null}
          </section>

          <section className="form-fields border-t border-[var(--color-border)] pt-5">
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
