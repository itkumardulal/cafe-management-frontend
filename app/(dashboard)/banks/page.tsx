"use client";

import { Suspense, useState } from "react";
import { Landmark } from "lucide-react";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { RowActions } from "@/src/components/shared/row-actions";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NumberInput } from "@/src/components/ui/number-input";
import { Modal } from "@/src/components/ui/modal";
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
import { useUploadEntityId } from "@/src/hooks/use-upload-entity-id";
import { cn } from "@/src/lib/cn";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput } from "@/src/lib/money-input";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type BankAccountRow = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  qrImageUrl?: string | null;
  openingBalance: string;
  currentBalance: string;
  totalDeposits: string;
  totalWithdrawals: string;
  transactionCount: number;
  isActive: boolean;
};

type BanksMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  activeAccountCount?: number;
  totalCurrentBalance?: string;
};

const emptyForm = {
  bankName: "",
  accountNumber: "",
  accountHolderName: "",
  openingBalance: "",
  qrImageUrl: "",
  isActive: true,
};

export default function BanksPage() {
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
        <BanksContent />
      </Suspense>
    </section>
  );
}

function BanksContent() {
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
  } = usePaginatedList<BankAccountRow>({
    queryKey: "bank-accounts",
    fetchFn: (p) => operationsApi.bankAccounts.list(p) as Promise<{ items: BankAccountRow[]; meta: BanksMeta }>,
    defaultSort: { sortBy: "bankName", sortOrder: "asc" },
    errorMessage: "Failed to load bank accounts",
  });

  const extendedMeta = meta as BanksMeta;
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<BankAccountRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankAccountRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [qrUploading, setQrUploading] = useState(false);
  const {
    entityId: uploadEntityId,
    resetForCreate: resetUploadEntityId,
    setForEdit: setUploadEntityForEdit,
  } = useUploadEntityId();

  const openCreate = () => {
    setEdit(null);
    setForm(emptyForm);
    resetUploadEntityId();
    setQrUploading(false);
    setOpen(true);
  };

  const openEdit = (row: BankAccountRow) => {
    setEdit(row);
    setForm({
      bankName: row.bankName,
      accountNumber: row.accountNumber,
      accountHolderName: row.accountHolderName,
      openingBalance: row.openingBalance,
      qrImageUrl: row.qrImageUrl ?? "",
      isActive: row.isActive,
    });
    setUploadEntityForEdit(row.id);
    setQrUploading(false);
    setOpen(true);
  };

  const save = async () => {
    const bankName = form.bankName.trim();
    const accountNumber = form.accountNumber.trim();
    const accountHolderName = form.accountHolderName.trim();
    if (!bankName || !accountNumber || !accountHolderName) {
      appToast.error("Bank name, account number, and account holder are required");
      return;
    }

    const openingParsed = parseMoneyInput(form.openingBalance);
    if (openingParsed.invalid) {
      appToast.error("Enter a valid opening balance");
      return;
    }
    if (qrUploading) {
      appToast.error("Wait for QR image upload to finish");
      return;
    }

    setSaving(true);
    try {
      if (edit) {
        await operationsApi.bankAccounts.update(edit.id, {
          bankName,
          accountNumber,
          accountHolderName,
          qrImageUrl: form.qrImageUrl.trim() || undefined,
          ...(edit.transactionCount === 0 ? { openingBalance: openingParsed.amount } : {}),
          isActive: form.isActive,
        });
        appToast.success("Bank account updated");
      } else {
        await operationsApi.bankAccounts.create({
          bankName,
          accountNumber,
          accountHolderName,
          openingBalance: openingParsed.amount,
          qrImageUrl: form.qrImageUrl.trim() || undefined,
        });
        appToast.success("Bank account created");
      }
      setOpen(false);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save bank account"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await operationsApi.bankAccounts.remove(deleteTarget.id);
      appToast.success("Bank account deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete bank account"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Banks"
        description="Register bank accounts once. Record deposits and withdrawals in Bank Transactions — balances update automatically."
        action={
          <Button type="button" size="sm" onClick={openCreate}>
            Add bank account
          </Button>
        }
      />

      {!loading && items.length > 0 ? (
        <div className="form-grid">
          <ReportSummaryCard
            label="Total current balance"
            value={formatMoney(extendedMeta.totalCurrentBalance ?? "0")}
            hint="Across all active accounts"
            tone="info"
          />
          <ReportSummaryCard
            label="Active accounts"
            value={String(extendedMeta.activeAccountCount ?? 0)}
            hint="Go to Bank Transactions to record deposits and withdrawals"
          />
        </div>
      ) : null}

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
        tableColumns={7}
        emptyTitle="No Bank Accounts Found"
        emptyDescription="Add your cafe's bank accounts with opening balances."
        emptyIcon={Landmark}
        emptyAction={{ label: "Add bank account", onClick: openCreate }}
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
              { label: "Bank name (A–Z)", sortBy: "bankName", sortOrder: "asc" },
              { label: "Bank name (Z–A)", sortBy: "bankName", sortOrder: "desc" },
              { label: "Balance (high)", sortBy: "openingBalance", sortOrder: "desc" },
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
                title={row.bankName}
                fields={[
                  { label: "Account number", value: row.accountNumber },
                  { label: "Account holder", value: row.accountHolderName },
                  {
                    label: "QR",
                    value: row.qrImageUrl ? (
                      <img
                        src={row.qrImageUrl}
                        alt={`${row.bankName} payment QR`}
                        className="h-8 w-8 rounded border border-[var(--color-border)] object-cover"
                      />
                    ) : (
                      "—"
                    ),
                  },
                  { label: "Opening balance", value: formatMoney(row.openingBalance) },
                  { label: "Current balance", value: formatMoney(row.currentBalance) },
                  {
                    label: "Status",
                    value: (
                      <Badge size="sm" variant={row.isActive ? "success" : "default"}>
                        {row.isActive ? "Active" : "Inactive"}
                      </Badge>
                    ),
                  },
                ]}
                actions={
                  <RowActions showLabels onEdit={() => openEdit(row)} onDelete={() => setDeleteTarget(row)} />
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
                label: "Bank name",
                headerContent: (
                  <SortableTableHeader
                    label="Bank name"
                    sortKey="bankName"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              { label: "Account number", thClassName: tableCenterColumnClass },
              "Account holder",
              { label: "QR", thClassName: tableCenterColumnClass },
              { label: "Opening balance", thClassName: tableCenterColumnClass },
              { label: "Current balance", thClassName: tableCenterColumnClass },
              { label: "Status", thClassName: tableCenterColumnClass },
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Bank accounts"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[56rem]"
          >
            {items.map((row) => (
              <tr key={row.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 text-sm font-medium text-foreground">{row.bankName}</td>
                <td className={cn("px-4 py-3.5 text-sm text-muted font-mono", tableCenterCellClass)}>
                  {row.accountNumber}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted">{row.accountHolderName}</td>
                <td className={cn("px-4 py-3.5", tableCenterCellClass)}>
                  {row.qrImageUrl ? (
                    <img
                      src={row.qrImageUrl}
                      alt={`${row.bankName} payment QR`}
                      className="mx-auto h-8 w-8 rounded border border-[var(--color-border)] object-cover"
                    />
                  ) : (
                    <span className="text-sm text-muted">—</span>
                  )}
                </td>
                <td className={cn("px-4 py-3.5 text-sm tabular-nums text-muted", tableCenterCellClass)}>
                  {formatMoney(row.openingBalance)}
                </td>
                <td className={cn("px-4 py-3.5 text-sm font-medium tabular-nums text-foreground", tableCenterCellClass)}>
                  {formatMoney(row.currentBalance)}
                </td>
                <td className={cn("px-4 py-3.5", tableCenterCellClass)}>
                  <Badge size="sm" variant={row.isActive ? "success" : "default"}>
                    {row.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <RowActions showLabels onEdit={() => openEdit(row)} onDelete={() => setDeleteTarget(row)} />
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      </PaginatedListSection>

      <Modal
        open={deleteTarget !== null}
        title="Delete bank account?"
        description="This action cannot be undone."
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.bankName}</span>? Accounts with
            transactions cannot be deleted — deactivate them instead.
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
        title={edit ? "Edit bank account" : "New bank account"}
        description="Opening balance is the amount already in the account when you first add it to the system."
        onClose={() => setOpen(false)}
        footer={
          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} loading={saving} disabled={qrUploading}>
              Save
            </Button>
          </FormFooter>
        }
      >
        <div className="form-fields">
          <Field id="bankName" label="Bank name" required>
            <Input
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              placeholder="e.g. NIC Asia Bank"
            />
          </Field>
          <Field id="accountNumber" label="Account number" required>
            <Input
              value={form.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
              placeholder="e.g. 1234567890"
            />
          </Field>
          <Field id="accountHolderName" label="Account holder name" required>
            <Input
              value={form.accountHolderName}
              onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))}
              placeholder="e.g. Cafe Pvt. Ltd."
            />
          </Field>
          <Field
            id="openingBalance"
            label="Opening balance"
            hint={
              edit && edit.transactionCount > 0
                ? "Cannot change after transactions have been recorded"
                : "Balance when this account was first added"
            }
          >
            <NumberInput
              min={0}
              value={form.openingBalance}
              onValueChange={(openingBalance) => setForm((f) => ({ ...f, openingBalance }))}
              disabled={Boolean(edit && edit.transactionCount > 0)}
              placeholder="0.00"
            />
          </Field>
          <ImageUploadField
            id="bankQrImage"
            label="Payment QR image"
            hint="Optional QR image customers can scan for this account"
            value={form.qrImageUrl}
            onChange={(qrImageUrl) => setForm((f) => ({ ...f, qrImageUrl }))}
            assetType="module"
            module="bank-accounts"
            entityId={uploadEntityId}
            dropTitle="Drop payment QR image here"
            previewAlt="Bank payment QR preview"
            uploadedLabel="QR image uploaded"
            onUploadingChange={setQrUploading}
          />
          {edit ? (
            <Field id="isActive" label="Status" hint="Inactive accounts cannot receive new transactions">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="size-4 rounded border-[var(--color-border)]"
                />
                Active account
              </label>
            </Field>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
