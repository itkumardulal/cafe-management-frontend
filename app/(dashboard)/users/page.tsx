"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Users } from "lucide-react";
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
import { Select } from "@/src/components/ui/select";
import { SortableTableHeader } from "@/src/components/ui/sortable-table-header";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import { UserLifecycleActions } from "@/src/features/users/components/user-lifecycle-actions";
import { staffSchema, type StaffSchemaType } from "@/src/features/users/schemas/staff.schema";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { appToast } from "@/src/lib/toast";
import { userStatusBadgeVariant, userStatusLabel } from "@/src/lib/user-status";
import { api } from "@/src/services/api";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { createStaffThunk, updateStaffThunk } from "@/src/store/slices/user.slice";
import type { StaffRecord } from "@/src/store/types/user.types";

type RoleOption = { id: string; name: string; menuCount: number };

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const [staffRefresh, setStaffRefresh] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [editStaff, setEditStaff] = useState<StaffRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editRoleId, setEditRoleId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StaffSchemaType>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      role: "STAFF",
      staffRoleId: "",
      password: "",
    },
  });

  const staffRoleId = watch("staffRoleId");
  const hasRoles = roleOptions.length > 0;

  const loadRoleOptions = async () => {
    setRolesLoading(true);
    try {
      const options = await operationsApi.staffRoles.options();
      setRoleOptions(options);
    } catch {
      setRoleOptions([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?.role === "CAFE_ADMIN") {
      void loadRoleOptions();
    }
  }, [authUser?.role]);

  const closeAddModal = () => {
    setAddOpen(false);
    setShowPassword(false);
    reset({
      role: "STAFF",
      staffRoleId: roleOptions[0]?.id ?? "",
      password: "",
      fullName: "",
      email: "",
      contactNumber: "",
    });
  };

  const openAddModal = () => {
    reset({
      role: "STAFF",
      staffRoleId: roleOptions[0]?.id ?? "",
      password: "",
      fullName: "",
      email: "",
      contactNumber: "",
    });
    setAddOpen(true);
  };

  const onSubmit = async (values: StaffSchemaType) => {
    setCreating(true);
    const payload = {
      fullName: values.fullName,
      email: values.email,
      contactNumber: values.contactNumber,
      role: values.role,
      staffRoleId: values.staffRoleId,
      ...(values.password?.trim() ? { password: values.password.trim() } : {}),
    };
    try {
      const result = await dispatch(createStaffThunk(payload));
      if (createStaffThunk.fulfilled.match(result)) {
        appToast.success(
          values.password?.trim() ? "Staff created and credentials email sent" : "Invitation sent",
        );
        closeAddModal();
        setStaffRefresh((n) => n + 1);
      } else if (createStaffThunk.rejected.match(result)) {
        appToast.error(result.payload ?? "Failed to save staff");
      } else {
        appToast.error("Failed to save staff");
      }
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (member: StaffRecord) => {
    setEditStaff(member);
    setEditName(member.fullName);
    setEditContact(member.contactNumber ?? "");
    setEditRoleId(member.staffRole?.id ?? roleOptions[0]?.id ?? "");
  };

  const saveEdit = async () => {
    if (!editStaff || !editRoleId) return;
    const result = await dispatch(
      updateStaffThunk({
        id: editStaff.id,
        fullName: editName,
        contactNumber: editContact || undefined,
        staffRoleId: editRoleId,
      }),
    );
    if (updateStaffThunk.fulfilled.match(result)) {
      appToast.success("Staff updated");
      setEditStaff(null);
      setStaffRefresh((n) => n + 1);
    } else if (updateStaffThunk.rejected.match(result)) {
      appToast.error(result.payload ?? "Failed to update staff");
    } else {
      appToast.error("Failed to update staff");
    }
  };

  return (
    <section className="page-shell page-content">
      <PageHeader
        title="Staff Management"
        description="Add team members and assign a staff role for sidebar access."
        action={
          <Button
            type="button"
            size="sm"
            onClick={openAddModal}
            disabled={!hasRoles || rolesLoading}
          >
            Add user
          </Button>
        }
      />

      {!rolesLoading && !hasRoles ? (
        <Card className="border-dashed p-4 text-sm">
          <p className="font-medium text-foreground">Create a staff role first</p>
          <p className="mt-1 text-muted">
            You need at least one staff role before adding team members.{" "}
            <Link href="/roles" className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline">
              Go to User Roles
            </Link>
          </p>
        </Card>
      ) : null}

      <Suspense fallback={<TableSkeleton />}>
        <UsersStaffList
          key={staffRefresh}
          onEdit={openEdit}
          onAddUser={openAddModal}
          canAddUser={hasRoles && !rolesLoading}
          onLifecycleChange={() => setStaffRefresh((n) => n + 1)}
        />
      </Suspense>

      <Modal
        open={addOpen}
        title="Add staff member"
        description="Leave password empty to send an invitation link, or set a temporary password to email login credentials (they must change it on first login)."
        onClose={closeAddModal}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="form-fields">
          <div className="form-grid">
            <Field id="fullName" label="Full name" error={errors.fullName?.message} required>
              <Input
                {...register("fullName")}
                hasError={Boolean(errors.fullName)}
                placeholder="Enter full name"
              />
            </Field>
            <Field id="email" label="Email" error={errors.email?.message} required>
              <Input
                type="email"
                {...register("email")}
                hasError={Boolean(errors.email)}
                placeholder="staff@example.com"
              />
            </Field>
            <Field id="contactNumber" label="Contact number" error={errors.contactNumber?.message}>
              <Input {...register("contactNumber")} placeholder="+977 ..." />
            </Field>
            <Field
              id="password"
              label="Password (optional)"
              error={errors.password?.message}
              hint="Empty = invitation link. Set = credentials emailed; staff changes password on first login."
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  autoComplete="new-password"
                  hasError={Boolean(errors.password)}
                  placeholder="Leave empty to invite"
                  className="pr-12"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-muted)]"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          </div>
          <Field id="staffRoleId" label="Staff role" error={errors.staffRoleId?.message} required>
            <Select
              value={staffRoleId}
              onChange={(e) =>
                setValue("staffRoleId", e.target.value, { shouldDirty: true, shouldValidate: true })
              }
              hasError={Boolean(errors.staffRoleId)}
            >
              <option value="">Select a role</option>
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} · {role.menuCount} area{role.menuCount === 1 ? "" : "s"}
                </option>
              ))}
            </Select>
          </Field>
          <FormFooter>
            <Button type="button" variant="secondary" onClick={closeAddModal} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Add user
            </Button>
          </FormFooter>
        </form>
      </Modal>

      <Modal
        open={editStaff !== null}
        title="Edit staff"
        description="Update profile details and staff role."
        onClose={() => setEditStaff(null)}
        size="md"
      >
        <div className="form-fields">
          <Field id="editName" label="Full name" required>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Field id="editContact" label="Contact">
            <Input value={editContact} onChange={(e) => setEditContact(e.target.value)} />
          </Field>
          <Field id="editRoleId" label="Staff role" required>
            <Select value={editRoleId} onChange={(e) => setEditRoleId(e.target.value)}>
              <option value="">Select a role</option>
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} · {role.menuCount} area{role.menuCount === 1 ? "" : "s"}
                </option>
              ))}
            </Select>
          </Field>
          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setEditStaff(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveEdit()} disabled={!editRoleId}>
              Save
            </Button>
          </FormFooter>
        </div>
      </Modal>
    </section>
  );
}

