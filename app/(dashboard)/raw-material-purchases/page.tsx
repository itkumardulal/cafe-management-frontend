"use client";

import { AlertCircle, Printer, Receipt, Trash2 } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ThermalPrintHost } from "@/src/features/printing/components/thermal-print-host";
import { useThermalPrint } from "@/src/features/printing/hooks/use-thermal-print";
import { DateRangeFilter } from "@/src/components/shared/date-range-filter";
import { DetailInfoCard } from "@/src/components/shared/detail-info-card";
import { DetailLineItemsSection } from "@/src/components/shared/detail-line-items-section";
import { FilterDrawer, FilterDrawerDesktop } from "@/src/components/shared/filter-drawer";
import { LineItemCard } from "@/src/components/shared/line-item-card";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { RowActions } from "@/src/components/shared/row-actions";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { PurchasePaymentTypeSection } from "@/src/components/purchases/purchase-payment-type-section";
import { PaymentStatusBadge } from "@/src/components/purchases/ap-status-badges";
import { SortableTableHeader } from "@/src/components/ui/sortable-table-header";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { ViewModalSkeleton } from "@/src/components/skeletons/view-modal-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import {
  RawMaterialPurchaseReceipt,
  type RmPurchaseReceiptData,
} from "@/src/components/purchases/raw-material-purchase-receipt";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { DatePicker } from "@/src/components/ui/date-picker";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NumberInput } from "@/src/components/ui/number-input";
import { Modal } from "@/src/components/ui/modal";
import { ResponsiveTable, tableActionsCellClass, tableActionsColumnClass, tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";
import { Select } from "@/src/components/ui/select";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatDateTime, formatMoney } from "@/src/lib/format-display";
import type { ApBillSummary, CreatePaymentType, PurchasePaymentMethod } from "@/src/lib/ap-types";
import { parseMoneyInput } from "@/src/lib/money-input";
import Link from "next/link";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppSelector } from "@/src/store/hooks";

type Line = {
  rawMaterialItemId: string;
  supplierId: string;
  quantity: string;
  ratePerUnit: string;
};

const emptyLine = (): Line => ({
  rawMaterialItemId: "",
  supplierId: "",
  quantity: "1",
  ratePerUnit: "",
});

function lineTotal(quantity: string, ratePerUnit: string): number {
  const qty = Number(quantity);
  const rate = Number(ratePerUnit);
  if (Number.isNaN(qty) || Number.isNaN(rate)) {
    return 0;
  }
  return qty * rate;
}

type ViewPurchaseData = RmPurchaseReceiptData & {
  id: string;
};

type PurchaseRow = ApBillSummary;

export default function RawMaterialPurchasesPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <TableSkeleton columns={7} />
            <PaginationSkeleton />
          </div>
        }
      >
        <RawMaterialPurchasesContent />
      </Suspense>
    </section>
  );
}

