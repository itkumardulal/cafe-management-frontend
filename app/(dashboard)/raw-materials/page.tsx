"use client";

import { Suspense, useState } from "react";
import { Wheat } from "lucide-react";
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
import { hasEditChanges } from "@/src/lib/form-snapshot";
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
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <CardListSkeleton />
            <TableSkeleton columns={5} className="hidden md:block" />
            <PaginationSkeleton />
          </div>
        }
      >
        <RawMaterialsContent />
      </Suspense>
    </section>
  );
}

function RawMaterialsContent() {
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
  } = usePaginatedList<Row>({
    queryKey: "raw-materials",
    fetchFn: (p) => operationsApi.rawMaterials.list(p),
    defaultSort: { sortBy: "name", sortOrder: "asc" },
    errorMessage: "Failed to load raw materials",
  });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialForm, setInitialForm] = useState<{ name: string; unit: string; description: string } | null>(
    null,
  );
  const [form, setForm] = useState({ name: "", unit: "", description: "" });

  const canSave = hasEditChanges(Boolean(edit), form, initialForm);

  const openCreate = () => {
    setEdit(null);
    setForm({ name: "", unit: "", description: "" });
    setInitialForm(null);
    setOpen(true);
  };

  const openEdit = (item: Row) => {
    const next = {
      name: item.name,
      unit: item.unit,
      description: item.description ?? "",
    };
    setEdit(item);
    setForm(next);
    setInitialForm(next);
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
    if (edit && !canSave) {
      return;
    }

    setSaving(true);
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
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save raw material"));
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
      await operationsApi.rawMaterials.remove(deleteTarget.id);
      appToast.success("Raw material deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete raw material"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Raw materials"
        description="Catalog of ingredients and supplies."
        action={
          <Button type="button" size="sm" onClick={openCreate}>
            Add material
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
        tableColumns={5}
        emptyTitle="No Raw Materials Found"
        emptyDescription="Add your first raw material item."
        emptyIcon={Wheat}
        emptyAction={{ label: "Add material", onClick: openCreate }}
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
              { label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
              { label: "Oldest first", sortBy: "createdAt", sortOrder: "asc" },
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
                fields={[
                  { label: "Unit", value: item.unit },
                  { label: "Description", value: item.description?.trim() || "—" },
                  { label: "Added", value: formatAddedDate(item.createdAt) },
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
              { label: "Unit", thClassName: tableCenterColumnClass },
              "Description",
              "Added on",
              {
                label: "Actions",
                thClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Raw materials"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
          >
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{item.name}</td>
                <td className={cn("px-4 py-3.5 text-sm text-foreground", tableCenterCellClass)}>{item.unit}</td>
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
        <div className="form-fields">
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
          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} loading={saving} disabled={!canSave}>
              {edit ? "Save changes" : "Add material"}
            </Button>
          </FormFooter>
        </div>
      </Modal>
    </>
  );
}
