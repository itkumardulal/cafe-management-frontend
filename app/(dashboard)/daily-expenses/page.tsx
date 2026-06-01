"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { DateRangeFilter } from "@/src/components/shared/date-range-filter";
import { FilterDrawer, FilterDrawerDesktop } from "@/src/components/shared/filter-drawer";
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
import { DatePicker } from "@/src/components/ui/date-picker";
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
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type ExpenseEntryRow = {
  id: string;
  expenseItemId: string;
  expenseItemName: string;
  amount: string;
  expenseDate: string;
  notes?: string | null;
  createdAt: string;
};

type ExpenseItemOption = { id: string; name: string };

const emptyForm = {
  expenseItemId: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function DailyExpensesPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <TableSkeleton columns={6} />
            <PaginationSkeleton />
          </div>
        }
      >
        <DailyExpensesContent />
      </Suspense>
    </section>
  );
}

function DailyExpensesContent() {
  const {
    items: entries,
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
    setFilters,
    clearFilters,
    refetch,
  } = usePaginatedList<ExpenseEntryRow>({
    queryKey: "daily-expenses",
    fetchFn: (p) => operationsApi.expenseEntries.list(p),
    defaultSort: { sortBy: "expenseDate", sortOrder: "desc" },
    filterKeys: ["fromDate", "toDate"],
    errorMessage: "Failed to load expenses",
  });

  const [expenseItems, setExpenseItems] = useState<ExpenseItemOption[]>([]);
  const [draftFromDate, setDraftFromDate] = useState(params.filters.fromDate ?? "");
  const [draftToDate, setDraftToDate] = useState(params.filters.toDate ?? "");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<ExpenseEntryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseEntryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadExpenseItems = useCallback(async () => {
    try {
      const data = await operationsApi.expenseItems.list({ limit: 100 });
      setExpenseItems(data.items.map((i) => ({ id: i.id, name: i.name })));
    } catch {
      setExpenseItems([]);
    }
  }, []);

  useEffect(() => {
    void loadExpenseItems();
  }, [loadExpenseItems]);

  useEffect(() => {
    setDraftFromDate(params.filters.fromDate ?? "");
    setDraftToDate(params.filters.toDate ?? "");
  }, [params.filters.fromDate, params.filters.toDate]);

  const applyDateFilter = () => {
    setFilters({
      fromDate: draftFromDate,
      toDate: draftToDate,
    });
  };

  const openCreate = () => {
    setEdit(null);
    setForm({
      ...emptyForm,
      expenseDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const openEdit = (entry: ExpenseEntryRow) => {
    setEdit(entry);
    setForm({
      expenseItemId: entry.expenseItemId,
      amount: entry.amount,
      expenseDate: String(entry.expenseDate).slice(0, 10),
      notes: entry.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!edit && !form.expenseItemId) {
      appToast.error("Select an expense item");
      return;
    }
    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      appToast.error("Enter a valid amount greater than zero");
      return;
    }
    if (!form.expenseDate) {
      appToast.error("Expense date is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        expenseItemId: form.expenseItemId,
        amount,
        expenseDate: form.expenseDate,
        notes: form.notes.trim() || undefined,
      };
      if (edit) {
        await operationsApi.expenseEntries.update(edit.id, payload);
        appToast.success("Expense updated");
      } else {
        await operationsApi.expenseEntries.create(payload);
        appToast.success("Expense recorded");
      }
      setOpen(false);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save expense"));
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
      await operationsApi.expenseEntries.remove(deleteTarget.id);
      appToast.success("Expense deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete expense"));
    } finally {
      setDeleting(false);
    }
  };

  const canAddExpense = expenseItems.length > 0;

  return (
    <>
      <PageHeader
        title="Daily expenses"
        description="Log day-to-day cafe expenses from your expense item catalog."
        action={
          <Button type="button" size="sm" onClick={openCreate} disabled={!canAddExpense}>
            Add expense
          </Button>
        }
      />

      {!canAddExpense ? (
        <p className="text-sm text-muted">
          Add at least one expense item before recording daily expenses.
        </p>
      ) : null}

      <FilterDrawerDesktop>
        <DateRangeFilter
          fromDate={draftFromDate}
          toDate={draftToDate}
          onFromDateChange={setDraftFromDate}
          onToDateChange={setDraftToDate}
          onApply={applyDateFilter}
          description="Filter entries by expense date."
        />
      </FilterDrawerDesktop>

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={entries.length}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        tableColumns={6}
        emptyTitle="No Daily Expenses Found"
        emptyDescription="Record expenses for the selected period, or clear the date filter."
        emptyIcon={Wallet}
        emptyAction={{ label: "Add expense", onClick: openCreate }}
        onClearFilters={() => {
          clearSearch();
          setDraftFromDate("");
          setDraftToDate("");
          clearFilters();
        }}
        currentPage={meta.page}
        totalPages={meta.totalPages}
        totalRecords={meta.total}
        pageSize={meta.limit}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        filters={
          <>
            <FilterDrawer
              open={filterDrawerOpen}
              onOpenChange={setFilterDrawerOpen}
              hasActiveFilters={Boolean(params.filters.fromDate || params.filters.toDate)}
              onApply={applyDateFilter}
              onReset={() => {
                setDraftFromDate("");
                setDraftToDate("");
                clearFilters();
              }}
            >
              <DateRangeFilter
                compact
                fromDate={draftFromDate}
                toDate={draftToDate}
                onFromDateChange={setDraftFromDate}
                onToDateChange={setDraftToDate}
                onApply={applyDateFilter}
              />
            </FilterDrawer>
          </>
        }
        mobileSort={
          <MobileSortSelect
            options={[
              { label: "Date (newest)", sortBy: "expenseDate", sortOrder: "desc" },
              { label: "Date (oldest)", sortBy: "expenseDate", sortOrder: "asc" },
              { label: "Amount (high)", sortBy: "amount", sortOrder: "desc" },
              { label: "Amount (low)", sortBy: "amount", sortOrder: "asc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {entries.map((entry) => (
              <ListCard
                key={entry.id}
                title={entry.expenseItemName}
                fields={[
                  { label: "Amount", value: formatMoney(entry.amount) },
                  { label: "Date", value: formatDateOnly(entry.expenseDate) },
                  { label: "Notes", value: entry.notes?.trim() || "—" },
                ]}
                actions={
                  <RowActions
                    showLabels
                    onEdit={() => openEdit(entry)}
                    onDelete={() => setDeleteTarget(entry)}
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
              "Expense item",
              {
                label: "Amount",
                thClassName: tableCenterColumnClass,
                headerContent: (
                  <SortableTableHeader
                    label="Amount"
                    sortKey="amount"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                    align="center"
                  />
                ),
              },
              {
                label: "Expense date",
                headerContent: (
                  <SortableTableHeader
                    label="Expense date"
                    sortKey="expenseDate"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              "Recorded",
              "Notes",
              {
                label: "Actions",
                thClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Daily expenses"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[52rem]"
          >
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                  {entry.expenseItemName}
                </td>
                <td className={cn("px-4 py-3.5 text-sm font-medium tabular-nums text-foreground", tableCenterCellClass)}>
                  {formatMoney(entry.amount)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {formatDateOnly(entry.expenseDate)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {entry.createdAt ? formatDateOnly(entry.createdAt) : "—"}
                </td>
                <td className="max-w-[220px] px-4 py-3.5 text-sm text-muted">
                  {entry.notes?.trim() ? (
                    <span className="line-clamp-2" title={entry.notes}>
                      {entry.notes}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <RowActions
                      showLabels
                      onEdit={() => openEdit(entry)}
                      onDelete={() => setDeleteTarget(entry)}
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
        title="Delete expense?"
        description="This action cannot be undone."
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Are you sure you want to delete the expense for{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.expenseItemName}</span>
            {deleteTarget ? ` (${formatMoney(deleteTarget.amount)})` : null}?
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
        title={edit ? "Edit expense" : "New expense"}
        description={
          edit
            ? "Update amount, date, or notes for this expense entry."
            : "Record a daily expense against an item from your catalog."
        }
        onClose={() => {
          if (!saving) {
            setOpen(false);
          }
        }}
        footer={
          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} loading={saving}>
              {edit ? "Save changes" : "Record expense"}
            </Button>
          </FormFooter>
        }
      >
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Expense details
            </h3>

            {edit ? (
              <div className="rounded-xl border border-(--color-border) bg-surface-muted px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  Expense item
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{edit.expenseItemName}</p>
                <p className="mt-0.5 text-xs text-muted">
                  To change the item, delete this entry and create a new one.
                </p>
              </div>
            ) : (
              <Field id="item" label="Expense item" required hint="From your expense items catalog">
                <Select
                  value={form.expenseItemId}
                  onChange={(e) => setForm((f) => ({ ...f, expenseItemId: e.target.value }))}
                  disabled={expenseItems.length === 0}
                >
                  <option value="">Choose expense item</option>
                  {expenseItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="amount" label="Amount" required hint="Expense amount in your local currency">
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 1500.00"
                />
              </Field>
              <Field id="date" label="Expense date" required>
                <DatePicker
                  id="date"
                  value={form.expenseDate}
                  onChange={(expenseDate) => setForm((f) => ({ ...f, expenseDate }))}
                  placeholder="Pick expense date"
                  aria-label="Expense date"
                />
              </Field>
            </div>

            <Field id="notes" label="Notes" hint="Optional — receipt ref, payment method, etc.">
              <textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Paid in cash, invoice #1042"
                className={cn(
                  "w-full resize-y rounded-xl border bg-(--color-surface) px-3 py-2.5 text-sm text-foreground",
                  "placeholder:text-subtle outline-none transition-colors",
                  "border-input focus:border-primary",
                )}
              />
            </Field>
          </section>
        </div>
      </Modal>
    </>
  );
}
