"use client";

import { Suspense, useCallback, useState } from "react";
import { Wallet } from "lucide-react";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { RowActions } from "@/src/components/shared/row-actions";
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
} from "@/src/components/ui/table";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { cn } from "@/src/lib/cn";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatDateOnly } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type Row = {
  id: string;
  name: string;
  displayLabel: string;
  description?: string | null;
  createdAt: string;
};

const emptyForm = {
  name: "",
  description: "",
};

export default function ExpenseItemsPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <TableSkeleton columns={4} />
            <PaginationSkeleton />
          </div>
        }
      >
        <ExpenseItemsContent />
      </Suspense>
    </section>
  );
}

function ExpenseItemsContent() {
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
    queryKey: "expense-items",
    fetchFn: (p) => operationsApi.expenseItems.list(p),
    defaultSort: { sortBy: "name", sortOrder: "asc" },
    errorMessage: "Failed to load expense items",
  });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEdit(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEditForm = (item: Row) => {
    setEdit(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      appToast.error("Name is required");
      return;
    }

    try {
      const payload = {
        name,
        description: form.description.trim() || undefined,
      };
      if (edit) {
        await operationsApi.expenseItems.update(edit.id, payload);
        appToast.success("Updated");
      } else {
        await operationsApi.expenseItems.create(payload);
        appToast.success("Created");
      }
      setOpen(false);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await operationsApi.expenseItems.remove(deleteTarget.id);
      appToast.success("Expense item deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete expense item"));
    } finally {
      setDeleting(false);
    }
  };

  const itemLabel = useCallback(
    (item: Pick<Row, "name" | "displayLabel">) => item.name || item.displayLabel,
    [],
  );

  return (
    <>
      <PageHeader
        title="Expense items"
        description="Catalog for daily expense entries."
        action={
          <Button type="button" size="sm" onClick={openCreate}>
            Add item
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
        tableColumns={4}
        emptyTitle="No Expense Items Found"
        emptyDescription="Create expense items for daily logging."
        emptyIcon={Wallet}
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
                title={itemLabel(item)}
                fields={[
                  {
                    label: "Added",
                    value: item.createdAt ? formatDateOnly(item.createdAt) : "—",
                  },
                  { label: "Description", value: item.description?.trim() || "—" },
                ]}
                actions={
                  <RowActions
                    showLabels
                    onEdit={() => openEditForm(item)}
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
              "Added on",
              "Description",
              {
                label: "Actions",
                thClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Expense items"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[40rem]"
          >
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                  {itemLabel(item)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3.5 text-sm text-muted whitespace-nowrap",
                    tableCenterCellClass,
                  )}
                >
                  {item.createdAt ? formatDateOnly(item.createdAt) : "—"}
                </td>
                <td className="max-w-[280px] px-4 py-3.5 text-sm text-muted">
                  {item.description ? (
                    <span className="line-clamp-2" title={item.description}>
                      {item.description}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <RowActions
                      showLabels
                      onEdit={() => openEditForm(item)}
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
        title="Delete expense item?"
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
            <span className="font-semibold text-foreground">
              {deleteTarget ? itemLabel(deleteTarget) : ""}
            </span>
            ?
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
            <Button
              type="button"
              variant="danger"
              onClick={() => void confirmDelete()}
              loading={deleting}
            >
              Yes, delete
            </Button>
          </FormFooter>
        </div>
      </Modal>

      <Modal
        open={open}
        size="lg"
        mobileVariant="fullscreen"
        title={edit ? "Edit expense item" : "New expense item"}
        description="Add a named expense item for daily logging."
        onClose={() => setOpen(false)}
        footer={
          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()}>
              Save item
            </Button>
          </FormFooter>
        }
      >
        <div className="form-body">
          <section className="form-fields">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Expense details
            </h3>
            <Field id="name" label="Name" required hint="Shown when logging daily expenses">
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rent, Internet, Staff salary"
              />
            </Field>
            <Field id="desc" label="Description" hint="Optional short context for your team">
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Monthly internet subscription"
              />
            </Field>
          </section>
        </div>
      </Modal>
    </>
  );
}
