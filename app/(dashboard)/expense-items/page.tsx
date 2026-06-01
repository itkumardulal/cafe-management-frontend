"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
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
import { Select } from "@/src/components/ui/select";
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
import { MONTHLY_SHEET_CATEGORIES } from "@/src/lib/expense-categories";
import { formatDateOnly } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type Row = {
  id: string;
  name: string;
  description?: string | null;
  monthlySheetCategory: string;
  createdAt: string;
  salaryStaffUserId?: string | null;
  salaryStaffName?: string | null;
};
type StaffOption = { id: string; fullName: string; staffId: string | null };

export default function ExpenseItemsPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <TableSkeleton columns={5} />
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

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    monthlySheetCategory: "NONE",
    salaryStaffUserId: "",
  });

  const categoryOptions = useMemo(() => MONTHLY_SHEET_CATEGORIES, []);

  useEffect(() => {
    void operationsApi.stockRemovals.staffOptions().then(setStaffOptions).catch(() => setStaffOptions([]));
  }, []);

  const openCreate = () => {
    setEdit(null);
    setForm({ name: "", description: "", monthlySheetCategory: "NONE", salaryStaffUserId: "" });
    setOpen(true);
  };

  const save = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      appToast.error("Expense item name is required");
      return;
    }
    if (form.monthlySheetCategory === "STAFF_SALARY" && !form.salaryStaffUserId) {
      appToast.error("Select a staff member for salary category");
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        description: form.description.trim() || undefined,
        monthlySheetCategory: form.monthlySheetCategory,
        salaryStaffUserId:
          form.monthlySheetCategory === "STAFF_SALARY" ? form.salaryStaffUserId : undefined,
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
    } catch {
      appToast.error("Failed to save");
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

  const categoryLabel = useCallback(
    (value: string, salaryStaffName?: string | null) => {
      if (value === "STAFF_SALARY" && salaryStaffName) {
        return `${salaryStaffName} salary`;
      }
      return categoryOptions.find((c) => c.value === value)?.label ?? value;
    },
    [categoryOptions],
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
        tableColumns={5}
        emptyTitle="No Expense Items Found"
        emptyDescription="Create expense categories for daily logging."
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
                title={item.name}
                fields={[
                  {
                    label: "Category",
                    value: categoryLabel(item.monthlySheetCategory, item.salaryStaffName),
                  },
                  {
                    label: "Added",
                    value: item.createdAt ? formatDateOnly(item.createdAt) : "—",
                  },
                  { label: "Description", value: item.description?.trim() || "—" },
                ]}
                actions={
                  <RowActions
                    showLabels
                    onEdit={() => {
                      setEdit(item);
                      setForm({
                        name: item.name,
                        description: item.description ?? "",
                        monthlySheetCategory: item.monthlySheetCategory,
                        salaryStaffUserId: item.salaryStaffUserId ?? "",
                      });
                      setOpen(true);
                    }}
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
              { label: "Sheet category", thClassName: tableCenterColumnClass },
              "Added on",
              "Description",
              {
                label: "Actions",
                thClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Expense items"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[48rem]"
          >
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{item.name}</td>
                <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
                  {categoryLabel(item.monthlySheetCategory, item.salaryStaffName)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {item.createdAt ? formatDateOnly(item.createdAt) : "—"}
                </td>
                <td className="max-w-[240px] px-4 py-3.5 text-sm text-muted">
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
                      onEdit={() => {
                        setEdit(item);
                        setForm({
                          name: item.name,
                          description: item.description ?? "",
                          monthlySheetCategory: item.monthlySheetCategory,
                          salaryStaffUserId: item.salaryStaffUserId ?? "",
                        });
                        setOpen(true);
                      }}
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
        description="Create an expense catalog item and map it to a monthly sheet category."
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
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Expense details
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="name" label="Item name" required hint="Shown while logging daily expenses">
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Internet bill, John Doe salary"
                />
              </Field>
              <Field id="cat" label="Monthly sheet category" hint="Used for monthly reports">
                <Select
                  value={form.monthlySheetCategory}
                  onChange={(e) => {
                    const nextCategory = e.target.value;
                    setForm((current) => {
                      const currentName = current.name.trim().toLowerCase();
                      const autoName =
                        currentName === "" ||
                        currentName.endsWith("salary") ||
                        currentName.startsWith("staff ");
                      const selectedStaff = staffOptions.find(
                        (option) => option.id === current.salaryStaffUserId,
                      );
                      const nextSalaryName = selectedStaff
                        ? `${selectedStaff.fullName} salary`
                        : current.name;
                      return {
                        ...current,
                        monthlySheetCategory: nextCategory,
                        salaryStaffUserId:
                          nextCategory === "STAFF_SALARY" ? current.salaryStaffUserId : "",
                        name:
                          autoName && nextCategory === "STAFF_SALARY"
                            ? nextSalaryName
                            : current.name,
                      };
                    });
                  }}
                >
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {form.monthlySheetCategory === "STAFF_SALARY" ? (
              <Field
                id="salaryStaffUserId"
                label="Staff name"
                required
                hint="This salary category will be linked to the selected staff member"
              >
                <Select
                  value={form.salaryStaffUserId}
                  onChange={(e) => {
                    const nextStaffId = e.target.value;
                    const nextStaff = staffOptions.find((option) => option.id === nextStaffId);
                    setForm((current) => {
                      const currentName = current.name.trim().toLowerCase();
                      const autoName = currentName === "" || currentName.endsWith("salary");
                      return {
                        ...current,
                        salaryStaffUserId: nextStaffId,
                        name: autoName && nextStaff ? `${nextStaff.fullName} salary` : current.name,
                      };
                    });
                  }}
                >
                  <option value="">Choose staff</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field id="desc" label="Description" hint="Optional short context for your team">
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Monthly salary paid to kitchen staff"
              />
            </Field>
          </section>

          <div className="rounded-xl border border-(--color-border) bg-surface-muted px-4 py-3 text-xs text-muted">
            Choose "Staff salary" and pick a staff member to keep salary entries explicit (for example:
            "John Doe salary").
          </div>
        </div>
      </Modal>
    </>
  );
}
