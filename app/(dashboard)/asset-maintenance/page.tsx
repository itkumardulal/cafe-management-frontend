"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Wrench } from "lucide-react";
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
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { DatePicker } from "@/src/components/ui/date-picker";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { NumberInput } from "@/src/components/ui/number-input";
import { FilterSelect } from "@/src/components/shared/filter-select";
import { Select } from "@/src/components/ui/select";
import { SortableTableHeader } from "@/src/components/ui/sortable-table-header";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
} from "@/src/components/ui/table";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import type { AssetMaintenanceRow } from "@/src/lib/asset-types";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput } from "@/src/lib/money-input";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchAssetOptionsThunk } from "@/src/store/slices/reference-data.slice";

const emptyForm = {
  assetId: "",
  maintenanceDate: "",
  maintenanceCost: "",
  description: "",
  remarks: "",
  recordAsExpense: true,
};

export default function AssetMaintenancePage() {
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
        <AssetMaintenanceContent />
      </Suspense>
    </section>
  );
}

function AssetMaintenanceContent() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const assetOptions = useAppSelector((s) => s.referenceData.assetOptions);
  const [assetFilter, setAssetFilter] = useState(searchParams.get("assetId") ?? "");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    void dispatch(fetchAssetOptionsThunk({}));
  }, [dispatch]);

  useEffect(() => {
    const assetId = searchParams.get("assetId");
    if (assetId) {
      setAssetFilter(assetId);
    }
  }, [searchParams]);

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
    setFilters,
    clearFilters,
    refetch,
  } = usePaginatedList<AssetMaintenanceRow>({
    queryKey: "asset-maintenance",
    fetchFn: (p) =>
      operationsApi.assetMaintenance.list({
        ...p,
        ...(assetFilter ? { assetId: assetFilter } : {}),
      }),
    filterKeys: ["fromDate", "toDate"],
    defaultSort: { sortBy: "maintenanceDate", sortOrder: "desc" },
    errorMessage: "Failed to load maintenance records",
    extraCacheKey: assetFilter,
  });

  useEffect(() => {
    setDraftFromDate(params.filters.fromDate ?? "");
    setDraftToDate(params.filters.toDate ?? "");
  }, [params.filters.fromDate, params.filters.toDate]);

  const applyDateFilter = () => {
    setFilters({
      fromDate: draftFromDate,
      toDate: draftToDate,
    });
    setFilterDrawerOpen(false);
  };

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AssetMaintenanceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetMaintenanceRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEdit(null);
    setForm({
      ...emptyForm,
      assetId: assetFilter || assetOptions[0]?.id || "",
      maintenanceDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const openEdit = (row: AssetMaintenanceRow) => {
    setEdit(row);
    setForm({
      assetId: row.assetId,
      maintenanceDate: row.maintenanceDate.slice(0, 10),
      maintenanceCost: row.maintenanceCost,
      description: row.description ?? "",
      remarks: row.remarks ?? "",
      recordAsExpense: row.recordAsExpense,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.assetId) {
      appToast.error("Asset is required");
      return;
    }
    if (!form.maintenanceDate) {
      appToast.error("Maintenance date is required");
      return;
    }
    const cost = parseMoneyInput(form.maintenanceCost);
    if (cost.invalid || cost.amount < 0) {
      appToast.error("Enter a valid maintenance cost");
      return;
    }
    const recordAsExpense = cost.amount > 0 ? form.recordAsExpense : false;
    try {
      const payload = {
        assetId: form.assetId,
        maintenanceDate: form.maintenanceDate,
        maintenanceCost: cost.amount,
        description: form.description.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
        recordAsExpense,
      };
      if (edit) {
        await operationsApi.assetMaintenance.update(edit.id, payload);
        appToast.success("Maintenance updated");
      } else {
        await operationsApi.assetMaintenance.create(payload);
        appToast.success("Maintenance recorded");
      }
      setOpen(false);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save maintenance"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await operationsApi.assetMaintenance.remove(deleteTarget.id);
      appToast.success("Maintenance deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete maintenance"));
    } finally {
      setDeleting(false);
    }
  };

  const canAdd = assetOptions.length > 0;
  const parsedFormCost = parseMoneyInput(form.maintenanceCost);
  const canRecordAsExpense = !parsedFormCost.invalid && parsedFormCost.amount > 0;

  return (
    <>
      <PageHeader
        title="Maintenance records"
        description="Track repairs and servicing costs for operational assets."
        action={
          <Button type="button" size="sm" onClick={openCreate} disabled={!canAdd}>
            Add maintenance
          </Button>
        }
      />

      {!canAdd ? (
        <p className="text-sm text-muted">Register at least one active asset before adding maintenance.</p>
      ) : null}

      <FilterDrawerDesktop>
        <DateRangeFilter
          fromDate={draftFromDate}
          toDate={draftToDate}
          onFromDateChange={setDraftFromDate}
          onToDateChange={setDraftToDate}
          onApply={applyDateFilter}
          description="Filter by maintenance date."
        />
      </FilterDrawerDesktop>

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={items.length}
        hasActiveFilters={hasActiveFilters || Boolean(assetFilter)}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        tableColumns={6}
        emptyTitle="No maintenance records"
        emptyDescription="Log servicing and repair costs for your assets."
        emptyIcon={Wrench}
        emptyAction={{ label: "Add maintenance", onClick: openCreate }}
        onClearFilters={() => {
          clearSearch();
          setAssetFilter("");
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
            <FilterSelect
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              className="min-w-[10rem]"
            >
              <option value="">All assets</option>
              {assetOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayLabel}
                </option>
              ))}
            </FilterSelect>
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
              { label: "Newest first", sortBy: "maintenanceDate", sortOrder: "desc" },
              { label: "Oldest first", sortBy: "maintenanceDate", sortOrder: "asc" },
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
                title={formatDateOnly(item.maintenanceDate)}
                subtitle={
                  item.assetCode && item.assetName
                    ? `${item.assetCode} — ${item.assetName}`
                    : undefined
                }
                fields={[
                  { label: "Cost", value: formatMoney(item.maintenanceCost) },
                  ...(item.expenseEntryId
                    ? [{ label: "Expense", value: "Recorded" as const }]
                    : []),
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
                label: "Date",
                headerContent: (
                  <SortableTableHeader
                    label="Date"
                    sortKey="maintenanceDate"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              "Asset",
              "Description",
              {
                label: "Cost",
                headerContent: (
                  <SortableTableHeader
                    label="Cost"
                    sortKey="maintenanceCost"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              "Created by",
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Maintenance records"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
          >
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm">{formatDateOnly(item.maintenanceDate)}</td>
                <td className="px-4 py-3.5 text-sm">
                  {item.assetCode && item.assetName
                    ? `${item.assetCode} — ${item.assetName}`
                    : "—"}
                </td>
                <td className="px-4 py-3.5 text-sm">{item.description?.trim() || "—"}</td>
                <td className="px-4 py-3.5 text-sm tabular-nums">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{formatMoney(item.maintenanceCost)}</span>
                    {item.expenseEntryId ? (
                      <Badge variant="success" size="sm">
                        Expense recorded
                      </Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm">{item.createdBy?.name ?? "—"}</td>
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

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Edit maintenance" : "Add maintenance"}>
        <div className="space-y-4">
          <Field id="maintenance-asset" label="Asset" required>
            <Select
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
            >
              <option value="">Select asset</option>
              {assetOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayLabel}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="maintenance-date" label="Maintenance date" required>
            <DatePicker
              value={form.maintenanceDate}
              onChange={(v) => setForm({ ...form, maintenanceDate: v })}
            />
          </Field>
          <Field id="maintenance-cost" label="Cost" required>
            <NumberInput
              value={form.maintenanceCost}
              onValueChange={(maintenanceCost) => setForm({ ...form, maintenanceCost })}
            />
          </Field>
          <Field
            id="maintenance-record-expense"
            label="Expense"
            hint={
              canRecordAsExpense
                ? "Creates a matching entry under Daily expenses."
                : "Enter a cost above zero to record as an expense."
            }
          >
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.recordAsExpense}
                disabled={!canRecordAsExpense}
                onChange={(e) => setForm({ ...form, recordAsExpense: e.target.checked })}
                className="size-4 rounded border-[var(--color-border)] disabled:opacity-50"
              />
              Record as expense
            </label>
          </Field>
          <Field id="maintenance-description" label="Description">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field id="maintenance-remarks" label="Remarks">
            <Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
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
        title="Delete maintenance"
      >
        <p className="text-sm text-muted">Delete this maintenance record?</p>
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
