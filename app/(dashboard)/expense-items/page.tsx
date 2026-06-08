"use client";



import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

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

  displayLabel: string;

  description?: string | null;

  monthlySheetCategory: string;

  createdAt: string;

  salaryStaffUserId?: string | null;

  salaryStaffName?: string | null;

};

type StaffOption = { id: string; fullName: string; staffId: string | null };



const emptyForm = {

  description: "",

  monthlySheetCategory: "NONE",

  salaryStaffUserId: "",

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

    defaultSort: { sortBy: "monthlySheetCategory", sortOrder: "asc" },

    errorMessage: "Failed to load expense items",

  });



  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);

  const [open, setOpen] = useState(false);

  const [edit, setEdit] = useState<Row | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(emptyForm);



  const categoryOptions = useMemo(() => MONTHLY_SHEET_CATEGORIES, []);



  useEffect(() => {

    void operationsApi.stockRemovals.staffOptions().then(setStaffOptions).catch(() => setStaffOptions([]));

  }, []);



  const openCreate = () => {

    setEdit(null);

    setForm(emptyForm);

    setOpen(true);

  };



  const openEditForm = (item: Row) => {

    setEdit(item);

    setForm({

      description: item.description ?? "",

      monthlySheetCategory: item.monthlySheetCategory,

      salaryStaffUserId: item.salaryStaffUserId ?? "",

    });

    setOpen(true);

  };



  const save = async () => {

    if (form.monthlySheetCategory === "STAFF_SALARY" && !form.salaryStaffUserId) {

      appToast.error("Select a staff member for salary category");

      return;

    }



    try {

      const payload = {

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

    (item: Pick<Row, "displayLabel" | "monthlySheetCategory" | "salaryStaffName">) => {

      if (item.displayLabel) return item.displayLabel;

      if (item.monthlySheetCategory === "STAFF_SALARY" && item.salaryStaffName) {

        return `${item.salaryStaffName} salary`;

      }

      return categoryOptions.find((c) => c.value === item.monthlySheetCategory)?.label ?? item.monthlySheetCategory;

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

        tableColumns={4}

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

              { label: "Category (A–Z)", sortBy: "monthlySheetCategory", sortOrder: "asc" },

              { label: "Category (Z–A)", sortBy: "monthlySheetCategory", sortOrder: "desc" },

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

                label: "Category",

                headerContent: (

                  <SortableTableHeader

                    label="Category"

                    sortKey="monthlySheetCategory"

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

                <td className={cn("px-4 py-3.5 text-sm text-muted whitespace-nowrap", tableCenterCellClass)}>

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

        description="Map an expense to a monthly sheet category."

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

            <Field id="cat" label="Monthly sheet category" required hint="Used for monthly reports">

              <Select

                value={form.monthlySheetCategory}

                onChange={(e) => {

                  const nextCategory = e.target.value;

                  setForm((current) => ({

                    ...current,

                    monthlySheetCategory: nextCategory,

                    salaryStaffUserId:

                      nextCategory === "STAFF_SALARY" ? current.salaryStaffUserId : "",

                  }));

                }}

              >

                {categoryOptions.map((c) => (

                  <option key={c.value} value={c.value}>

                    {c.label}

                  </option>

                ))}

              </Select>

            </Field>

            {form.monthlySheetCategory === "STAFF_SALARY" ? (

              <Field

                id="salaryStaffUserId"

                label="Staff name"

                required

                hint="Link this salary category to a staff member"

              >

                <Select

                  searchable

                  value={form.salaryStaffUserId}

                  onChange={(e) =>

                    setForm((current) => ({

                      ...current,

                      salaryStaffUserId: e.target.value,

                    }))

                  }

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

                placeholder="e.g. Monthly internet subscription"

              />

            </Field>

          </section>

        </div>

      </Modal>

    </>

  );

}


