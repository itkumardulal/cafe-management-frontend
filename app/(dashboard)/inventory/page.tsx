"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Package, History } from "lucide-react";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { RowActions } from "@/src/components/shared/row-actions";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
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
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type Row = {
  id: string;
  itemKind: "MENU" | "INVENTORY";
  name: string;
  unit?: string | null;
  description?: string | null;
  categoryName?: string | null;
  openingStockDay1?: string | null;
  reorderLevel?: string | null;
  quantityOnHand: string;
  stockStatus: "ok" | "low" | "out";
};

function kindBadge(kind: Row["itemKind"]) {
  return kind === "MENU" ? (
    <Badge variant="default">Menu</Badge>
  ) : (
    <Badge variant="default">Inventory</Badge>
  );
}

function statusBadge(status: Row["stockStatus"]) {
  if (status === "out") return <Badge variant="danger">Out</Badge>;
  if (status === "low") return <Badge variant="warning">Low</Badge>;
  return <Badge variant="success">OK</Badge>;
}

function InventoryRowActions({
  item,
  onEdit,
  onStockIn,
  onDelete,
  layout = "card",
}: {
  item: Row;
  onEdit: () => void;
  onStockIn: () => void;
  onDelete: () => void;
  layout?: "card" | "table";
}) {
  const stockInButton = (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className={layout === "table" ? "shrink-0" : "w-full sm:w-auto"}
      onClick={onStockIn}
    >
      Stock in
    </Button>
  );

  const isMenuOnly = item.itemKind === "MENU";

  return (
    <div
      className={cn(
        "inline-flex flex-nowrap items-center gap-1.5",
        layout === "table"
          ? "justify-center"
          : "w-full flex-col sm:w-auto sm:flex-row sm:justify-end",
      )}
    >
      {stockInButton}
      {!isMenuOnly ? (
        <RowActions showLabels onEdit={onEdit} onDelete={onDelete} />
      ) : null}
    </div>
  );
}

export default function InventoryPage() {
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
        <InventoryContent />
      </Suspense>
    </section>
  );
}

