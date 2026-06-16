"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useUploadEntityId } from "@/src/hooks/use-upload-entity-id";
import { ArrowLeftRight } from "lucide-react";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { DateRangeFilter } from "@/src/components/shared/date-range-filter";
import { DetailInfoCard } from "@/src/components/shared/detail-info-card";
import { FilterDrawer, FilterDrawerDesktop } from "@/src/components/shared/filter-drawer";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { RowActions } from "@/src/components/shared/row-actions";
import { ViewModalSkeleton } from "@/src/components/skeletons/view-modal-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { DatePicker } from "@/src/components/ui/date-picker";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NumberInput } from "@/src/components/ui/number-input";
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
import { ReportSummaryCard } from "@/src/features/reports/components/report-detail-shell";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { cn } from "@/src/lib/cn";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput } from "@/src/lib/money-input";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type TransactionRow = {
  id: string;
  bankAccountId: string;
  bankName: string;
  accountNumber: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: string;
  transactionDate: string;
  referenceNumber?: string | null;
  proofAttachmentUrl?: string | null;
  notes?: string | null;
  createdByName?: string | null;
};

type TransactionsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  totalDeposits?: string;
  totalWithdrawals?: string;
  netChange?: string;
};

type BankAccountOption = { id: string; label: string };

const emptyForm = {
  bankAccountId: "",
  type: "DEPOSIT" as "DEPOSIT" | "WITHDRAWAL",
  amount: "",
  transactionDate: new Date().toISOString().slice(0, 10),
  referenceNumber: "",
  proofAttachmentUrl: "",
  notes: "",
};

export default function BankTransactionsPage() {
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
        <BankTransactionsContent />
      </Suspense>
    </section>
  );
}

