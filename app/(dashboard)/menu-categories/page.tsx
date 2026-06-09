"use client";

import { Suspense, useState } from "react";
import { Tags } from "lucide-react";
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
import { SortableTableHeader } from "@/src/components/ui/sortable-table-header";
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
import { appToast } from "@/src/lib/toast";
import { DigitalMenuQrCard } from "@/src/components/admin/digital-menu-qr-card";
import { NumberInput } from "@/src/components/ui/number-input";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch } from "@/src/store/hooks";
import { invalidateMenuCategoryOptions } from "@/src/store/slices/reference-data.slice";

type Category = { id: string; name: string; sortOrder: number; menuItemCount: number };

function MenuCategoriesContent() {
  const dispatch = useAppDispatch();
  const {
    items: categories,
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
  } = usePaginatedList<Category>({
    queryKey: "menu-categories",
    fetchFn: (p) => operationsApi.menuCategories.list(p),
    defaultSort: { sortBy: "sortOrder", sortOrder: "asc" },
    errorMessage: "Failed to load categories",
  });

  const [catModal, setCatModal] = useState<"create" | "edit" | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catSortOrder, setCatSortOrder] = useState("0");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setCatModal("create");
    setEditCat(null);
    setCatName("");
    setCatSortOrder("0");
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setCatName(cat.name);
    setCatSortOrder(String(cat.sortOrder ?? 0));
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
      await refetch();
      dispatch(invalidateMenuCategoryOptions());
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete category"));
    } finally {
      setDeleting(false);
    }
  };

  const saveCategory = async () => {
    try {
      const sortOrder = Math.max(0, Number.parseInt(catSortOrder, 10) || 0);
      if (catModal === "edit" && editCat) {
        await operationsApi.menuCategories.update(editCat.id, {
          name: catName.trim(),
          sortOrder,
        });
        appToast.success("Category updated");
      } else {
        await operationsApi.menuCategories.create({
          name: catName.trim(),
          sortOrder,
        });
        appToast.success("Category created");
      }
      setCatModal(null);
      setCatName("");
      setCatSortOrder("0");
      await refetch();
      dispatch(invalidateMenuCategoryOptions());
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save category"));
    }
  };

  return (
    <>
      <PageHeader
        title="Menu categories"
        description="Organize your menu by category. Add items from the Menu items page."
        action={
          <Button type="button" size="sm" onClick={openCreate}>
            Add category
          </Button>
        }
      />

      <DigitalMenuQrCard />

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={categories.length}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        tableColumns={4}
        emptyTitle="No Menu Categories Found"
        emptyDescription="Create your first menu category to organize menu items."
        emptyIcon={Tags}
        emptyAction={{ label: "Add category", onClick: openCreate }}
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
              { label: "Sort order", sortBy: "sortOrder", sortOrder: "asc" },
              { label: "Name (A–Z)", sortBy: "name", sortOrder: "asc" },
              { label: "Name (Z–A)", sortBy: "name", sortOrder: "desc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {categories.map((cat) => (
              <ListCard
                key={cat.id}
                title={cat.name}
                fields={[
                  { label: "Sort order", value: String(cat.sortOrder ?? 0) },
                  {
                    label: "Menu items",
                    value: `${cat.menuItemCount} item${cat.menuItemCount === 1 ? "" : "s"}`,
                  },
                ]}
                actions={
                  <RowActions
                    showLabels
                    onEdit={() => openEdit(cat)}
                    onDelete={() => requestDelete(cat)}
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
                label: "Name",
                headerContent: (
                  <SortableTableHeader
                    label="Name"
                    sortKey="name"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              {
                label: "Sort order",
                headerContent: (
                  <SortableTableHeader
                    label="Sort order"
                    sortKey="sortOrder"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
                thClassName: tableCenterColumnClass,
              },
              { label: "Menu items", thClassName: tableCenterColumnClass },
              {
                label: "Actions",
                thClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Menu categories"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
          >
            {categories.map((cat) => (
              <tr key={cat.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{cat.name}</td>
                <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
                  {cat.sortOrder ?? 0}
                </td>
                <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>{cat.menuItemCount}</td>
                <td className="px-4 py-3.5">
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
      </PaginatedListSection>

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
          <FormFooter>
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
          </FormFooter>
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
          <Field
            id="catSortOrder"
            label="Sort order"
            hint="Lower numbers appear first on the customer menu"
          >
            <NumberInput
              value={catSortOrder}
              onValueChange={setCatSortOrder}
              decimals={0}
              allowNegative={false}
              min={0}
              placeholder="0"
            />
          </Field>
          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setCatModal(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveCategory()}>
              Save
            </Button>
          </FormFooter>
        </div>
      </Modal>
    </>
  );
}

function MenuCategoriesFallback() {
  return (
    <div className="space-y-4">
      <CardListSkeleton />
      <TableSkeleton columns={4} className="hidden md:block" />
      <PaginationSkeleton />
    </div>
  );
}

export default function MenuCategoriesPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense fallback={<MenuCategoriesFallback />}>
        <MenuCategoriesContent />
      </Suspense>
    </section>
  );
}
