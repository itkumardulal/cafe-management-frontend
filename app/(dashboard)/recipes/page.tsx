"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { ChefHat, Printer } from "lucide-react";
import { RecipeLinesEditor } from "@/src/components/menu-items/recipe-lines-editor";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { RowActions } from "@/src/components/shared/row-actions";
import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { NumberInput } from "@/src/components/ui/number-input";
import { Select } from "@/src/components/ui/select";
import { SortableTableHeader } from "@/src/components/ui/sortable-table-header";
import { FilterSelect } from "@/src/components/shared/filter-select";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { cn } from "@/src/lib/cn";
import { getApiErrorMessage } from "@/src/lib/api-error";
import {
  buildRecipePayload,
  emptyRecipeForm,
  recipeDetailToForm,
  type PreparedDishOption,
  type RawMaterialOption,
  type RecipeDetail,
  type RecipeFormState,
  type RecipeListItem,
} from "@/src/lib/recipe-types";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchMenuCategoryOptionsThunk } from "@/src/store/slices/reference-data.slice";

function formatUpdatedDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatYield(item: RecipeListItem) {
  const unit = item.yieldUnit?.trim();
  return unit ? `${item.yieldQuantity} ${unit}` : item.yieldQuantity;
}

export default function RecipesPage() {
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
        <RecipesContent />
      </Suspense>
    </section>
  );
}