function InventoryContent() {
  const [stockFilter, setStockFilter] = useState<"" | "low" | "out">("");

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
    setSort,
    params,
    refetch,
  } = usePaginatedList<Row>({
    queryKey: "stock-items",
    fetchFn: (p) =>
      operationsApi.stockItems.list({
        ...p,
        stockFilter: stockFilter || undefined,
      }),
    defaultSort: { sortBy: "name", sortOrder: "asc" },
    errorMessage: "Failed to load inventory",
    extraCacheKey: stockFilter || "all",
  });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stockInTarget, setStockInTarget] = useState<Row | null>(null);
  const [stockInQty, setStockInQty] = useState("");
  const [stockInNotes, setStockInNotes] = useState("");
  const [form, setForm] = useState({
    name: "",
    unit: "",
    description: "",
    openingQuantity: "",
    reorderLevel: "",
  });

  const openCreate = () => {
    setEdit(null);
    setForm({ name: "", unit: "", description: "", openingQuantity: "", reorderLevel: "" });
    setOpen(true);
  };

  const openEdit = (item: Row) => {
    setEdit(item);
    setForm({
      name: item.name,
      unit: item.unit ?? "",
      description: item.description ?? "",
      openingQuantity: "",
      reorderLevel: item.reorderLevel ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      appToast.error("Name is required");
      return;
    }
    try {
      if (edit) {
        await operationsApi.stockItems.update(edit.id, {
          name: form.name.trim(),
          unit: form.unit.trim() || undefined,
          description: form.description.trim() || undefined,
          reorderLevel:
            form.reorderLevel.trim() === "" ? null : Number(form.reorderLevel),
        });
        appToast.success("Stock item updated");
      } else {
        await operationsApi.stockItems.create({
          name: form.name.trim(),
          unit: form.unit.trim() || undefined,
          description: form.description.trim() || undefined,
          openingQuantity: form.openingQuantity.trim()
            ? Number(form.openingQuantity)
            : undefined,
          reorderLevel: form.reorderLevel.trim()
            ? Number(form.reorderLevel)
            : undefined,
        });
        appToast.success("Stock item added");
      }
      setOpen(false);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save stock item"));
    }
  };

  const confirmStockIn = async () => {
    if (!stockInTarget) return;
    const qty = Number(stockInQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      appToast.error("Enter a valid quantity");
      return;
    }
    try {
      if (stockInTarget.itemKind === "MENU") {
        await operationsApi.menuItems.stockAdjustment(stockInTarget.id, {
          quantity: qty,
          notes: stockInNotes.trim() || undefined,
        });
      } else {
        await operationsApi.stockItems.stockAdjustment(stockInTarget.id, {
          quantity: qty,
          notes: stockInNotes.trim() || undefined,
        });
      }
      appToast.success("Stock added");
      setStockInTarget(null);
      setStockInQty("");
      setStockInNotes("");
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to add stock"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await operationsApi.stockItems.remove(deleteTarget.id);
      appToast.success("Stock item deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Inventory SKUs and menu items with opening stock (from Menu items). Removals under Stock removals."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/inventory/movements" className="inline-flex shrink-0">
              <Button type="button" size="sm" variant="secondary" className="inline-flex items-center gap-1.5">
                <History size={14} aria-hidden />
                Movements
              </Button>
            </Link>
            <Button type="button" size="sm" onClick={openCreate}>
              Add item
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Select
          searchable={false}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as "" | "low" | "out")}
          className="w-auto min-w-[140px]"
        >
          <option value="">All items</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </Select>
      </div>
      <p className="text-xs text-muted">
        Alerts include inventory items and menu items only when stock tracking is enabled and opening stock is greater than 0.
      </p>

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={items.length}
        hasActiveFilters={hasActiveFilters || Boolean(stockFilter)}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        tableColumns={8}
        emptyTitle="No stock items"
        emptyDescription="Add inventory SKUs here, or menu items with opening stock on Menu items."
        emptyIcon={Package}
        emptyAction={{ label: "Add item", onClick: openCreate }}
        onClearFilters={() => {
          clearSearch();
          setStockFilter("");
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
              { label: "Stock (high–low)", sortBy: "quantityOnHand", sortOrder: "desc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
      >
        <ListCardStack>
          {items.map((item) => (
            <ListCard
              key={`${item.itemKind}-${item.id}`}
              title={item.name}
              subtitle={
                item.itemKind === "MENU"
                  ? `${item.categoryName ?? "Menu"} · ${item.unit ?? "—"}`
                  : (item.unit ?? "—")
              }
              fields={[
                { label: "Type", value: kindBadge(item.itemKind) },
                ...(item.itemKind === "MENU"
                  ? [{ label: "Current stock", value: item.quantityOnHand }]
                  : []),
                { label: "On hand", value: item.quantityOnHand },
                { label: "Reorder", value: item.reorderLevel ?? "—" },
                { label: "Status", value: statusBadge(item.stockStatus) },
              ]}
              actions={
                <InventoryRowActions
                  item={item}
                  layout="card"
                  onEdit={() => openEdit(item)}
                  onStockIn={() => {
                    setStockInTarget(item);
                    setStockInQty("");
                    setStockInNotes("");
                  }}
                  onDelete={() => setDeleteTarget(item)}
                />
              }
            />
          ))}
        </ListCardStack>

        <div className="hidden md:block">
          <ResponsiveTable
            headers={[
              "Name",
              { label: "Type", thClassName: tableCenterColumnClass },
              { label: "Current stock", thClassName: tableCenterColumnClass },
              { label: "On hand", thClassName: tableCenterColumnClass },
              { label: "Reorder", thClassName: tableCenterColumnClass },
              { label: "Status", thClassName: tableCenterColumnClass },
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Inventory items"
          >
            {items.map((item) => (
              <tr key={`${item.itemKind}-${item.id}`} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-4 align-middle">
                  <div className="font-medium">{item.name}</div>
                  {item.categoryName ? (
                    <div className="mt-0.5 text-xs text-muted">{item.categoryName}</div>
                  ) : null}
                </td>
                <td className={cn(tableCenterCellClass, "px-4 py-4 align-middle")}>
                  {kindBadge(item.itemKind)}
                </td>
                <td className={cn(tableCenterCellClass, "px-4 py-4 align-middle")}>
                  {item.itemKind === "MENU" ? item.quantityOnHand : "—"}
                </td>
                <td className={cn(tableCenterCellClass, "px-4 py-4 align-middle")}>
                  {item.quantityOnHand}
                </td>
                <td className={cn(tableCenterCellClass, "px-4 py-4 align-middle")}>
                  {item.reorderLevel ?? "—"}
                </td>
                <td className={cn(tableCenterCellClass, "px-4 py-4 align-middle")}>
                  {statusBadge(item.stockStatus)}
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className={tableActionsCellClass}>
                    <InventoryRowActions
                      item={item}
                      layout="table"
                      onEdit={() => openEdit(item)}
                      onStockIn={() => {
                        setStockInTarget(item);
                        setStockInQty("");
                        setStockInNotes("");
                      }}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </div>
      </PaginatedListSection>

      <Modal
        open={open}
        title={edit ? "Edit stock item" : "Add stock item"}
        onClose={() => setOpen(false)}
        footer={
          <FormFooter variant="modal">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()}>
              Save
            </Button>
          </FormFooter>
        }
      >
        <div className="form-fields">
          <Field id="name" label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field id="unit" label="Unit" hint="Optional">
            <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
          </Field>
          {!edit ? (
            <Field id="opening" label="Opening quantity" hint="Optional">
              <NumberInput
                min={0}
                value={form.openingQuantity}
                onValueChange={(openingQuantity) =>
                  setForm((f) => ({ ...f, openingQuantity }))
                }
              />
            </Field>
          ) : null}
          <Field id="reorder" label="Reorder level" hint="Optional — for low-stock alerts">
            <NumberInput
              min={0}
              decimals={0}
              value={form.reorderLevel}
              onValueChange={(reorderLevel) => setForm((f) => ({ ...f, reorderLevel }))}
            />
          </Field>
          <Field id="desc" label="Description" hint="Optional">
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={stockInTarget !== null}
        size="md"
        mobileVariant="sheet"
        title={`Stock in — ${stockInTarget?.name ?? ""}`}
        description="Add quantity received into stock."
        onClose={() => setStockInTarget(null)}
        footer={
          <FormFooter variant="modal">
            <Button type="button" variant="secondary" onClick={() => setStockInTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={() => void confirmStockIn()}>
              Add stock
            </Button>
          </FormFooter>
        }
      >
        <div className="space-y-4 pb-2">
          <Field id="qty" label="Quantity" required>
            <NumberInput
              min={0.0001}
              value={stockInQty}
              onValueChange={setStockInQty}
            />
          </Field>
          <Field id="notes" label="Notes" hint="Optional">
            <Input value={stockInNotes} onChange={(e) => setStockInNotes(e.target.value)} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Delete stock item"
        onClose={() => setDeleteTarget(null)}
        footer={
          <FormFooter variant="modal">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={() => void confirmDelete()} loading={deleting}>
              Delete
            </Button>
          </FormFooter>
        }
      >
        <p className="text-sm text-muted">
          Delete <strong>{deleteTarget?.name}</strong>? Only allowed when quantity is zero.
        </p>
      </Modal>
    </>
  );
}
