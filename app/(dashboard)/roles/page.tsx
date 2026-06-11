"use client";

import { Suspense, useEffect, useState } from "react";
import { ShieldUser } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { RowActions } from "@/src/components/shared/row-actions";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { SortableTableHeader } from "@/src/components/ui/sortable-table-header";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import { PermissionChips } from "@/src/features/users/components/permission-chips";
import { PermissionsPicker } from "@/src/features/users/components/permissions-picker";
import { normalizePermissionCodes } from "@/src/features/users/lib/permissions.config";
import {
  staffRoleSchema,
  type StaffRoleSchemaType,
} from "@/src/features/users/schemas/staff.schema";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { cn } from "@/src/lib/cn";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchAssignableMenusThunk } from "@/src/store/slices/user.slice";

type StaffRoleRow = {
  id: string;
  name: string;
  description?: string | null;
  staffCount: number;
  menuAccess: Array<{ menu: { code: string; name: string } }>;
};

export default function StaffRolesPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense fallback={<TableSkeleton columns={4} />}>
        <StaffRolesContent />
      </Suspense>
    </section>
  );
}

function StaffRolesContent() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const { assignableMenus } = useAppSelector((state) => state.user);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRoleRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<StaffRoleSchemaType | null>(null);
  const [menusChanged, setMenusChanged] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffRoleRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StaffRoleSchemaType>({
    resolver: zodResolver(staffRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      accessMenuCodes: [],
    },
  });

  const accessMenuCodes = watch("accessMenuCodes") ?? [];

  useEffect(() => {
    if (authUser?.role === "CAFE_ADMIN") {
      void dispatch(fetchAssignableMenusThunk());
    }
  }, [authUser?.role, dispatch]);

  const {
    items: roles,
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
  } = usePaginatedList({
    queryKey: `staff-roles-${refreshKey}`,
    fetchFn: (p) => operationsApi.staffRoles.list(p) as Promise<
      import("@/src/hooks/use-paginated-list").PaginatedResult<StaffRoleRow>
    >,
    defaultSort: { sortBy: "name", sortOrder: "asc" },
    errorMessage: "Failed to load staff roles",
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setMenusChanged(false);
    reset({ name: "", description: "", accessMenuCodes: [] });
  };

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "", accessMenuCodes: [] });
    setMenusChanged(false);
    setModalOpen(true);
  };

  const openEdit = (role: StaffRoleRow) => {
    setEditing(role);
    const codes = role.menuAccess.map((a) => a.menu.code);
    reset({
      name: role.name,
      description: role.description ?? "",
      accessMenuCodes: normalizePermissionCodes(codes),
    });
    setMenusChanged(false);
    setModalOpen(true);
  };

  const submitRole = async (values: StaffRoleSchemaType) => {
    setSaving(true);
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      accessMenuCodes: normalizePermissionCodes(values.accessMenuCodes ?? []),
    };

    try {
      if (editing) {
        await operationsApi.staffRoles.update(editing.id, payload);
        appToast.success("Staff role updated");
      } else {
        await operationsApi.staffRoles.create(payload);
        appToast.success("Staff role created");
      }
      closeModal();
      setRefreshKey((n) => n + 1);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save staff role"));
    } finally {
      setSaving(false);
      setConfirmSaveOpen(false);
      setPendingValues(null);
    }
  };

  const onSubmit = (values: StaffRoleSchemaType) => {
    if (editing && menusChanged && editing.staffCount > 0) {
      setPendingValues(values);
      setConfirmSaveOpen(true);
      return;
    }
    void submitRole(values);
  };

  const requestDelete = async (role: StaffRoleRow) => {
    if (role.staffCount > 0) {
      try {
        const detail = await operationsApi.staffRoles.getById(role.id);
        const names = detail.assignedStaff.map((s) => s.fullName).join(", ");
        appToast.error(
          `Cannot delete: ${detail.staffCount} staff assigned (${names}). Reassign them in Users first.`,
        );
      } catch {
        appToast.error("Cannot delete role while staff are assigned");
      }
      return;
    }

    setDeleteTarget(role);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await operationsApi.staffRoles.remove(deleteTarget.id);
      appToast.success("Staff role deleted");
      setDeleteTarget(null);
      setRefreshKey((n) => n + 1);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to delete staff role"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Staff Roles"
        description="Define access templates for your team. Create roles here, then assign them when adding users."
        action={
          <Button type="button" size="sm" onClick={openCreate}>
            Add role
          </Button>
        }
      />

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={roles.length}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        tableColumns={4}
        emptyTitle="No staff roles yet"
        emptyDescription="Create your first staff role to assign access when adding team members."
        emptyIcon={ShieldUser}
        emptyAction={{ label: "Add role", onClick: openCreate }}
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
              { label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {roles.map((role) => (
              <ListCard
                key={role.id}
                title={role.name}
                subtitle={role.description ?? undefined}
                fields={[
                  {
                    label: "Permissions",
                    layout: "stack",
                    value: <PermissionChips menuAccess={role.menuAccess} />,
                  },
                  { label: "Staff assigned", value: String(role.staffCount) },
                ]}
                actions={
                  <RowActions
                    showLabels
                    onEdit={() => openEdit(role)}
                    onDelete={() => void requestDelete(role)}
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
                label: "Role name",
                headerContent: (
                  <SortableTableHeader
                    label="Role name"
                    sortKey="name"
                    currentSortBy={params.sortBy}
                    currentSortOrder={params.sortOrder}
                    onSort={toggleSort}
                  />
                ),
              },
              { label: "Permissions" },
              { label: "Staff", thClassName: tableCenterColumnClass },
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Staff roles"
            density="comfortable"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-full"
          >
            {roles.map((role) => (
              <tr key={role.id} className="border-t border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3.5 align-top">
                  <div>
                    <p className="font-medium">{role.name}</p>
                    {role.description ? (
                      <p className="text-xs text-muted">{role.description}</p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <PermissionChips menuAccess={role.menuAccess} />
                </td>
                <td className={cn("px-4 py-3.5", tableCenterCellClass)}>
                  <Badge size="sm" variant="default">
                    {role.staffCount}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <RowActions
                      showLabels
                      onEdit={() => openEdit(role)}
                      onDelete={() => void requestDelete(role)}
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
        title="Delete staff role?"
        description="Only roles with no assigned staff can be deleted."
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
        open={modalOpen}
        title={editing ? "Edit staff role" : "Add staff role"}
        description="Name the role and choose which sidebar areas staff with this role can access."
        onClose={closeModal}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field id="roleName" label="Role name" error={errors.name?.message} required>
            <Input
              {...register("name")}
              hasError={Boolean(errors.name)}
              placeholder="e.g. Morning cashier"
            />
          </Field>
          <Field id="roleDescription" label="Description" error={errors.description?.message}>
            <Input {...register("description")} placeholder="Optional" />
          </Field>
          <Field
            id="accessMenuCodes"
            label="App access"
            error={errors.accessMenuCodes?.message as string | undefined}
            required
          >
            <PermissionsPicker
              menus={assignableMenus}
              value={accessMenuCodes}
              description="Pick sidebar areas for this role. Dashboard is optional — not every staff member needs analytics access."
              onChange={(codes) => {
                setMenusChanged(true);
                setValue("accessMenuCodes", codes, { shouldDirty: true, shouldValidate: true });
              }}
            />
          </Field>
          <FormFooter>
            <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create role"}
            </Button>
          </FormFooter>
        </form>
      </Modal>

      <Modal
        open={confirmSaveOpen}
        title="Update role permissions?"
        description={
          editing
            ? `Updating this role will immediately change sidebar access for ${editing.staffCount} staff member${editing.staffCount === 1 ? "" : "s"}. Continue?`
            : undefined
        }
        onClose={() => {
          setConfirmSaveOpen(false);
          setPendingValues(null);
        }}
        size="md"
      >
        <FormFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setConfirmSaveOpen(false);
              setPendingValues(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={saving}
            onClick={() => pendingValues && void submitRole(pendingValues)}
          >
            Update role
          </Button>
        </FormFooter>
      </Modal>
    </>
  );
}