function RecipesContent() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.referenceData.menuCategoryOptions);
  const menuCategoryOptionsStatus = useAppSelector(
    (state) => state.referenceData.menuCategoryOptionsStatus,
  );

  const [categoryFilter, setCategoryFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<RecipeListItem | null>(null);
  const [viewDetail, setViewDetail] = useState<RecipeDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecipeListItem | null>(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [form, setForm] = useState<RecipeFormState>(emptyRecipeForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [preparedDishes, setPreparedDishes] = useState<PreparedDishOption[]>([]);
  const [preparedDishesLoading, setPreparedDishesLoading] = useState(false);
  const [rawMaterialOptions, setRawMaterialOptions] = useState<RawMaterialOption[]>([]);
  const [rawMaterialOptionsLoading, setRawMaterialOptionsLoading] = useState(false);

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
    toggleSort,
    setSort,
    params,
    clearFilters,
    refetch,
  } = usePaginatedList<RecipeListItem>({
    queryKey: "recipes",
    fetchFn: (p) =>
      operationsApi.recipes.list({
        ...p,
        ...(categoryFilter ? { menuCategoryId: categoryFilter } : {}),
      }),
    defaultSort: { sortBy: "name", sortOrder: "asc" },
    errorMessage: "Failed to load recipes",
    extraCacheKey: categoryFilter,
  });

  const loadFormRefs = useCallback(() => {
    setPreparedDishesLoading(true);
    setRawMaterialOptionsLoading(true);
    void Promise.all([
      operationsApi.recipes.preparedDishOptions(),
      operationsApi.recipes.rawMaterialOptions(),
    ])
      .then(([dishes, materials]) => {
        setPreparedDishes(dishes);
        setRawMaterialOptions(materials);
      })
      .catch((error) => {
        setPreparedDishes([]);
        setRawMaterialOptions([]);
        appToast.error(getApiErrorMessage(error, "Failed to load recipe options"));
      })
      .finally(() => {
        setPreparedDishesLoading(false);
        setRawMaterialOptionsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (menuCategoryOptionsStatus === "loaded" || menuCategoryOptionsStatus === "loading") {
      return;
    }
    void dispatch(fetchMenuCategoryOptionsThunk());
  }, [dispatch, menuCategoryOptionsStatus]);

  useEffect(() => {
    if (formOpen) {
      loadFormRefs();
    }
  }, [formOpen, loadFormRefs]);

  const openCreate = () => {
    setEditRow(null);
    setSelectedMenuItemId("");
    setForm(emptyRecipeForm());
    setFormOpen(true);
  };

  const openEdit = async (item: RecipeListItem) => {
    setEditRow(item);
    setSelectedMenuItemId(item.menuItemId);
    setFormOpen(true);
    setModalLoading(true);
    try {
      const detail = await operationsApi.recipes.get(item.menuItemId);
      setForm(recipeDetailToForm(detail));
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load recipe"));
      setFormOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const openView = async (item: RecipeListItem) => {
    setViewOpen(true);
    setViewDetail(null);
    setModalLoading(true);
    try {
      const detail = await operationsApi.recipes.get(item.menuItemId);
      setViewDetail(detail);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load recipe"));
      setViewOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const validateForm = () => {
    if (!editRow && !selectedMenuItemId) {
      appToast.error("Select a menu item");
      return false;
    }
    const hasPartialLine = form.lines.some(
      (line) =>
        (line.rawMaterialItemId && !line.quantity.trim()) ||
        (!line.rawMaterialItemId && (line.quantity.trim() || line.unit.trim())),
    );
    if (hasPartialLine) {
      appToast.error("Complete each ingredient row or remove it");
      return false;
    }
    const ids = form.lines
      .filter((line) => line.rawMaterialItemId && line.quantity.trim())
      .map((line) => line.rawMaterialItemId);
    if (new Set(ids).size !== ids.length) {
      appToast.error("Each ingredient can only appear once in the recipe");
      return false;
    }
    const payload = buildRecipePayload(
      form.yieldQuantity,
      form.yieldUnit,
      form.prepNotes,
      form.lines,
    );
    if (!payload) {
      appToast.error("Add at least one ingredient with quantity");
      return false;
    }
    return payload;
  };

  const save = async () => {
    const menuItemId = editRow?.menuItemId ?? selectedMenuItemId;
    if (!menuItemId) {
      appToast.error("Select a menu item");
      return;
    }
    const payload = validateForm();
    if (!payload) return;

    setSaving(true);
    try {
      await operationsApi.recipes.upsert(menuItemId, payload);
      appToast.success(editRow ? "Recipe updated" : "Recipe added");
      setFormOpen(false);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save recipe"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await operationsApi.recipes.remove(deleteTarget.menuItemId);
      appToast.success("Recipe deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete recipe"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Recipes"
        description="Standard ingredients and preparation steps for prepared dishes."
        action={
          <Button type="button" size="sm" onClick={openCreate}>
            Add recipe
          </Button>
        }
      />

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={items.length}
        hasActiveFilters={hasActiveFilters || Boolean(categoryFilter)}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder ?? "Search dish or ingredient…"}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        filters={
          <FilterSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-w-[10rem]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
        }
        tableColumns={6}
        emptyTitle="No recipes yet"
        emptyDescription="Add a recipe for a prepared dish from your menu."
        emptyIcon={ChefHat}
        emptyAction={{ label: "Add recipe", onClick: openCreate }}
        onClearFilters={() => {
          clearSearch();
          clearFilters();
          setCategoryFilter("");
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
              { label: "Category (A–Z)", sortBy: "categoryName", sortOrder: "asc" },
              { label: "Recently updated", sortBy: "updatedAt", sortOrder: "desc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {items.map((item) => (
              <ListCard
                key={item.id}
                title={item.name}
                subtitle={item.categoryName}
                fields={[
                  { label: "Yield", value: formatYield(item) },
                  { label: "Ingredients", value: String(item.lineCount) },
                  { label: "Updated", value: formatUpdatedDate(item.updatedAt) },
                ]}
                actions={
                  <RowActions
                    showLabels
                    onView={() => void openView(item)}
                    onEdit={() => void openEdit(item)}
                    onDelete={() => setDeleteTarget(item)}
                  />
                }
              />
            ))}
          </ListCardStack>
        }
      >
        <Card density="compact" className="overflow-hidden p-0">
          <ResponsiveTable
            headers={[
              {
                label: "Dish",
                headerContent: (
                  <SortableTableHeader
                    label="Dish"
                    sortKey="name"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              {
                label: "Category",
                thClassName: tableCenterColumnClass,
                headerContent: (
                  <SortableTableHeader
                    label="Category"
                    sortKey="categoryName"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                    className="justify-center"
                  />
                ),
              },
              { label: "Yield", thClassName: tableCenterColumnClass },
              { label: "Ingredients", thClassName: tableCenterColumnClass },
              {
                label: "Updated",
                headerContent: (
                  <SortableTableHeader
                    label="Updated"
                    sortKey="updatedAt"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Recipes"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
          >
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{item.name}</td>
                <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
                  {item.categoryName}
                </td>
                <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>
                  {formatYield(item)}
                </td>
                <td className={cn("px-4 py-3.5 text-sm tabular-nums text-foreground", tableCenterCellClass)}>
                  {item.lineCount}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {formatUpdatedDate(item.updatedAt)}
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <RowActions
                      showLabels
                      onView={() => void openView(item)}
                      onEdit={() => void openEdit(item)}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      </PaginatedListSection>

      <Modal
        open={formOpen}
        title={editRow ? "Edit recipe" : "Add recipe"}
        size="lg"
        mobileVariant="fullscreen"
        onClose={() => {
          if (!saving) setFormOpen(false);
        }}
      >
        {modalLoading ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">Loading…</p>
        ) : (
          <div className="form-fields">
            {!editRow ? (
              <Field id="menuItem" label="Menu item" required hint="Prepared dishes without a recipe">
                {preparedDishesLoading ? (
                  <p className="text-sm text-[var(--color-muted)]">Loading menu items…</p>
                ) : preparedDishes.length === 0 ? (
                  <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-50)] px-3 py-2 text-sm text-[var(--color-muted)]">
                    No prepared dishes available. Add a prepared dish in{" "}
                    <a href="/menu-items" className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline">
                      Menu Items
                    </a>{" "}
                    first (not direct purchase products).
                  </p>
                ) : (
                  <Select
                    searchable
                    value={selectedMenuItemId}
                    onChange={(e) => setSelectedMenuItemId(e.target.value)}
                  >
                    <option value="">Choose a dish</option>
                    {preparedDishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name} ({dish.categoryName})
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            ) : (
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm">
                <span className="text-[var(--color-muted)]">Dish: </span>
                <span className="font-medium text-[var(--color-foreground)]">{editRow.name}</span>
                <span className="text-[var(--color-muted)]"> · {editRow.categoryName}</span>
              </div>
            )}

            <div className="form-grid">
              <Field id="recipeYieldQty" label="Recipe yield" hint="How many servings this recipe makes">
                <NumberInput
                  min={0}
                  value={form.yieldQuantity}
                  onValueChange={(yieldQuantity) => setForm((f) => ({ ...f, yieldQuantity }))}
                  placeholder="e.g. 10"
                />
              </Field>
              <Field id="recipeYieldUnit" label="Yield unit" hint="e.g. pieces, plates">
                <Input
                  value={form.yieldUnit}
                  onChange={(e) => setForm((f) => ({ ...f, yieldUnit: e.target.value }))}
                  placeholder="e.g. pieces"
                />
              </Field>
            </div>

            {rawMaterialOptionsLoading ? (
              <p className="text-sm text-[var(--color-muted)]">Loading ingredients…</p>
            ) : rawMaterialOptions.length === 0 ? (
              <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-50)] px-3 py-2 text-sm text-[var(--color-muted)]">
                No raw materials yet. Add ingredients in{" "}
                <a href="/raw-materials" className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline">
                  Raw Materials
                </a>{" "}
                first.
              </p>
            ) : (
              <RecipeLinesEditor
                lines={form.lines}
                onChange={(lines) => setForm((f) => ({ ...f, lines }))}
                options={rawMaterialOptions}
                disabled={rawMaterialOptionsLoading}
              />
            )}

            <Field id="prepNotes" label="Preparation notes" hint="Optional steps for the kitchen">
              <textarea
                id="prepNotes"
                value={form.prepNotes}
                onChange={(e) => setForm((f) => ({ ...f, prepNotes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                placeholder="Mix filling, fold, steam 12 minutes…"
              />
            </Field>

            <FormFooter>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void save()}
                loading={saving}
                disabled={
                  (!editRow && (preparedDishes.length === 0 || !selectedMenuItemId)) ||
                  rawMaterialOptions.length === 0
                }
              >
                {editRow ? "Save changes" : "Add recipe"}
              </Button>
            </FormFooter>
          </div>
        )}
      </Modal>

      <Modal
        open={viewOpen}
        title={viewDetail?.name ?? "Recipe"}
        size="lg"
        mobileVariant="fullscreen"
        onClose={() => {
          setViewOpen(false);
          setViewDetail(null);
        }}
        footer={
          viewDetail ? (
            <div className="flex w-full flex-wrap justify-end gap-2 print:hidden">
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                <Printer size={16} className="mr-2" aria-hidden />
                Print
              </Button>
              <Button type="button" variant="secondary" onClick={() => setViewOpen(false)}>
                Close
              </Button>
            </div>
          ) : undefined
        }
      >
        {modalLoading ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">Loading…</p>
        ) : viewDetail ? (
          <div id="recipe-print-area" className="space-y-5">
            <p className="text-sm text-[var(--color-muted)]">{viewDetail.categoryName}</p>
            <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/8 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">Yield</p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
                Makes {viewDetail.yieldQuantity}
                {viewDetail.yieldUnit ? ` ${viewDetail.yieldUnit}` : ""}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">Ingredients</h3>
              <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-surface-muted)]">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Ingredient</th>
                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                      <th className="px-3 py-2 text-left font-medium">Unit</th>
                      <th className="px-3 py-2 text-left font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetail.lines.map((line) => (
                      <tr key={line.rawMaterialItemId} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2">{line.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{line.quantity}</td>
                        <td className="px-3 py-2 text-[var(--color-muted)]">{line.unit ?? "—"}</td>
                        <td className="px-3 py-2 text-[var(--color-muted)]">{line.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {viewDetail.prepNotes ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">Preparation</h3>
                <p className="whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm">
                  {viewDetail.prepNotes}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Delete recipe?"
        description="The menu item will remain; only its recipe will be removed."
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Are you sure you want to delete the recipe for{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={() => void confirmDelete()} loading={deleting}>
              Delete recipe
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #recipe-print-area,
          #recipe-print-area * {
            visibility: visible;
          }
          #recipe-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
}