function RawMaterialPurchasesContent() {
  const authUser = useAppSelector((state) => state.auth.user);
  const {
    items: purchases,
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
  } = usePaginatedList<PurchaseRow>({
    queryKey: "raw-material-purchases",
    fetchFn: (p) => operationsApi.rmPurchases.list(p),
    defaultSort: { sortBy: "purchaseDate", sortOrder: "desc" },
    filterKeys: ["fromDate", "toDate"],
    errorMessage: "Failed to load purchases",
  });

  const [materials, setMaterials] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [draftFromDate, setDraftFromDate] = useState(params.filters.fromDate ?? "");
  const [draftToDate, setDraftToDate] = useState(params.filters.toDate ?? "");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editSupplierId, setEditSupplierId] = useState("");
  const [saving, setSaving] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [paymentType, setPaymentType] = useState<CreatePaymentType>("FULLY_PAID");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [paidAmountStr, setPaidAmountStr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PurchasePaymentMethod>("CASH");
  const [payReference, setPayReference] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [bankScreenshotUrl, setBankScreenshotUrl] = useState("");
  const [bankScreenshotUploading, setBankScreenshotUploading] = useState(false);
  const [uploadEntityId, setUploadEntityId] = useState("");
  const [splitResultOpen, setSplitResultOpen] = useState(false);
  const [createdBills, setCreatedBills] = useState<
    { id: string; supplierId?: string | null; receiptNo: string; supplierName?: string | null }[]
  >([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<ViewPurchaseData | null>(null);
  const { printDocument, isPrinting, requestPrint, printLoaded } =
    useThermalPrint<RmPurchaseReceiptData>({
      onError: (error) =>
        appToast.error(getApiErrorMessage(error, "Failed to load receipt for printing")),
    });

  const grandTotal = useMemo(
    () => lines.reduce((sum, line) => sum + lineTotal(line.quantity, line.ratePerUnit), 0),
    [lines],
  );

  useEffect(() => {
    if (paymentMethod !== "BANK_TRANSFER") {
      setBankScreenshotUrl("");
    }
  }, [paymentMethod]);

  const loadRefs = useCallback(async () => {
    try {
      const [m, s] = await Promise.all([
        operationsApi.rawMaterials.list({ limit: 100 }),
        operationsApi.suppliers.list({ limit: 100 }),
      ]);
      setMaterials(
        m.items.map((i: { id: string; name: string }) => ({ id: i.id, name: i.name })),
      );
      setSuppliers(
        s.items.map((i: { id: string; name: string }) => ({ id: i.id, name: i.name })),
      );
    } catch {
      appToast.error("Failed to load materials or suppliers");
    }
  }, []);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

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

  const resetFormState = () => {
    setEditId(null);
    setEditSupplierId("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setSupplierInvoiceNo("");
    setLines([emptyLine()]);
    setPaymentType("FULLY_PAID");
    setPaidAmountStr("");
    setPaymentMethod("CASH");
    setPayReference("");
    setPayRemarks("");
    setBankScreenshotUrl("");
    setBankScreenshotUploading(false);
  };

  const openCreate = () => {
    resetFormState();
    setUploadEntityId(crypto.randomUUID());
    setOpen(true);
  };

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  };

  const removeLine = (index: number) => {
    setLines((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
  };

  const addLine = () => {
    setLines((current) => [
      ...current,
      editId && editSupplierId ? { ...emptyLine(), supplierId: editSupplierId } : emptyLine(),
    ]);
  };

  const submit = async () => {
    if (!purchaseDate) {
      appToast.error("Purchase date is required");
      return;
    }

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const row = i + 1;
      if (!line.rawMaterialItemId) {
        appToast.error(`Line ${row}: select a raw material`);
        return;
      }
      if (!line.supplierId) {
        appToast.error(`Line ${row}: select a supplier`);
        return;
      }
      const qty = Number(line.quantity);
      const rate = Number(line.ratePerUnit);
      if (Number.isNaN(qty) || qty <= 0) {
        appToast.error(`Line ${row}: enter a valid quantity`);
        return;
      }
      if (Number.isNaN(rate) || rate < 0) {
        appToast.error(`Line ${row}: enter a valid rate`);
        return;
      }
    }

    const roundedGrandTotal = Math.round(grandTotal * 100) / 100;

    if (!editId && paymentType === "PARTIALLY_PAID") {
      const paid = parseMoneyInput(paidAmountStr);
      if (paid.invalid || paid.amount <= 0 || paid.amount >= roundedGrandTotal) {
        appToast.error("Enter a valid partial payment amount");
        return;
      }
      if (paymentMethod === "BANK_TRANSFER" && !bankScreenshotUrl.trim()) {
        appToast.error("Bank transfer proof is required");
        return;
      }
    }

    setSaving(true);
    try {
      const mappedLines = lines.map((l) => ({
        rawMaterialItemId: l.rawMaterialItemId,
        supplierId: editId && editSupplierId ? editSupplierId : l.supplierId,
        quantity: Number(l.quantity),
        ratePerUnit: Number(l.ratePerUnit),
      }));

      if (editId) {
        await operationsApi.rmPurchases.update(editId, {
          purchaseDate,
          notes: notes.trim() || undefined,
          supplierInvoiceNo: supplierInvoiceNo.trim() || undefined,
          lines: mappedLines,
        });
        setOpen(false);
        resetFormState();
        appToast.success("Purchase updated");
        await refetch();
        return;
      }

      const result = await operationsApi.rmPurchases.create({
        purchaseDate,
        notes: notes.trim() || undefined,
        supplierInvoiceNo: supplierInvoiceNo.trim() || undefined,
        paymentType,
        ...(paymentType === "PARTIALLY_PAID"
          ? {
              initialPayment: {
                amount: parseMoneyInput(paidAmountStr).amount,
                paymentMethod,
                referenceNumber: payReference.trim() || undefined,
                remarks: payRemarks.trim() || undefined,
                proofAttachmentUrl:
                  paymentMethod === "BANK_TRANSFER" ? bankScreenshotUrl.trim() : undefined,
              },
            }
          : {}),
        lines: mappedLines,
      });
      setOpen(false);
      if (result.purchases.length > 1) {
        setCreatedBills(
          result.purchases.map((b: { id: string; supplierId?: string | null; receiptNo: string; supplierName?: string | null }) => ({
            id: b.id,
            supplierId: b.supplierId,
            receiptNo: b.receiptNo,
            supplierName: b.supplierName,
          })),
        );
        setSplitResultOpen(true);
      } else {
        appToast.success("Purchase recorded");
      }
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save purchase"));
    } finally {
      setSaving(false);
    }
  };

  const hasRefs = materials.length > 0 && suppliers.length > 0;

  const cafeNameFallback = authUser?.cafe?.cafeName;

  const fetchPurchaseDetail = useCallback(async (id: string) => {
    const detail = await operationsApi.rmPurchases.getOne(id);
    const lines = detail.lines ?? [];
    const grandTotal =
      detail.grandTotal ??
      String(
        lines.reduce(
          (sum: number, line: { lineTotal?: string | number | null }) =>
            sum + Number(line.lineTotal || 0),
          0,
        ),
      );
    return {
      id: detail.id,
      receiptNo: detail.receiptNo,
      purchaseDate: detail.purchaseDate,
      createdAt: detail.createdAt ?? "",
      notes: detail.notes,
      createdByName: detail.createdByName,
      lineCount: detail.lineCount ?? lines.length,
      billingType: detail.billingType ?? "PAID",
      paymentStatus: detail.paymentStatus,
      paidAmount: detail.paidAmount,
      remainingAmount: detail.remainingAmount,
      grandTotal,
      cashPaidAmount: detail.cashPaidAmount ?? "0",
      bankPaidAmount: detail.bankPaidAmount ?? "0",
      creditAmount: detail.creditAmount ?? "0",
      bankPaymentScreenshotUrl: detail.bankPaymentScreenshotUrl,
      cafe: detail.cafe,
      lines,
    } satisfies ViewPurchaseData;
  }, []);

  const openView = async (id: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewPurchase(null);
    try {
      setViewPurchase(await fetchPurchaseDetail(id));
    } catch (error) {
      setViewOpen(false);
      appToast.error(getApiErrorMessage(error, "Failed to load purchase"));
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = async (id: string) => {
    try {
      const detail = await operationsApi.rmPurchases.getOne(id);
      const supplierId = detail.supplierId ?? detail.lines[0]?.supplier.id ?? "";
      setEditId(id);
      setEditSupplierId(supplierId);
      setPurchaseDate(detail.purchaseDate.slice(0, 10));
      setNotes(detail.notes ?? "");
      setSupplierInvoiceNo(detail.supplierInvoiceNo ?? "");
      setLines(
        detail.lines.length > 0
          ? detail.lines.map((line) => ({
              rawMaterialItemId: line.rawMaterialItem.id,
              supplierId: line.supplier.id,
              quantity: String(line.quantity),
              ratePerUnit: String(line.ratePerUnit),
            }))
          : [{ ...emptyLine(), supplierId }],
      );
      setViewOpen(false);
      setViewPurchase(null);
      setOpen(true);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load purchase"));
    }
  };

  const handlePrint = (id: string) => {
    void requestPrint(() => fetchPurchaseDetail(id));
  };

  return (
    <>
      <PageHeader
        title="Raw material purchases"
        description="Purchase receipts for expenses. These records do not update inventory stock."
        action={
          <Button type="button" size="sm" onClick={openCreate}>
            New purchase
          </Button>
        }
      />

      {!hasRefs ? (
        <p className="text-sm text-muted">
          Add at least one raw material and one supplier before you can save a purchase.
        </p>
      ) : null}

      <FilterDrawerDesktop>
        <DateRangeFilter
          fromDate={draftFromDate}
          toDate={draftToDate}
          onFromDateChange={setDraftFromDate}
          onToDateChange={setDraftToDate}
          onApply={applyDateFilter}
          description="Filter by purchase date."
        />
      </FilterDrawerDesktop>

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={purchases.length}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        tableColumns={7}
        emptyTitle="No Purchases Found"
        emptyDescription="Record raw material purchases for the selected period, or clear filters."
        emptyIcon={Receipt}
        emptyAction={{ label: "New purchase", onClick: openCreate }}
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
              { label: "Purchase date (newest)", sortBy: "purchaseDate", sortOrder: "desc" },
              { label: "Purchase date (oldest)", sortBy: "purchaseDate", sortOrder: "asc" },
              { label: "Receipt (A–Z)", sortBy: "receiptNo", sortOrder: "asc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {purchases.map((p) => (
              <ListCard
                key={p.id}
                title={p.receiptNo}
                subtitle={formatDateOnly(p.purchaseDate)}
                badge={<PaymentStatusBadge status={p.paymentStatus} />}
                fields={[
                  { label: "Total", value: formatMoney(p.grandTotal) },
                  { label: "Lines", value: String(p.lineCount ?? 0) },
                ]}
                actions={
                  <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
                    <RowActions
                      showLabels
                      onView={() => void openView(p.id)}
                      onEdit={() => void openEdit(p.id)}
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={() => void handlePrint(p.id)}>
                      <span className="inline-flex items-center gap-1.5">
                        <Printer size={15} strokeWidth={1.75} aria-hidden />
                        Print
                      </span>
                    </Button>
                  </div>
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
                label: "Receipt",
                thClassName: tableCenterColumnClass,
                headerContent: (
                  <SortableTableHeader
                    label="Receipt"
                    sortKey="receiptNo"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                    align="center"
                  />
                ),
              },
              {
                label: "Purchase date",
                headerContent: (
                  <SortableTableHeader
                    label="Purchase date"
                    sortKey="purchaseDate"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              {
                label: "Recorded",
                headerContent: (
                  <SortableTableHeader
                    label="Recorded"
                    sortKey="createdAt"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              { label: "Lines", thClassName: tableCenterColumnClass },
              { label: "Grand total", thClassName: tableCenterColumnClass },
              { label: "Payment", thClassName: tableCenterColumnClass },
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Purchases"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[58rem]"
          >
            {purchases.map((p) => (
              <tr key={p.id} className="border-t border-(--color-border) last:border-b-0">
                <td className={cn("px-4 py-3.5 text-sm font-medium text-foreground whitespace-nowrap", tableCenterCellClass)}>
                  {p.receiptNo}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  {formatDateOnly(p.purchaseDate)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                  <span title={p.createdAt}>{formatDateTime(p.createdAt)}</span>
                </td>
                <td className={cn("px-4 py-3.5 text-sm tabular-nums text-muted", tableCenterCellClass)}>
                  {p.lineCount ?? 0}
                </td>
                <td className={cn("px-4 py-3.5 text-sm font-medium tabular-nums text-foreground", tableCenterCellClass)}>
                  {formatMoney(p.grandTotal)}
                </td>
                <td className={cn("px-4 py-3.5", tableCenterCellClass)}>
                  <PaymentStatusBadge status={p.paymentStatus} />
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <div className="inline-flex flex-nowrap items-center justify-center gap-1.5">
                      <RowActions
                        showLabels
                        onView={() => void openView(p.id)}
                        onEdit={() => void openEdit(p.id)}
                      />
                      <Button type="button" size="sm" variant="secondary" onClick={() => void handlePrint(p.id)}>
                        <span className="inline-flex items-center gap-1.5">
                          <Printer size={15} strokeWidth={1.75} aria-hidden />
                          Print
                        </span>
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      </PaginatedListSection>

      <Modal
        open={viewOpen}
        size="lg"
        title="Purchase details"
        description={
          viewPurchase
            ? `${viewPurchase.receiptNo} · ${formatDateOnly(viewPurchase.purchaseDate)}`
            : "Loading purchase details…"
        }
        onClose={() => {
          if (!viewLoading) {
            setViewOpen(false);
            setViewPurchase(null);
          }
        }}
      >
        <div className="space-y-5">
          {viewLoading ? (
            <ViewModalSkeleton rows={3} />
          ) : viewPurchase ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {"paymentStatus" in viewPurchase && viewPurchase.paymentStatus ? (
                  <PaymentStatusBadge status={viewPurchase.paymentStatus} />
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailInfoCard label="Purchase date">
                  <p className="font-medium">{formatDateOnly(viewPurchase.purchaseDate)}</p>
                </DetailInfoCard>
                <DetailInfoCard label="Recorded">
                  <p className="font-medium">{formatDateTime(viewPurchase.createdAt)}</p>
                  {viewPurchase.createdByName ? (
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      by {viewPurchase.createdByName}
                    </p>
                  ) : null}
                </DetailInfoCard>
              </div>

              {Number(viewPurchase.paidAmount ?? viewPurchase.cashPaidAmount) > 0 ||
              Number(viewPurchase.remainingAmount ?? viewPurchase.creditAmount) > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailInfoCard label="Payment">
                    <dl className="mt-2 space-y-1.5 text-sm">
                      {Number(viewPurchase.cashPaidAmount) > 0 ? (
                        <div className="flex justify-between gap-2 text-[var(--color-muted)]">
                          <dt>Cash paid</dt>
                          <dd className="font-mono tabular-nums">
                            {formatMoney(viewPurchase.cashPaidAmount ?? 0)}
                          </dd>
                        </div>
                      ) : null}
                      {Number(viewPurchase.bankPaidAmount) > 0 ? (
                        <div className="flex justify-between gap-2 text-[var(--color-muted)]">
                          <dt>Bank paid</dt>
                          <dd className="font-mono tabular-nums">
                            {formatMoney(viewPurchase.bankPaidAmount ?? 0)}
                          </dd>
                        </div>
                      ) : null}
                      {Number(viewPurchase.creditAmount) > 0.005 ? (
                        <div className="flex justify-between gap-2 font-medium text-[var(--color-foreground)]">
                          <dt>Credit due</dt>
                          <dd className="font-mono tabular-nums">
                            {formatMoney(viewPurchase.creditAmount ?? 0)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </DetailInfoCard>
                  {viewPurchase.bankPaymentScreenshotUrl ? (
                    <DetailInfoCard label="Bank transfer proof">
                      <a
                        href={viewPurchase.bankPaymentScreenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-lg border border-[var(--color-border)]"
                      >
                        <img
                          src={viewPurchase.bankPaymentScreenshotUrl}
                          loading="lazy"
                          alt="Bank transfer proof"
                          className="max-h-40 w-full object-contain bg-[var(--color-surface-muted)]"
                        />
                      </a>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">Click to open full size</p>
                    </DetailInfoCard>
                  ) : null}
                </div>
              ) : (
                <DetailInfoCard label="Payment" muted>
                  Payment not recorded for this purchase.
                </DetailInfoCard>
              )}

              {viewPurchase.notes?.trim() ? (
                <DetailInfoCard label="Notes" muted>
                  {viewPurchase.notes.trim()}
                </DetailInfoCard>
              ) : null}

              <DetailLineItemsSection
                subtitle={`${viewPurchase.lineCount} ${viewPurchase.lineCount === 1 ? "line" : "lines"}`}
                headerAside={
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Grand total
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--color-foreground)]">
                      {formatMoney(viewPurchase.grandTotal)}
                    </p>
                  </div>
                }
                headers={[
                  "Item",
                  "Supplier",
                  { label: "Qty", thClassName: tableCenterColumnClass },
                  { label: "Rate", thClassName: tableCenterColumnClass },
                  { label: "Total", thClassName: tableCenterColumnClass },
                ]}
                ariaLabel="Purchase line items"
                mobileLineItems={
                  <>
                    {viewPurchase.lines.map((line, idx) => (
                      <LineItemCard
                        key={idx}
                        title={line.rawMaterialItem.name}
                        fields={[
                          { label: "Supplier", value: line.supplier.name },
                          { label: "Qty", value: formatMoney(line.quantity) },
                          { label: "Rate", value: formatMoney(line.ratePerUnit) },
                          { label: "Total", value: formatMoney(line.lineTotal) },
                        ]}
                      />
                    ))}
                  </>
                }
              >
                {viewPurchase.lines.map((line, idx) => (
                  <tr key={idx} className="border-t border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--color-foreground)]">
                      <div className="min-w-0">
                        <p className="truncate">{line.rawMaterialItem.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                          Unit: {line.rawMaterialItem.unit}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-muted)]">{line.supplier.name}</td>
                    <td className={cn("px-4 py-3 text-sm tabular-nums text-[var(--color-muted)]", tableCenterCellClass)}>
                      {formatMoney(line.quantity)}
                    </td>
                    <td className={cn("px-4 py-3 text-sm tabular-nums text-[var(--color-muted)]", tableCenterCellClass)}>
                      {formatMoney(line.ratePerUnit)}
                    </td>
                    <td className={cn("px-4 py-3 text-sm font-medium tabular-nums text-[var(--color-foreground)]", tableCenterCellClass)}>
                      {formatMoney(line.lineTotal)}
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
                setViewPurchase(null);
              }}
              disabled={viewLoading}
            >
              Close
            </Button>
            {viewPurchase ? (
              <Button type="button" variant="secondary" onClick={() => void openEdit(viewPurchase.id)}>
                Edit
              </Button>
            ) : null}
            {viewPurchase ? (
              <Button
                type="button"
                disabled={isPrinting}
                onClick={() => printLoaded(viewPurchase)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Printer size={16} aria-hidden />
                  Print receipt
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      <ThermalPrintHost open={printDocument != null}>
        {printDocument ? (
          <RawMaterialPurchaseReceipt
            id="rm-purchase-receipt"
            purchase={printDocument}
            cafeName={cafeNameFallback}
          />
        ) : null}
      </ThermalPrintHost>

      <Modal
        open={open}
        size="xl"
        mobileVariant="fullscreen"
        title={editId ? "Edit purchase" : "New purchase"}
        description={
          editId
            ? "Update purchase date, line items, and notes. Payments are managed via bill settlement."
            : "Record a purchase receipt with one or more line items. Totals are calculated automatically."
        }
        onClose={() => {
          if (!saving) {
            setOpen(false);
            resetFormState();
          }
        }}
        footer={
          <FormFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpen(false);
                resetFormState();
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submit()}
              loading={saving}
              disabled={!hasRefs || saving || bankScreenshotUploading}
            >
              {editId ? "Save changes" : "Save purchase"}
            </Button>
          </FormFooter>
        }
      >
        <div className="space-y-6 pb-2">
          {!hasRefs ? (
            <div
              className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3.5"
              role="status"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-[var(--color-primary)]"
                aria-hidden
              />
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                Before saving, add at least one entry on{" "}
                <a
                  href="/raw-materials"
                  className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  Raw materials
                </a>{" "}
                and{" "}
                <a
                  href="/suppliers"
                  className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  Suppliers
                </a>
                .
              </p>
            </div>
          ) : null}

          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
                Purchase details
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Receipt date and optional notes for this purchase.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
              <Field id="date" label="Purchase date" required>
                <DatePicker
                  id="date"
                  value={purchaseDate}
                  onChange={setPurchaseDate}
                  placeholder="Pick purchase date"
                  aria-label="Purchase date"
                />
              </Field>
              <Field id="notes" label="Notes" hint="Optional — invoice ref, delivery note, etc.">
                <textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid in cash, delivery next week"
                  className={cn(
                    "w-full resize-y rounded-xl border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)]",
                    "placeholder:text-[var(--color-subtle)] outline-none transition-colors",
                    "border-[var(--color-input)] focus:border-[var(--color-primary)]",
                  )}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-[var(--color-border)] pt-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
                  Line items
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Each row is one material from a supplier with quantity and rate.
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
                {lines.length} {lines.length === 1 ? "line" : "lines"}
              </span>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => {
                const total = lineTotal(line.quantity, line.ratePerUnit);
                return (
                  <article
                    key={idx}
                    className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
                  >
                    <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/12 text-sm font-semibold text-[var(--color-primary)]"
                          aria-hidden
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--color-foreground)]">
                            Line item {idx + 1}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            Material, supplier, quantity & rate
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                            Line total
                          </p>
                          <p className="text-base font-semibold tabular-nums text-[var(--color-foreground)]">
                            {formatMoney(total)}
                          </p>
                        </div>
                        {lines.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-danger)] transition-colors hover:border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/8"
                            aria-label={`Remove line ${idx + 1}`}
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </header>

                    <div className="grid gap-4 p-4 sm:grid-cols-2">
                      <Field id={`material-${idx}`} label="Raw material" required>
                        <Select
                          searchable
                          value={line.rawMaterialItemId}
                          onChange={(e) =>
                            updateLine(idx, { rawMaterialItemId: e.target.value })
                          }
                          disabled={!hasRefs}
                        >
                          <option value="">Choose material</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field id={`supplier-${idx}`} label="Supplier" required>
                        {editId ? (
                          <Input
                            value={suppliers.find((s) => s.id === editSupplierId)?.name ?? "—"}
                            readOnly
                            disabled
                          />
                        ) : (
                          <Select
                            searchable
                            value={line.supplierId}
                            onChange={(e) => updateLine(idx, { supplierId: e.target.value })}
                            disabled={!hasRefs}
                          >
                            <option value="">Choose supplier</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                      <Field id={`qty-${idx}`} label="Quantity" required>
                        <NumberInput
                          min={0}
                          value={line.quantity}
                          onValueChange={(quantity) => updateLine(idx, { quantity })}
                          placeholder="e.g. 10"
                          disabled={!hasRefs}
                        />
                      </Field>
                      <Field id={`rate-${idx}`} label="Rate per unit" required>
                        <NumberInput
                          min={0}
                          value={line.ratePerUnit}
                          onValueChange={(ratePerUnit) => updateLine(idx, { ratePerUnit })}
                          placeholder="e.g. 120.00"
                          disabled={!hasRefs}
                        />
                      </Field>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
              <button
                type="button"
                onClick={addLine}
                disabled={!hasRefs}
                className={cn(
                  "flex w-full items-center justify-start border-b border-dashed border-[var(--color-border)] px-4 py-3.5 text-sm font-medium transition-colors",
                  hasRefs
                    ? "cursor-pointer text-[var(--color-primary)] hover:bg-[var(--color-cream-100)]"
                    : "cursor-not-allowed text-[var(--color-subtle)]",
                )}
              >
                Add another line item
              </button>
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--color-surface-muted)] px-4 py-4 sm:px-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                    Summary
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                    {lines.length} line {lines.length === 1 ? "item" : "items"} on this receipt
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                    Grand total
                  </p>
                  <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-[var(--color-foreground)]">
                    {formatMoney(grandTotal)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Field id="supplier-invoice" label="Supplier invoice no.">
            <Input
              value={supplierInvoiceNo}
              onChange={(e) => setSupplierInvoiceNo(e.target.value)}
              placeholder="Optional"
              disabled={!hasRefs || saving}
            />
          </Field>

          {!editId ? (
            <PurchasePaymentTypeSection
              grandTotal={Math.round(grandTotal * 100) / 100}
              paymentType={paymentType}
              onPaymentTypeChange={setPaymentType}
              paidAmountStr={paidAmountStr}
              onPaidAmountStrChange={setPaidAmountStr}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              referenceNumber={payReference}
              onReferenceNumberChange={setPayReference}
              remarks={payRemarks}
              onRemarksChange={setPayRemarks}
              disabled={!hasRefs || saving}
              bankProofSlot={
                paymentMethod === "BANK_TRANSFER" ? (
                  <ImageUploadField
                    id="rmPurchaseBankProof"
                    label="Bank transfer proof"
                    required
                    value={bankScreenshotUrl}
                    onChange={setBankScreenshotUrl}
                    assetType="module"
                    module="raw-material-purchases"
                    entityId={uploadEntityId}
                    dropTitle="Drop screenshot here"
                    recommendedSize="PNG or JPG, max 5MB"
                    previewAlt="Bank transfer proof preview"
                    uploadedLabel="Proof attached"
                    onUploadingChange={setBankScreenshotUploading}
                  />
                ) : null
              }
            />
          ) : null}
        </div>
      </Modal>

      <Modal
        open={splitResultOpen}
        title="Bill settlements created"
        description="This purchase was split into one bill per supplier."
        onClose={() => setSplitResultOpen(false)}
      >
        <ul className="space-y-2 text-sm">
          {createdBills.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {b.receiptNo}
                {b.supplierName ? ` — ${b.supplierName}` : ""}
              </span>
              <Link
                href={`/bill-settlement/${b.supplierId ?? b.id}`}
                className="text-primary text-sm font-medium"
              >
                View bill
              </Link>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