function BankTransactionsContent() {
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
  } = usePaginatedList<TransactionRow>({
    queryKey: "bank-transactions",
    fetchFn: (p) =>
      operationsApi.bankTransactions.list(p) as Promise<{ items: TransactionRow[]; meta: TransactionsMeta }>,
    defaultSort: { sortBy: "transactionDate", sortOrder: "desc" },
    filterKeys: ["fromDate", "toDate", "bankAccountId", "type"],
    errorMessage: "Failed to load bank transactions",
  });

  const extendedMeta = meta as TransactionsMeta;
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [filterBankAccounts, setFilterBankAccounts] = useState<BankAccountOption[]>([]);
  const [draftFromDate, setDraftFromDate] = useState(params.filters.fromDate ?? "");
  const [draftToDate, setDraftToDate] = useState(params.filters.toDate ?? "");
  const [draftBankAccountId, setDraftBankAccountId] = useState(params.filters.bankAccountId ?? "");
  const [draftType, setDraftType] = useState(params.filters.type ?? "");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<TransactionRow | null>(null);
  const [viewTarget, setViewTarget] = useState<TransactionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { entityId: uploadEntityId, resetForCreate: resetUploadEntityId, setForEdit: setUploadEntityForEdit } =
    useUploadEntityId();
  const [proofUploading, setProofUploading] = useState(false);

  const loadBankAccounts = useCallback(async () => {
    try {
      const data = await operationsApi.bankAccounts.list({ limit: 100 });
      setFilterBankAccounts(
        data.items.map((a) => ({
          id: a.id,
          label: `${a.bankName} · ${a.accountNumber}`,
        })),
      );
      setBankAccounts(
        data.items
          .filter((a) => a.isActive)
          .map((a) => ({
            id: a.id,
            label: `${a.bankName} · ${a.accountNumber}`,
          })),
      );
    } catch {
      setBankAccounts([]);
      setFilterBankAccounts([]);
    }
  }, []);

  useEffect(() => {
    void loadBankAccounts();
  }, [loadBankAccounts]);

  useEffect(() => {
    setDraftFromDate(params.filters.fromDate ?? "");
    setDraftToDate(params.filters.toDate ?? "");
    setDraftBankAccountId(params.filters.bankAccountId ?? "");
    setDraftType(params.filters.type ?? "");
  }, [params.filters.fromDate, params.filters.toDate, params.filters.bankAccountId, params.filters.type]);

  const applyFilters = () => {
    setFilters({
      fromDate: draftFromDate,
      toDate: draftToDate,
      bankAccountId: draftBankAccountId,
      type: draftType,
    });
  };

  const canAddTransaction = bankAccounts.length > 0;

  const openCreate = () => {
    setEdit(null);
    setForm({
      ...emptyForm,
      transactionDate: new Date().toISOString().slice(0, 10),
      bankAccountId: bankAccounts[0]?.id ?? "",
    });
    resetUploadEntityId();
    setProofUploading(false);
    setOpen(true);
  };

  const openEdit = (row: TransactionRow) => {
    setEdit(row);
    setForm({
      bankAccountId: row.bankAccountId,
      type: row.type,
      amount: row.amount,
      transactionDate: String(row.transactionDate).slice(0, 10),
      referenceNumber: row.referenceNumber ?? "",
      proofAttachmentUrl: row.proofAttachmentUrl ?? "",
      notes: row.notes ?? "",
    });
    setUploadEntityForEdit(row.id);
    setProofUploading(false);
    setOpen(true);
  };

  const save = async () => {
    if (!edit && !form.bankAccountId) {
      appToast.error("Select a bank account");
      return;
    }
    const amountParsed = parseMoneyInput(form.amount);
    if (amountParsed.invalid || amountParsed.amount <= 0) {
      appToast.error("Enter a valid amount greater than zero");
      return;
    }
    if (!form.transactionDate) {
      appToast.error("Transaction date is required");
      return;
    }
    if (proofUploading) {
      appToast.error("Wait for the voucher image to finish uploading");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: form.type,
        amount: amountParsed.amount,
        transactionDate: form.transactionDate,
        referenceNumber: form.referenceNumber.trim() || undefined,
        proofAttachmentUrl: form.proofAttachmentUrl.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (edit) {
        await operationsApi.bankTransactions.update(edit.id, payload);
        appToast.success("Transaction updated");
      } else {
        await operationsApi.bankTransactions.create({
          bankAccountId: form.bankAccountId,
          ...payload,
        });
        appToast.success("Transaction recorded");
      }
      setOpen(false);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save transaction"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await operationsApi.bankTransactions.remove(deleteTarget.id);
      appToast.success("Transaction deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete transaction"));
    } finally {
      setDeleting(false);
    }
  };

  const typeBadge = (type: TransactionRow["type"]) => (
    <Badge size="sm" variant={type === "DEPOSIT" ? "success" : "danger"}>
      {type === "DEPOSIT" ? "Deposit" : "Withdrawal"}
    </Badge>
  );

  return (
    <>
      <PageHeader
        title="Bank transactions"
        description="Record every deposit and withdrawal. Current balances are calculated from opening balance plus all movements."
        action={
          <Button type="button" size="sm" onClick={openCreate} disabled={!canAddTransaction}>
            Add transaction
          </Button>
        }
      />

      {!canAddTransaction ? (
        <p className="text-sm text-muted">
          <Link href="/banks" className="font-medium text-foreground underline underline-offset-2">
            Add an active bank account
          </Link>{" "}
          before recording transactions.
        </p>
      ) : null}

      {!loading ? (
        <div className="form-grid form-grid-cols-3">
          <ReportSummaryCard
            label="Total deposits"
            value={formatMoney(extendedMeta.totalDeposits ?? "0")}
            tone="info"
          />
          <ReportSummaryCard
            label="Total withdrawals"
            value={formatMoney(extendedMeta.totalWithdrawals ?? "0")}
            tone="warning"
          />
          <ReportSummaryCard
            label="Net change"
            value={formatMoney(extendedMeta.netChange ?? "0")}
            tone="neutral"
          />
        </div>
      ) : null}

      <FilterDrawerDesktop>
        <div className="flex flex-wrap items-end gap-3">
          <DateRangeFilter
            fromDate={draftFromDate}
            toDate={draftToDate}
            onFromDateChange={setDraftFromDate}
            onToDateChange={setDraftToDate}
            onApply={applyFilters}
            description="Filter by transaction date."
          />
          <Field id="filterAccount" label="Bank account" className="min-w-[200px]">
            <Select value={draftBankAccountId} onChange={(e) => setDraftBankAccountId(e.target.value)}>
              <option value="">All accounts</option>
              {filterBankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="filterType" label="Type" className="min-w-[140px]">
            <Select value={draftType} onChange={(e) => setDraftType(e.target.value)}>
              <option value="">All types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
            </Select>
          </Field>
          <Button type="button" size="sm" variant="secondary" onClick={applyFilters}>
            Apply filters
          </Button>
        </div>
      </FilterDrawerDesktop>

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
        tableColumns={8}
        emptyTitle="No Bank Transactions Found"
        emptyDescription="Record deposits and withdrawals for the selected period, or clear filters."
        emptyIcon={ArrowLeftRight}
        emptyAction={{ label: "Add transaction", onClick: openCreate }}
        onClearFilters={() => {
          clearSearch();
          setDraftFromDate("");
          setDraftToDate("");
          setDraftBankAccountId("");
          setDraftType("");
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
            hasActiveFilters={Boolean(
              params.filters.fromDate ||
                params.filters.toDate ||
                params.filters.bankAccountId ||
                params.filters.type,
            )}
            onApply={applyFilters}
            onReset={() => {
              setDraftFromDate("");
              setDraftToDate("");
              setDraftBankAccountId("");
              setDraftType("");
              clearFilters();
            }}
          >
            <div className="space-y-4">
              <DateRangeFilter
                compact
                fromDate={draftFromDate}
                toDate={draftToDate}
                onFromDateChange={setDraftFromDate}
                onToDateChange={setDraftToDate}
                onApply={applyFilters}
              />
              <Field id="filterAccountMobile" label="Bank account">
                <Select value={draftBankAccountId} onChange={(e) => setDraftBankAccountId(e.target.value)}>
                  <option value="">All accounts</option>
                  {filterBankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="filterTypeMobile" label="Type">
                <Select value={draftType} onChange={(e) => setDraftType(e.target.value)}>
                  <option value="">All types</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                </Select>
              </Field>
            </div>
          </FilterDrawer>
        }
        mobileSort={
          <MobileSortSelect
            options={[
              { label: "Date (newest)", sortBy: "transactionDate", sortOrder: "desc" },
              { label: "Date (oldest)", sortBy: "transactionDate", sortOrder: "asc" },
              { label: "Amount (high)", sortBy: "amount", sortOrder: "desc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {items.map((row) => (
              <ListCard
                key={row.id}
                title={`${row.bankName} · ${row.accountNumber}`}
                fields={[
                  { label: "Date", value: formatDateOnly(row.transactionDate) },
                  { label: "Type", value: typeBadge(row.type) },
                  { label: "Amount", value: formatMoney(row.amount) },
                  { label: "Reference", value: row.referenceNumber?.trim() || "—" },
                  {
                    label: "Voucher",
                    value: row.proofAttachmentUrl ? (
                      <a
                        href={row.proofAttachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-foreground underline underline-offset-2"
                      >
                        View image
                      </a>
                    ) : (
                      "—"
                    ),
                  },
                  { label: "Notes", value: row.notes?.trim() || "—" },
                  { label: "Recorded by", value: row.createdByName ?? "—" },
                ]}
                actions={
                  <RowActions
                    showLabels
                    onView={() => setViewTarget(row)}
                    onEdit={() => openEdit(row)}
                    onDelete={() => setDeleteTarget(row)}
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
                    sortKey="transactionDate"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              "Bank account",
              { label: "Type", thClassName: tableCenterColumnClass },
              {
                label: "Amount",
                headerContent: (
                  <SortableTableHeader
                    label="Amount"
                    sortKey="amount"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
                thClassName: tableCenterColumnClass,
              },
              "Reference",
              "Voucher",
              "Notes",
              "Recorded by",
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Bank transactions"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[64rem]"
          >
            {items.map((row) => (
              <tr key={row.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm whitespace-nowrap text-muted">
                  {formatDateOnly(row.transactionDate)}
                </td>
                <td className="px-4 py-3.5 text-sm text-foreground">
                  <div className="font-medium">{row.bankName}</div>
                  <div className="text-xs text-muted font-mono">{row.accountNumber}</div>
                </td>
                <td className={cn("px-4 py-3.5", tableCenterCellClass)}>{typeBadge(row.type)}</td>
                <td className={cn("px-4 py-3.5 text-sm font-medium tabular-nums text-foreground", tableCenterCellClass)}>
                  {formatMoney(row.amount)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted">{row.referenceNumber?.trim() || "—"}</td>
                <td className="px-4 py-3.5 text-sm">
                  {row.proofAttachmentUrl ? (
                    <a
                      href={row.proofAttachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-foreground underline underline-offset-2"
                    >
                      <img
                        src={row.proofAttachmentUrl}
                        alt="Bank voucher"
                        className="h-8 w-8 rounded object-cover"
                      />
                      View
                    </a>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="max-w-[200px] px-4 py-3.5 text-sm text-muted">
                  {row.notes ? (
                    <span className="line-clamp-2" title={row.notes}>
                      {row.notes}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted">{row.createdByName ?? "—"}</td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <RowActions
                      showLabels
                      onView={() => setViewTarget(row)}
                      onEdit={() => openEdit(row)}
                      onDelete={() => setDeleteTarget(row)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      </PaginatedListSection>

      <Modal
        open={viewTarget !== null}
        size="lg"
        title="Transaction details"
        description={
          viewTarget
            ? `${viewTarget.bankName} · ${formatDateOnly(viewTarget.transactionDate)}`
            : undefined
        }
        onClose={() => setViewTarget(null)}
      >
        {viewTarget ? (
          <div className="space-y-5">
            <div className="form-grid">
              <DetailInfoCard label="Bank account">
                <p className="font-medium">{viewTarget.bankName}</p>
                <p className="mt-0.5 font-mono text-xs text-muted">{viewTarget.accountNumber}</p>
              </DetailInfoCard>
              <DetailInfoCard label="Date">
                <p className="font-medium">{formatDateOnly(viewTarget.transactionDate)}</p>
              </DetailInfoCard>
              <DetailInfoCard label="Type">{typeBadge(viewTarget.type)}</DetailInfoCard>
              <DetailInfoCard label="Amount">
                <p className="font-medium tabular-nums">{formatMoney(viewTarget.amount)}</p>
              </DetailInfoCard>
              <DetailInfoCard label="Reference">
                <p className="font-medium">{viewTarget.referenceNumber?.trim() || "—"}</p>
              </DetailInfoCard>
              <DetailInfoCard label="Recorded by">
                <p className="font-medium">{viewTarget.createdByName ?? "—"}</p>
              </DetailInfoCard>
            </div>
            {viewTarget.proofAttachmentUrl ? (
              <DetailInfoCard label="Voucher / proof">
                <a
                  href={viewTarget.proofAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-[var(--color-border)]"
                >
                  <img
                    src={viewTarget.proofAttachmentUrl}
                    alt="Transaction voucher"
                    className="max-h-48 w-full object-contain bg-[var(--color-surface-muted)]"
                  />
                </a>
              </DetailInfoCard>
            ) : null}
            {viewTarget.notes?.trim() ? (
              <DetailInfoCard label="Notes" muted>
                {viewTarget.notes.trim()}
              </DetailInfoCard>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setViewTarget(null)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  openEdit(viewTarget);
                  setViewTarget(null);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <ViewModalSkeleton rows={3} />
        )}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Delete transaction?"
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Delete this {deleteTarget?.type === "DEPOSIT" ? "deposit" : "withdrawal"} of{" "}
            {formatMoney(deleteTarget?.amount)}? The account balance will be recalculated.
          </p>
          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={() => void confirmDelete()} loading={deleting}>
              Delete
            </Button>
          </FormFooter>
        </div>
      </Modal>

      <Modal
        open={open}
        size="lg"
        mobileVariant="fullscreen"
        title={edit ? "Edit transaction" : "New transaction"}
        onClose={() => setOpen(false)}
        footer={
          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} loading={saving} disabled={proofUploading}>
              {edit ? "Save changes" : "Record transaction"}
            </Button>
          </FormFooter>
        }
      >
        <div className="form-fields">
          {edit ? (
            <Field id="bankAccountReadonly" label="Bank account">
              <Input value={`${edit.bankName} · ${edit.accountNumber}`} disabled />
            </Field>
          ) : (
            <Field id="bankAccountId" label="Bank account" required>
              <Select
                searchable
                value={form.bankAccountId}
                onChange={(e) => setForm((f) => ({ ...f, bankAccountId: e.target.value }))}
              >
                <option value="">Choose account</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field id="type" label="Type" required>
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "DEPOSIT" | "WITHDRAWAL" }))}>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
            </Select>
          </Field>
          <div className="form-grid">
            <Field id="amount" label="Amount" required>
              <NumberInput
                min={0.01}
                value={form.amount}
                onValueChange={(amount) => setForm((f) => ({ ...f, amount }))}
                placeholder="0.00"
              />
            </Field>
            <Field id="transactionDate" label="Date" required>
              <DatePicker
                value={form.transactionDate}
                onChange={(v) => setForm((f) => ({ ...f, transactionDate: v }))}
              />
            </Field>
          </div>
          <Field id="referenceNumber" label="Reference (optional)" hint="UTR, cheque number, etc.">
            <Input
              value={form.referenceNumber}
              onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
              placeholder="Optional reference"
            />
          </Field>
          <ImageUploadField
            id="bankTransactionProof"
            label="Bank voucher / screenshot"
            hint="Optional photo of deposit slip, transfer screenshot, or bank receipt"
            value={form.proofAttachmentUrl}
            onChange={(url) => setForm((f) => ({ ...f, proofAttachmentUrl: url }))}
            assetType="module"
            module="bank-transactions"
            entityId={uploadEntityId}
            dropTitle="Drop voucher or screenshot here"
            previewAlt="Bank voucher preview"
            uploadedLabel="Voucher attached"
            onUploadingChange={setProofUploading}
          />
          <Field id="notes" label="Reason / notes">
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Reason for this deposit/withdrawal"
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
