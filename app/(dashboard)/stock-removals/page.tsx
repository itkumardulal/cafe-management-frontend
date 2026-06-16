"use client";

import { PackageMinus, Pencil, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DateRangeFilter } from "@/src/components/shared/date-range-filter";
import { DetailInfoCard } from "@/src/components/shared/detail-info-card";
import { DetailLineItemsSection } from "@/src/components/shared/detail-line-items-section";
import { LineItemCard } from "@/src/components/shared/line-item-card";
import { FilterDrawer, FilterDrawerDesktop } from "@/src/components/shared/filter-drawer";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { RowActions } from "@/src/components/shared/row-actions";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { ViewModalSkeleton } from "@/src/components/skeletons/view-modal-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { SortableTableHeader } from "@/src/components/ui/sortable-table-header";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NumberInput } from "@/src/components/ui/number-input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { formatDateTime, formatMoney } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchStockRemovalRefsThunk } from "@/src/store/slices/reference-data.slice";

type Line = { itemKey: string; quantity: string };

type RemovalRow = {
  id: string;
  receiptNo: string;
  entryAt: string;
  createdAt: string;
  reason: string;
  notes?: string | null;
  staffName: string | null;
  createdByName: string | null;
  lineCount: number;
};

type RemovalDetail = RemovalRow & {
  staffUserId?: string | null;
  lines: Array<{
    id: string;
    lineType: "MENU" | "INVENTORY";
    menuItemId: string | null;
    stockItemId: string | null;
    itemName: string;
    unit?: string | null;
    quantity: string;
  }>;
};

type StaffOption = { id: string; fullName: string; staffId: string | null };

function reasonLabel(reason: string) {
  return reason === "STAFF_USE" ? "Staff use" : "Damage";
}

const emptyLine = (): Line => ({ itemKey: "", quantity: "1" });

export default function StockRemovalsPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense fallback={<div className="space-y-4"><TableSkeleton columns={7} /><PaginationSkeleton /></div>}>
        <StockRemovalsContent />
      </Suspense>
    </section>
  );
}

