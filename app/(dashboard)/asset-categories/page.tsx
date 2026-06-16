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
} from "@/src/components/ui/table";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import type { AssetCategoryRow } from "@/src/lib/asset-types";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch } from "@/src/store/hooks";
import { invalidateAssetCategoryOptions } from "@/src/store/slices/reference-data.slice";

const emptyForm = { name: "", description: "" };

export default function AssetCategoriesPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <CardListSkeleton />
            <TableSkeleton columns={3} className="hidden md:block" />
            <PaginationSkeleton />
          </div>
        }
      >
        <AssetCategoriesContent />
      </Suspense>
    </section>
  );
}

function AssetCategoriesContent() {
  const dispatch = useAppDispatch();
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
  } = usePaginatedList<AssetCategoryRow>({
    queryKey: "asset-categories",
    fetchFn: (p) => operationsApi.assetCategories.list(p),
    defaultSort: { sortBy: "name", sortOrder: "asc" },
    errorMessage: "Failed to load asset categories",
  });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AssetCategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetCategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const invalidateOptions = () => {
    dispatch(invalidateAssetCategoryOptions());
  };

  const openCreate = () => {
    setEdit(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item: AssetCategoryRow) => {
    setEdit(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      appToast.error("Category name is required");
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };
      if (edit) {
        await operationsApi.assetCategories.update(edit.id, payload);
        appToast.success("Category updated");
      } else {
        await operationsApi.assetCategories.create(payload);
        appToast.success("Category added");
      }
      setOpen(false);
      invalidateOptions();
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save category"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await operationsApi.assetCategories.remove(deleteTarget.id);
      appToast.success("Category deleted");
      setDeleteTarget(null);
      invalidateOptions();
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete category"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Asset categories"
        description="Group long-term operational assets — furniture, equipment, electronics, and more."
        action={
          <Button type="button" size="sm" onClick={openCreate}>
            Add category
          </Button>
        }
      />

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
        tableColumns={3}
        emptyTitle="No categories yet"
        emptyDescription="Create categories to organize your cafe assets."
        emptyIcon={Tags}
        emptyAction={{ label: "Add category", onClick: openCreate }}
        onClearFilters={clearFilters}
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
                subtitle={item.description ?? undefined}
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
              "Description",
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Asset categories"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
          >
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium">{item.name}</td>
                <td className="px-4 py-3.5 text-sm text-muted">{item.description?.trim() || "—"}</td>
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
        </Card>
      </PaginatedListSection>

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Edit category" : "Add category"}>
        <div className="space-y-4">
          <Field id="category-name" label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field id="category-description" label="Description">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
        </div>
        <FormFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </FormFooter>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete category"
      >
        <p className="text-sm text-muted">
          Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone if assets use this
          category.
        </p>
        <FormFooter>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={confirmDelete}>
            Delete
          </Button>
        </FormFooter>
      </Modal>
    </>
  );
}
