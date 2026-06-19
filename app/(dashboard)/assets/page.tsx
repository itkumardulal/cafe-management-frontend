"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Armchair } from "lucide-react";
import { AssetStatusBadge } from "@/src/components/assets/asset-status-badge";
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
import {
  ASSET_STATUS_OPTIONS,
  ASSET_WARRANTY_EXPIRING_DAYS,
  type AssetRow,
  type AssetStatus,
  type AssetWarrantyFilter,
  formatWarrantyRemaining,
} from "@/src/lib/asset-types";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput } from "@/src/lib/money-input";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  fetchAssetCategoryOptionsThunk,
  invalidateAssetCategoryOptions,
  invalidateAssetOptions,
} from "@/src/store/slices/reference-data.slice";

const emptyForm = {
  assetCategoryId: "",
  assetName: "",
  purchaseDate: "",
  purchaseCost: "",
  warrantyExpiryDate: "",
  status: "ACTIVE" as AssetStatus,
  remarks: "",
};

export default function AssetsPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <CardListSkeleton />
            <TableSkeleton columns={8} className="hidden md:block" />
            <PaginationSkeleton />
          </div>
        }
      >
        <AssetsContent />
      </Suspense>
    </section>
  );
}

function AssetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.referenceData.assetCategoryOptions);

  const initialWarrantyExpiring = Boolean(searchParams.get("warrantyExpiringWithinDays"));
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [warrantyFilter, setWarrantyFilter] = useState<AssetWarrantyFilter>(() => {
    if (searchParams.get("warrantyExpiringWithinDays")) return "expiring";
    if (searchParams.get("hasWarranty") === "true") return "has";
    return "";
  });

  useEffect(() => {
    void dispatch(fetchAssetCategoryOptionsThunk({}));
  }, [dispatch]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
    if (searchParams.get("warrantyExpiringWithinDays")) {
      setWarrantyFilter("expiring");
    } else if (searchParams.get("hasWarranty") === "true") {
      setWarrantyFilter("has");
    }
  }, [searchParams]);

  const extraCacheKey = `${categoryFilter}\0${statusFilter}\0${warrantyFilter}`;

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
  } = usePaginatedList<AssetRow>({
    queryKey: "assets",
    fetchFn: (p) =>
      operationsApi.assets.list({
        ...p,
        assetCategoryId: categoryFilter || undefined,
        status: statusFilter || undefined,
        warrantyExpiringWithinDays:
          warrantyFilter === "expiring" ? ASSET_WARRANTY_EXPIRING_DAYS : undefined,
        hasWarranty: warrantyFilter === "has" ? true : undefined,
      }),
    defaultSort: initialWarrantyExpiring
      ? { sortBy: "warrantyExpiryDate", sortOrder: "asc" }
      : { sortBy: "assetCode", sortOrder: "asc" },
    extraCacheKey,
    errorMessage: "Failed to load assets",
  });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AssetRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const invalidateRefs = () => {
    dispatch(invalidateAssetCategoryOptions());
    dispatch(invalidateAssetOptions());
  };

  const openCreate = () => {
    setEdit(null);
    setForm({
      ...emptyForm,
      assetCategoryId: categories[0]?.id ?? "",
      purchaseDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const openEdit = (item: AssetRow) => {
    setEdit(item);
    setForm({
      assetCategoryId: item.assetCategoryId,
      assetName: item.assetName,
      purchaseDate: item.purchaseDate.slice(0, 10),
      purchaseCost: item.purchaseCost,
      warrantyExpiryDate: item.warrantyExpiryDate?.slice(0, 10) ?? "",
      status: item.status,
      remarks: item.remarks ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.assetCategoryId) {
      appToast.error("Category is required");
      return;
    }
    if (!form.assetName.trim()) {
      appToast.error("Asset name is required");
      return;
    }
    const cost = parseMoneyInput(form.purchaseCost);
    if (cost.invalid || cost.amount < 0) {
      appToast.error("Enter a valid purchase cost");
      return;
    }
    if (!form.purchaseDate) {
      appToast.error("Purchase date is required");
      return;
    }
    try {
      const payload = {
        assetCategoryId: form.assetCategoryId,
        assetName: form.assetName.trim(),
        purchaseDate: form.purchaseDate,
        purchaseCost: cost.amount,
        warrantyExpiryDate: form.warrantyExpiryDate || undefined,
        status: form.status,
        remarks: form.remarks.trim() || undefined,
      };
      if (edit) {
        await operationsApi.assets.update(edit.id, payload);
        appToast.success("Asset updated");
      } else {
        await operationsApi.assets.create(payload);
        appToast.success("Asset added");
      }
      setOpen(false);
      invalidateRefs();
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save asset"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await operationsApi.assets.remove(deleteTarget.id);
      appToast.success("Asset deleted");
      setDeleteTarget(null);
      invalidateRefs();
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete asset"));
    } finally {
      setDeleting(false);
    }
  };

  const handleWarrantyFilterChange = (value: AssetWarrantyFilter) => {
    setWarrantyFilter(value);
    if (value === "expiring") {
      setSort("warrantyExpiryDate", "asc");
    }
  };

  const filterControls = useMemo(
    () => (
      <>
        <FilterSelect
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-w-[10rem]"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-w-[10rem]"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ASSET_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={warrantyFilter}
          onChange={(e) => handleWarrantyFilterChange(e.target.value as AssetWarrantyFilter)}
          className="min-w-[11rem]"
          aria-label="Filter by warranty"
        >
          <option value="">All warranties</option>
          <option value="expiring">Expiring within {ASSET_WARRANTY_EXPIRING_DAYS} days</option>
          <option value="has">Has warranty</option>
        </FilterSelect>
      </>
    ),
    [categories, categoryFilter, statusFilter, warrantyFilter],
  );

  return (
    <>
      <PageHeader
        title="Assets"
        description="Long-term operational items — equipment, furniture, and fixtures (not inventory stock)."
        action={
          <Button type="button" size="sm" onClick={openCreate} disabled={categories.length === 0}>
            Add asset
          </Button>
        }
      />

      {categories.length === 0 ? (
        <p className="text-sm text-muted">
          Add an{" "}
          <Link href="/asset-categories" className="text-primary underline">
            asset category
          </Link>{" "}
          before registering assets.
        </p>
      ) : null}

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={items.length}
        hasActiveFilters={hasActiveFilters || Boolean(categoryFilter || statusFilter || warrantyFilter)}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder ?? "Search code or name…"}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        filters={filterControls}
        tableColumns={8}
        emptyTitle="No assets yet"
        emptyDescription="Register equipment and other long-term items used in your operations."
        emptyIcon={Armchair}
        emptyAction={{ label: "Add asset", onClick: openCreate }}
        onClearFilters={() => {
          clearFilters();
          setCategoryFilter("");
          setStatusFilter("");
          setWarrantyFilter("");
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
              { label: "Code (A–Z)", sortBy: "assetCode", sortOrder: "asc" },
              { label: "Name (A–Z)", sortBy: "assetName", sortOrder: "asc" },
              { label: "Warranty (soonest)", sortBy: "warrantyExpiryDate", sortOrder: "asc" },
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
                title={item.assetName}
                subtitle={`${item.assetCode} · ${item.categoryName ?? "—"}`}
                badge={<AssetStatusBadge status={item.status} />}
                fields={[
                  { label: "Cost", value: formatMoney(item.purchaseCost) },
                  {
                    label: "Warranty",
                    value: item.warrantyExpiryDate
                      ? `${formatDateOnly(item.warrantyExpiryDate)} · ${formatWarrantyRemaining(item.warrantyExpiryDate)}`
                      : "—",
                  },
                ]}
                actions={
                  <RowActions
                    showLabels
                    onView={() => router.push(`/assets/${item.id}`)}
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
                label: "Code",
                headerContent: (
                  <SortableTableHeader
                    label="Code"
                    sortKey="assetCode"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              {
                label: "Name",
                headerContent: (
                  <SortableTableHeader
                    label="Name"
                    sortKey="assetName"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              "Category",
              {
                label: "Purchased",
                headerContent: (
                  <SortableTableHeader
                    label="Purchased"
                    sortKey="purchaseDate"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              {
                label: "Cost",
                headerContent: (
                  <SortableTableHeader
                    label="Cost"
                    sortKey="purchaseCost"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              {
                label: "Warranty",
                headerContent: (
                  <SortableTableHeader
                    label="Warranty"
                    sortKey="warrantyExpiryDate"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              "Status",
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Assets"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
          >
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 font-mono text-sm">{item.assetCode}</td>
                <td className="px-4 py-3.5 text-sm font-medium">{item.assetName}</td>
                <td className="px-4 py-3.5 text-sm">{item.categoryName ?? "—"}</td>
                <td className="px-4 py-3.5 text-sm">{formatDateOnly(item.purchaseDate)}</td>
                <td className="px-4 py-3.5 text-sm tabular-nums">{formatMoney(item.purchaseCost)}</td>
                <td className="px-4 py-3.5 text-sm">
                  {item.warrantyExpiryDate ? (
                    <div>
                      <div>{formatDateOnly(item.warrantyExpiryDate)}</div>
                      <div className="text-xs text-muted">
                        {formatWarrantyRemaining(item.warrantyExpiryDate)}
                      </div>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <AssetStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <RowActions
                      showLabels
                      onView={() => router.push(`/assets/${item.id}`)}
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

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Edit asset" : "Add asset"}>
        <div className="space-y-4">
          {edit ? (
            <Field id="asset-code" label="Asset code">
              <Input value={edit.assetCode} disabled />
            </Field>
          ) : null}
          <Field id="asset-category" label="Category" required>
            <Select
              value={form.assetCategoryId}
              onChange={(e) => setForm({ ...form, assetCategoryId: e.target.value })}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="asset-name" label="Asset name" required>
            <Input
              value={form.assetName}
              onChange={(e) => setForm({ ...form, assetName: e.target.value })}
            />
          </Field>
          <Field id="asset-purchase-date" label="Purchase date" required>
            <DatePicker
              value={form.purchaseDate}
              onChange={(v) => setForm({ ...form, purchaseDate: v })}
            />
          </Field>
          <Field id="asset-purchase-cost" label="Purchase cost" required>
            <NumberInput
              value={form.purchaseCost}
              onValueChange={(purchaseCost) => setForm({ ...form, purchaseCost })}
            />
          </Field>
          <Field id="asset-warranty" label="Warranty expiry">
            <DatePicker
              value={form.warrantyExpiryDate}
              onChange={(v) => setForm({ ...form, warrantyExpiryDate: v })}
            />
          </Field>
          <Field id="asset-status" label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AssetStatus })}
            >
              {ASSET_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="asset-remarks" label="Remarks">
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
        title="Delete asset"
      >
        <p className="text-sm text-muted">
          Delete <strong>{deleteTarget?.assetName}</strong> ({deleteTarget?.assetCode})?
        </p>
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
