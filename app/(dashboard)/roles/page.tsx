"use client";

import { Suspense, useEffect, useState } from "react";
import { KeyRound, ShieldUser, SquarePen, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
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
  type StaffRoleSchemaInput,
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
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState<StaffRoleRow | null>(null);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingPermissionCodes, setPendingPermissionCodes] = useState<string[] | null>(null);
  const [menusChanged, setMenusChanged] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffRoleRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffRoleSchemaInput, unknown, StaffRoleSchemaType>({
    resolver: zodResolver(staffRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      accessMenuCodes: [],
    },
  });

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
    reset({
      name: role.name,
      description: role.description ?? "",
      accessMenuCodes: [],
    });
    setModalOpen(true);
  };

  const submitRole = async (values: StaffRoleSchemaType) => {
    setSaving(true);
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
    };

    try {
      if (editing) {
        await operationsApi.staffRoles.update(editing.id, payload);
        appToast.success("Staff role updated");
      } else {
        await operationsApi.staffRoles.create({
          ...payload,
          accessMenuCodes: values.accessMenuCodes,
        });
        appToast.success("Staff role created");
      }
      closeModal();
      setRefreshKey((n) => n + 1);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save staff role"));
    } finally {
      setSaving(false);
      setConfirmSaveOpen(false);
      setPendingPermissionCodes(null);
    }
  };

  const onSubmit = (values: StaffRoleSchemaType) => {
    void submitRole(values);
  };

  const openPermissions = (role: StaffRoleRow) => {
    setPermissionsRole(role);
    setPermissionCodes(normalizePermissionCodes(role.menuAccess.map((a) => a.menu.code)));
    setMenusChanged(false);
    setPermissionsOpen(true);
  };

  const closePermissions = () => {
    setPermissionsOpen(false);
    setPermissionsRole(null);
    setPermissionCodes([]);
    setMenusChanged(false);
  };

  const submitPermissions = async (codes: string[]) => {
    if (!permissionsRole) {
      return;
    }
    setSavingPermissions(true);
    try {
      await operationsApi.staffRoles.update(permissionsRole.id, {
        accessMenuCodes: normalizePermissionCodes(codes),
      });
      appToast.success("Role permissions updated");
      closePermissions();
      setRefreshKey((n) => n + 1);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to update role permissions"));
    } finally {
      setSavingPermissions(false);
      setConfirmSaveOpen(false);
      setPendingPermissionCodes(null);
    }
  };

  const onSavePermissions = () => {
    if (!permissionsRole) {
      return;
    }
    if (permissionsRole.staffCount > 0 && menusChanged) {
      setPendingPermissionCodes(permissionCodes);
      setConfirmSaveOpen(true);
      return;
    }
    void submitPermissions(permissionCodes);
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
        title="User Roles"
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
        tableColumns={5}
        emptyTitle="No staff roles yet"
        emptyDescription="Create your first staff role, then set permissions from the Permissions action."
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
                  {
                    label: "Permission settings",
                    value: (
                      <Button type="button" size="sm" variant="secondary" onClick={() => openPermissions(role)}>
                        <span className="inline-flex items-center gap-1.5">
                          <KeyRound size={15} strokeWidth={1.75} aria-hidden />
                          Manage permissions
                        </span>
                      </Button>
                    ),
                  },
                  { label: "Staff assigned", value: String(role.staffCount) },
                ]}
                actions={
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(role)}>
                      <span className="inline-flex items-center gap-1.5">
                        <SquarePen size={15} strokeWidth={1.75} aria-hidden />
                        Edit
                      </span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:border-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                      onClick={() => void requestDelete(role)}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                        Delete
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
              { label: "Permission settings", thClassName: tableCenterColumnClass },
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
                  <Button type="button" size="sm" variant="secondary" onClick={() => openPermissions(role)}>
                    <span className="inline-flex items-center gap-1.5">
                      <KeyRound size={15} strokeWidth={1.75} aria-hidden />
                      Manage permissions
                    </span>
                  </Button>
                </td>
                <td className={cn("px-4 py-3.5", tableCenterCellClass)}>
                  <Badge size="sm" variant="default">
                    {role.staffCount}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <div className={tableActionsCellClass}>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(role)}>
                        <span className="inline-flex items-center gap-1.5">
                          <SquarePen size={15} strokeWidth={1.75} aria-hidden />
                          Edit
                        </span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:border-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                        onClick={() => void requestDelete(role)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                          Delete
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
        description={
          editing
            ? "Update role details. Use Permissions to manage menu access."
            : "Create a role with name and description. Configure menu access from Permissions after creation."
        }
        onClose={closeModal}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="form-fields">
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
        open={permissionsOpen}
        title={permissionsRole ? `Permissions · ${permissionsRole.name}` : "Role permissions"}
        description="Select which sidebar menus this role can access."
        onClose={closePermissions}
        size="lg"
      >
        <div className="form-fields">
          <PermissionsPicker
            menus={assignableMenus}
            value={permissionCodes}
            description="Assign access by menu group. New roles start with no access until configured."
            onChange={(codes) => {
              setMenusChanged(true);
              setPermissionCodes(codes);
            }}
          />
          <FormFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={closePermissions}
              disabled={savingPermissions}
            >
              Cancel
            </Button>
            <Button type="button" loading={savingPermissions} onClick={onSavePermissions}>
              Save permissions
            </Button>
          </FormFooter>
        </div>
      </Modal>

      <Modal
        open={confirmSaveOpen}
        title="Update role permissions?"
        description={
          permissionsRole
            ? `Updating this role will immediately change sidebar access for ${permissionsRole.staffCount} staff member${permissionsRole.staffCount === 1 ? "" : "s"}. Continue?`
            : undefined
        }
        onClose={() => {
          setConfirmSaveOpen(false);
          setPendingPermissionCodes(null);
        }}
        size="md"
      >
        <FormFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setConfirmSaveOpen(false);
              setPendingPermissionCodes(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={savingPermissions}
            onClick={() => pendingPermissionCodes && void submitPermissions(pendingPermissionCodes)}
          >
            Update role
          </Button>
        </FormFooter>
      </Modal>
    </>
  );
}
