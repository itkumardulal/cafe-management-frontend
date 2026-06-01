"use client";

import { Suspense, useState } from "react";
import { LayoutGrid } from "lucide-react";
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
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatDateOnly } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type Row = {
  id: string;
  name: string;
  createdAt: string;
};

export default function TablesPage() {
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
        <TablesContent />
      </Suspense>
    </section>
  );
}

function TablesContent() {
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
    queryKey: "dining-tables",
    fetchFn: (p) => operationsApi.diningTables.list(p),
    defaultSort: { sortBy: "name", sortOrder: "asc" },
    errorMessage: "Failed to load tables",
  });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");

  const openCreate = () => {
    setEdit(null);
    setName("");
    setOpen(true);
  };

  const openEdit = (item: Row) => {
    setEdit(item);
    setName(item.name);
    setOpen(true);
  };

  const save = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      appToast.error("Table name is required");
      return;
    }

    try {
      if (edit) {
        await operationsApi.diningTables.update(edit.id, { name: trimmedName });
        appToast.success("Table updated");
      } else {
        await operationsApi.diningTables.create({ name: trimmedName });
        appToast.success("Table added");
      }
      setOpen(false);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save table"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await operationsApi.diningTables.remove(deleteTarget.id);
      appToast.success("Table removed");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to remove table"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Tables"
        description="Dining tables for dine-in POS orders."
        action={
          <Button type="button" size="sm" onClick={openCreate}>
            Add table
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
        emptyTitle="No Tables Found"
        emptyDescription="Add tables so staff can assign dine-in orders at POS."
        emptyIcon={LayoutGrid}
        emptyAction={{ label: "Add your first table", onClick: openCreate }}
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
              { label: "Created (newest)", sortBy: "createdAt", sortOrder: "desc" },
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
                fields={[{ label: "Created", value: formatDateOnly(item.createdAt) }]}
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
              {
                label: "Created",
                headerContent: (
                  <SortableTableHeader
                    label="Created"
                    sortKey="createdAt"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              {
                label: "Actions",
                thClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Dining tables"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
          >
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {formatDateOnly(item.createdAt)}
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
        title="Remove table?"
        description="Past sales will keep the table name on their receipts."
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={() => void confirmDelete()} loading={deleting}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={open}
        title={edit ? "Edit table" : "Add table"}
        description="Table names appear in the POS dine-in checkout dropdown."
        onClose={() => setOpen(false)}
      >
        <div className="space-y-5">
          <Field id="table-name" label="Table name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Table 1, Patio A"
            />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()}>
              {edit ? "Save changes" : "Add table"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