function RoleBadge({ role }: { role?: { id: string; name: string } | null }) {
  if (!role?.name) {
    return <span className="text-xs text-muted">—</span>;
  }
  return (
    <Badge size="sm" variant="default">
      {role.name}
    </Badge>
  );
}

function StaffLifecycleActions({
  item,
  onEdit,
  onLifecycleChange,
}: {
  item: StaffRecord;
  onEdit: (member: StaffRecord) => void;
  onLifecycleChange: () => void;
}) {
  return (
    <UserLifecycleActions
      status={item.status}
      isActive={item.isActive}
      displayName={item.fullName}
      onResendInvite={() => api.post(`/users/staff/${item.id}/resend-invitation`).then(() => undefined)}
      onEdit={() => onEdit(item)}
      onDeactivate={() => operationsApi.users.staff.disable(item.id).then(() => undefined)}
      onActivate={() => operationsApi.users.staff.enable(item.id).then(() => undefined)}
      onSuccess={onLifecycleChange}
    />
  );
}

function UsersStaffList({
  onEdit,
  onAddUser,
  canAddUser,
  onLifecycleChange,
}: {
  onEdit: (member: StaffRecord) => void;
  onAddUser: () => void;
  canAddUser: boolean;
  onLifecycleChange: () => void;
}) {
  const {
    items: staff,
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
    queryKey: "users",
    fetchFn: (p) =>
      operationsApi.users.staff.list(p) as Promise<
        import("@/src/hooks/use-paginated-list").PaginatedResult<StaffRecord>
      >,
    defaultSort: { sortBy: "createdAt", sortOrder: "desc" },
    errorMessage: "Failed to load staff",
  });

  return (
    <PaginatedListSection
      loading={loading}
      isFetching={isFetching}
      itemsCount={staff.length}
      hasActiveFilters={hasActiveFilters}
      searchValue={searchInput}
      onSearchChange={setSearch}
      onSearchClear={clearSearch}
      searchPlaceholder={searchPlaceholder}
      isSearching={isSearching}
      searchResultSummary={searchResultSummary}
      tableColumns={6}
      emptyTitle="No Users Found"
      emptyDescription="Add your first staff member to get started."
      emptyIcon={Users}
      emptyAction={canAddUser ? { label: "Add user", onClick: onAddUser } : undefined}
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
            { label: "Name (A–Z)", sortBy: "fullName", sortOrder: "asc" },
            { label: "Name (Z–A)", sortBy: "fullName", sortOrder: "desc" },
            { label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
            { label: "Oldest first", sortBy: "createdAt", sortOrder: "asc" },
          ]}
          currentSortBy={params.sortBy}
          currentSortOrder={params.sortOrder}
          onSort={setSort}
        />
      }
      mobileCards={
        <ListCardStack>
          {staff.map((item) => (
            <ListCard
              key={item.id}
              title={item.fullName}
              subtitle={item.email}
              badge={
                <Badge variant={userStatusBadgeVariant(item.status, item.isActive)}>
                  {userStatusLabel(item.status, item.isActive)}
                </Badge>
              }
              fields={[
                { label: "Staff ID", value: item.staffId },
                { label: "Role", value: <RoleBadge role={item.staffRole} /> },
              ]}
              actions={
                <StaffLifecycleActions
                  item={item}
                  onEdit={onEdit}
                  onLifecycleChange={onLifecycleChange}
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
            { label: "Staff ID", thClassName: tableCenterColumnClass },
            {
              label: "Name",
              headerContent: (
                <SortableTableHeader
                  label="Name"
                  sortKey="fullName"
                  currentSortBy={params.sortBy}
                  currentSortOrder={params.sortOrder}
                  onSort={toggleSort}
                />
              ),
            },
            "Email",
            { label: "Role", thClassName: tableCenterColumnClass },
            { label: "Status", thClassName: tableCenterColumnClass },
            { label: "Actions", thClassName: tableActionsColumnClass },
          ]}
          ariaLabel="Staff records"
          density="compact"
        >
          {staff.map((item) => (
            <tr key={item.id} className="border-t border-[var(--color-border)]">
              <td className={cn("px-3 py-2.5", tableCenterCellClass)}>{item.staffId}</td>
              <td className="px-3 py-2.5">{item.fullName}</td>
              <td className="px-3 py-2.5">{item.email}</td>
              <td className={cn("px-3 py-2.5", tableCenterCellClass)}>
                <RoleBadge role={item.staffRole} />
              </td>
              <td className={cn("px-3 py-2.5", tableCenterCellClass)}>
                <Badge variant={userStatusBadgeVariant(item.status, item.isActive)}>
                  {userStatusLabel(item.status, item.isActive)}
                </Badge>
              </td>
              <td className="px-3 py-2.5">
                <div className={tableActionsCellClass}>
                  <StaffLifecycleActions
                    item={item}
                    onEdit={onEdit}
                    onLifecycleChange={onLifecycleChange}
                  />
                </div>
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      </Card>
    </PaginatedListSection>
  );
}