function StockRemovalsContent() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const lineOptions = useAppSelector(
    (state) =>
      state.referenceData.stockRemovalLineOptions ?? { menuItems: [], stockItems: [] },
  );
  const staffOptions = useAppSelector((state) => state.referenceData.stockRemovalStaffOptions);
  const stockRemovalRefsStatus = useAppSelector(
    (state) => state.referenceData.stockRemovalRefsStatus,
  );
  const {
    items: removals,
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
  } = usePaginatedList<RemovalRow>({
    queryKey: "stock-removals",
    fetchFn: (p) => operationsApi.stockRemovals.list(p),
    defaultSort: { sortBy: "entryAt", sortOrder: "desc" },
    filterKeys: ["fromDate", "toDate"],
    errorMessage: "Failed to load stock removals",
  });

  const [draftFromDate, setDraftFromDate] = useState(params.filters.fromDate ?? "");
  const [draftToDate, setDraftToDate] = useState(params.filters.toDate ?? "");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [entryAt, setEntryAt] = useState(new Date().toISOString().slice(0, 16));
  const [reason, setReason] = useState<"DAMAGE" | "STAFF_USE">("DAMAGE");
  const [staffUserId, setStaffUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRemoval, setViewRemoval] = useState<RemovalDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RemovalRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (stockRemovalRefsStatus === "loaded" || stockRemovalRefsStatus === "loading") {
      return;
    }
    void dispatch(fetchStockRemovalRefsThunk());
  }, [dispatch, stockRemovalRefsStatus]);

  useEffect(() => {
    const menuItemId = searchParams.get("menuItemId");
    const stockItemId = searchParams.get("stockItemId");
    if (!menuItemId && !stockItemId) {
      return;
    }
    setOpen(true);
    setLines([
      {
        itemKey: menuItemId ? `MENU:${menuItemId}` : `INVENTORY:${stockItemId}`,
        quantity: "1",
      },
    ]);
  }, [searchParams]);

  useEffect(() => {
    setDraftFromDate(params.filters.fromDate ?? "");
    setDraftToDate(params.filters.toDate ?? "");
  }, [params.filters.fromDate, params.filters.toDate]);

  const applyDateFilter = () => {
    setFilters({ fromDate: draftFromDate, toDate: draftToDate });
  };

  const openCreate = () => {
    setEditId(null);
    setEntryAt(new Date().toISOString().slice(0, 16));
    setReason("DAMAGE");
    setStaffUserId("");
    setNotes("");
    setLines([emptyLine()]);
    setOpen(true);
  };

  const openEdit = async (id: string) => {
    setEditId(id);
    setOpen(true);
    try {
      const detail = await operationsApi.stockRemovals.getOne(id);
      const entry = detail.entryAt.slice(0, 16);
      setEntryAt(entry.length === 16 ? entry : new Date(detail.entryAt).toISOString().slice(0, 16));
      setReason(detail.reason as "DAMAGE" | "STAFF_USE");
      setStaffUserId(detail.staffUserId ?? "");
      setNotes(detail.notes ?? "");
      setLines(
        detail.lines.map((line) => ({
          itemKey:
            line.lineType === "MENU" && line.menuItemId
              ? `MENU:${line.menuItemId}`
              : line.stockItemId
                ? `INVENTORY:${line.stockItemId}`
                : "",
          quantity: line.quantity,
        })),
      );
      setViewOpen(false);
    } catch (error) {
      setOpen(false);
      setEditId(null);
      appToast.error(getApiErrorMessage(error, "Failed to load removal for editing"));
    }
  };

  const openView = async (id: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewRemoval(null);
    try {
      const detail = await operationsApi.stockRemovals.getOne(id);
      setViewRemoval({
        ...detail,
        createdAt: detail.createdAt ?? "",
        lineCount: detail.lineCount ?? detail.lines.length,
      });
    } catch (error) {
      setViewOpen(false);
      appToast.error(getApiErrorMessage(error, "Failed to load removal details"));
    } finally {
      setViewLoading(false);
    }
  };

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const removeLine = (index: number) => {
    setLines((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
  };

  const addLine = () => {
    setLines((current) => [...current, emptyLine()]);
  };

  const submit = async () => {
    if (reason === "STAFF_USE" && !staffUserId) {
      appToast.error("Select a staff member for staff use");
      return;
    }

    const parsedLines: Array<{
      menuItemId?: string;
      stockItemId?: string;
      quantity: number;
    }> = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const row = i + 1;
      if (!line.itemKey) {
        appToast.error(`Line ${row}: select an item`);
        return;
      }
      const qty = Number(line.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        appToast.error(`Line ${row}: enter a valid quantity`);
        return;
      }
      const [kind, id] = line.itemKey.split(":");
      if (kind === "MENU") {
        parsedLines.push({ menuItemId: id, quantity: qty });
      } else if (kind === "INVENTORY") {
        parsedLines.push({ stockItemId: id, quantity: qty });
      } else {
        appToast.error(`Line ${row}: invalid item`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        entryAt: new Date(entryAt).toISOString(),
        reason,
        staffUserId: reason === "STAFF_USE" ? staffUserId : undefined,
        notes: notes.trim() || undefined,
        lines: parsedLines,
      };
      if (editId) {
        await operationsApi.stockRemovals.update(editId, payload);
        appToast.success("Stock removal updated");
      } else {
        await operationsApi.stockRemovals.create(payload);
        appToast.success("Stock removal recorded");
      }
      setOpen(false);
      setEditId(null);
      await refetch();
      void dispatch(fetchStockRemovalRefsThunk({ force: true }));
    } catch (error) {
      appToast.error(getApiErrorMessage(error, editId ? "Failed to update removal" : "Failed to save removal"));
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
      await operationsApi.stockRemovals.remove(deleteTarget.id);
      appToast.success("Stock removal deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete stock removal"));
    } finally {
      setDeleting(false);
    }
  };

  const canCreate =
    lineOptions.menuItems.length > 0 || lineOptions.stockItems.length > 0;

  return (
    <>
      <PageHeader
        title="Stock removals"
        description="Record damage or staff use — reduces menu item stock. Staff use requires a staff name."
        action={
          <Button type="button" size="sm" onClick={openCreate} disabled={!canCreate}>
            New removal
          </Button>
        }
      />

      {!canCreate ? (
        <p className="text-sm text-muted">
          Add menu items with stock before recording removals.
        </p>
      ) : null}

      <FilterDrawerDesktop>
        <DateRangeFilter
          fromDate={draftFromDate}
          toDate={draftToDate}
          onFromDateChange={setDraftFromDate}
          onToDateChange={setDraftToDate}
          onApply={applyDateFilter}
          description="Filter by entry date and time."
        />
      </FilterDrawerDesktop>

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={removals.length}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        tableColumns={7}
        emptyTitle="No Stock Removals Found"
        emptyDescription="Record stock removals when items are lost or used by staff."
        emptyIcon={PackageMinus}
        emptyAction={{ label: "New removal", onClick: openCreate }}
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
        }
        mobileSort={
          <MobileSortSelect
            options={[
              { label: "Date (newest)", sortBy: "entryAt", sortOrder: "desc" },
              { label: "Date (oldest)", sortBy: "entryAt", sortOrder: "asc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {removals.map((r) => (
              <ListCard
                key={r.id}
                title={r.receiptNo}
                subtitle={formatDateTime(r.entryAt)}
                fields={[
                  { label: "Reason", value: reasonLabel(r.reason) },
                  ...(r.reason === "STAFF_USE" && r.staffName
                    ? [{ label: "Staff", value: r.staffName }]
                    : []),
                  { label: "Lines", value: String(r.lineCount) },
                  { label: "Notes", value: r.notes?.trim() || "—" },
                ]}
                actions={
                  <RowActions
                    showLabels
                    onView={() => void openView(r.id)}
                    onEdit={() => void openEdit(r.id)}
                    onDelete={() => setDeleteTarget(r)}
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
              { label: "Receipt", thClassName: tableCenterColumnClass },
              {
                label: "Entry date",
                headerContent: (
                  <SortableTableHeader
                    label="Entry date"
                    sortKey="entryAt"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              "Recorded",
              "Reason",
              { label: "Lines", thClassName: tableCenterColumnClass },
              "Notes",
              {
                label: "Actions",
                thClassName: tableActionsColumnClass,
              },
            ]}
            ariaLabel="Stock removals"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[56rem]"
          >
            {removals.map((r) => (
              <tr key={r.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className={cn("px-4 py-3.5 text-sm font-medium text-foreground whitespace-nowrap", tableCenterCellClass)}>
                  {r.receiptNo}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {formatDateTime(r.entryAt)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {r.createdAt ? formatDateTime(r.createdAt) : "—"}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted">
                  <span>{reasonLabel(r.reason)}</span>
                  {r.reason === "STAFF_USE" && r.staffName ? (
                    <span className="mt-0.5 block text-xs text-subtle">{r.staffName}</span>
                  ) : null}
                  {r.createdByName ? (
                    <span className="mt-0.5 block text-xs text-subtle">
                      Recorded by {r.createdByName}
                    </span>
                  ) : null}
                </td>
                <td className={cn("px-4 py-3.5 text-sm tabular-nums text-muted", tableCenterCellClass)}>
                  {r.lineCount}
                </td>
                <td className="max-w-[200px] px-4 py-3.5 text-sm text-muted">
                  {r.notes?.trim() ? (
                    <span className="line-clamp-2" title={r.notes}>
                      {r.notes}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <RowActions
                      showLabels
                      onView={() => void openView(r.id)}
                      onEdit={() => void openEdit(r.id)}
                      onDelete={() => setDeleteTarget(r)}
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
        title="Delete stock removal?"
        description="This action cannot be undone. Stock quantities will not be restored."
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Are you sure you want to delete removal{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.receiptNo}</span>?
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
        open={viewOpen}
        size="lg"
        title="Removal details"
        description={
          viewRemoval
            ? `${viewRemoval.receiptNo} · ${formatDateTime(viewRemoval.entryAt)}`
            : "Loading removal details…"
        }
        onClose={() => {
          if (!viewLoading) {
            setViewOpen(false);
            setViewRemoval(null);
          }
        }}
      >
        <div className="space-y-5">
          {viewLoading ? (
            <ViewModalSkeleton rows={2} />
          ) : viewRemoval ? (
            <div className="space-y-5">
              <div className="form-grid">
                <DetailInfoCard label="Reason">
                  <p className="font-medium">{reasonLabel(viewRemoval.reason)}</p>
                  {viewRemoval.staffName ? (
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">Staff: {viewRemoval.staffName}</p>
                  ) : null}
                </DetailInfoCard>
                <DetailInfoCard label="Recorded">
                  <p className="font-medium">
                    {viewRemoval.createdAt ? formatDateTime(viewRemoval.createdAt) : "—"}
                  </p>
                  {viewRemoval.createdByName ? (
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">by {viewRemoval.createdByName}</p>
                  ) : null}
                </DetailInfoCard>
              </div>

              {viewRemoval.notes?.trim() ? (
                <DetailInfoCard label="Notes" muted>
                  {viewRemoval.notes.trim()}
                </DetailInfoCard>
              ) : null}

              <DetailLineItemsSection
                subtitle={`${viewRemoval.lineCount} ${viewRemoval.lineCount === 1 ? "item" : "items"} removed`}
                headers={["Item", { label: "Quantity", thClassName: tableCenterColumnClass }]}
                ariaLabel="Removal line items"
                mobileLineItems={
                  <>
                    {viewRemoval.lines.map((line, idx) => (
                      <LineItemCard
                        key={line.id ?? idx}
                        title={line.itemName}
                        fields={[
                          {
                            label: "Type",
                            value: line.lineType === "INVENTORY" ? "Inventory" : "Menu",
                          },
                          { label: "Quantity", value: formatMoney(line.quantity) },
                        ]}
                      />
                    ))}
                  </>
                }
              >
                {viewRemoval.lines.map((line, idx) => (
                  <tr key={line.id ?? idx} className="border-t border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--color-foreground)]">
                      {line.itemName}
                      <span className="ml-2 text-xs font-normal text-muted">
                        ({line.lineType === "INVENTORY" ? "Inventory" : "Menu"})
                      </span>
                    </td>
                    <td className={cn("px-4 py-3 text-sm font-medium tabular-nums text-[var(--color-foreground)]", tableCenterCellClass)}>
                      {formatMoney(line.quantity)}
                    </td>
                  </tr>
                ))}
              </DetailLineItemsSection>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setViewOpen(false);
                setViewRemoval(null);
              }}
              disabled={viewLoading}
            >
              Close
            </Button>
            {viewRemoval ? (
              <Button type="button" onClick={() => void openEdit(viewRemoval.id)}>
                <span className="inline-flex items-center gap-1.5">
                  <Pencil size={16} aria-hidden />
                  Edit
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={open}
        size="xl"
        mobileVariant="fullscreen"
        title={editId ? "Edit stock removal" : "New stock removal"}
        description={
          editId
            ? "Update removal details and line items. Stock is adjusted automatically."
            : "Record stock removed from menu or inventory (damage, staff use)."
        }
        onClose={() => {
          if (!saving) {
            setOpen(false);
            setEditId(null);
          }
        }}
        footer={
          <FormFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setEditId(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void submit()} loading={saving} disabled={!canCreate}>
              {editId ? "Save changes" : "Record removal"}
            </Button>
          </FormFooter>
        }
      >
        <div className="form-body pb-2">
          <section className="form-fields">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Removal details
            </h3>
            <div className="form-grid">
              <Field id="entryAt" label="Date & time" required>
                <Input
                  type="datetime-local"
                  value={entryAt}
                  onChange={(e) => setEntryAt(e.target.value)}
                />
              </Field>
              <Field id="reason" label="Reason" required>
                <Select
                  searchable={false}
                  value={reason}
                  onChange={(e) => {
                    const next = e.target.value as "DAMAGE" | "STAFF_USE";
                    setReason(next);
                    if (next === "DAMAGE") {
                      setStaffUserId("");
                    }
                  }}
                >
                  <option value="DAMAGE">Damage</option>
                  <option value="STAFF_USE">Staff use</option>
                </Select>
              </Field>
            </div>
            {reason === "STAFF_USE" ? (
              <Field id="staff" label="Staff name" required hint="Who used the stock">
                <Select searchable value={staffUserId} onChange={(e) => setStaffUserId(e.target.value)}>
                  <option value="">Choose staff</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                      {s.staffId ? ` (${s.staffId})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field id="notes" label="Notes" hint="Optional — context for this removal">
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Broken during prep, staff meal"
                className={cn(
                  "w-full resize-y rounded-xl border bg-(--color-surface) px-3 py-2.5 text-sm text-foreground",
                  "placeholder:text-subtle outline-none transition-colors",
                  "border-input focus:border-primary",
                )}
              />
            </Field>
          </section>

          <section className="form-fields border-t border-(--color-border) pt-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Line items</h3>
                <p className="mt-1 text-sm text-muted">
                  Menu (tracked) or inventory items and quantities removed.
                </p>
              </div>
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                {lines.length} {lines.length === 1 ? "line" : "lines"}
              </span>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => (
                <article
                  key={idx}
                  className="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-sm)"
                >
                  <header className="flex items-center justify-between gap-3 border-b border-(--color-border) bg-surface-muted px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-sm font-semibold text-primary">
                      {idx + 1}
                    </span>
                    {lines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface) text-danger transition-colors hover:border-danger/30 hover:bg-danger/8"
                        aria-label={`Remove line ${idx + 1}`}
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    ) : null}
                  </header>
                  <div className="form-grid form-grid-compact p-4">
                    <Field id={`item-${idx}`} label="Item" required reserveErrorSpace={false}>
                      <Select
                        searchable
                        value={line.itemKey}
                        onChange={(e) => updateLine(idx, { itemKey: e.target.value })}
                        disabled={
                          lineOptions.menuItems.length === 0 &&
                          lineOptions.stockItems.length === 0
                        }
                      >
                        <option value="">Choose item</option>
                        {lineOptions.menuItems.map((s) => (
                          <option key={`MENU:${s.id}`} value={`MENU:${s.id}`}>
                            Menu · {s.name} (on hand: {formatMoney(s.quantityOnHand)})
                          </option>
                        ))}
                        {lineOptions.stockItems.map((s) => (
                          <option key={`INVENTORY:${s.id}`} value={`INVENTORY:${s.id}`}>
                            Inventory · {s.name} (on hand: {formatMoney(s.quantityOnHand)})
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field id={`qty-${idx}`} label="Quantity" required reserveErrorSpace={false}>
                      <NumberInput
                        min={0.0001}
                        placeholder="e.g. 2"
                        value={line.quantity}
                        onValueChange={(quantity) => updateLine(idx, { quantity })}
                      />
                    </Field>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex justify-start">
              <Button type="button" variant="secondary" size="sm" onClick={addLine} disabled={!canCreate}>
                Add line
              </Button>
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
}
