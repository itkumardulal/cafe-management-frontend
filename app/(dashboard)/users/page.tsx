"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { ResponsiveTable } from "@/src/components/ui/table";
import { NotAuthorized } from "@/src/components/shared/not-authorized";
import { staffSchema, type StaffSchemaType } from "@/src/features/users/schemas/staff.schema";
import { appToast } from "@/src/lib/toast";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  createStaffThunk,
  fetchAssignableMenusThunk,
  fetchStaffThunk,
  updateStaffThunk,
} from "@/src/store/slices/user.slice";
import type { StaffRecord } from "@/src/store/types/user.types";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const { staff, loading, assignableMenus } = useAppSelector((state) => state.user);
  const [editStaff, setEditStaff] = useState<StaffRecord | null>(null);
  const [editMenus, setEditMenus] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffSchemaType>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      role: "STAFF",
      accessMenuCodes: ["DASHBOARD"],
    },
  });

  useEffect(() => {
    if (authUser?.role === "CAFE_ADMIN") {
      void dispatch(fetchStaffThunk());
      void dispatch(fetchAssignableMenusThunk());
    }
  }, [authUser?.role, dispatch]);

  if (authUser?.role !== "CAFE_ADMIN") {
    return <NotAuthorized description="Only Cafe Admin can manage staff users." />;
  }

  const onSubmit = async (values: StaffSchemaType) => {
    const submitPromise = dispatch(createStaffThunk(values));
    appToast.promise(submitPromise.unwrap(), {
      loading: "Creating staff account...",
      success: "Staff created successfully",
      error: "Failed to save staff",
    });
    const result = await submitPromise;
    if (createStaffThunk.fulfilled.match(result)) {
      reset({ role: "STAFF", accessMenuCodes: ["DASHBOARD"] });
      void dispatch(fetchStaffThunk());
    }
  };

  const openEdit = (member: StaffRecord) => {
    setEditStaff(member);
    setEditName(member.fullName);
    setEditContact(member.contactNumber ?? "");
    setEditMenus(member.menuAccess?.map((a) => a.menu.code) ?? ["DASHBOARD"]);
  };

  const saveEdit = async () => {
    if (!editStaff) return;
    const promise = dispatch(
      updateStaffThunk({
        id: editStaff.id,
        fullName: editName,
        contactNumber: editContact || undefined,
        accessMenuCodes: editMenus,
      }),
    );
    appToast.promise(promise.unwrap(), {
      loading: "Updating staff...",
      success: "Staff updated",
      error: "Failed to update staff",
    });
    const result = await promise;
    if (updateStaffThunk.fulfilled.match(result)) {
      setEditStaff(null);
      void dispatch(fetchStaffThunk());
    }
  };

  const toggleMenu = (code: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(code)) {
      setList(list.filter((c) => c !== code));
    } else {
      setList([...list, code]);
    }
  };

  const MenuCheckboxes = ({
    selected,
    onChange,
  }: {
    selected: string[];
    onChange: (codes: string[]) => void;
  }) => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
      {assignableMenus.map((menu) => (
        <label
          key={menu.code}
          className="touch-target flex items-center gap-1.5 rounded-lg border border-(--color-border) bg-surface-muted px-2.5 py-2 text-xs sm:text-sm"
        >
          <input
            type="checkbox"
            checked={selected.includes(menu.code)}
            onChange={() => toggleMenu(menu.code, selected, onChange)}
            className="h-4 w-4 rounded border-input"
          />
          {menu.name}
        </label>
      ))}
    </div>
  );

  return (
    <section className="page-shell page-content">
      <div className="space-y-1">
        <h1 className="heading-display text-foreground">Staff Management</h1>
        <p className="text-muted">Create staff and assign menu access per role.</p>
      </div>

      <Card density="comfortable">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3.5 sm:gap-4 md:grid-cols-2">
          <Field id="fullName" label="Full name" error={errors.fullName?.message} required>
            <Input
              {...register("fullName")}
              hasError={Boolean(errors.fullName)}
              placeholder="Enter full name"
            />
          </Field>
          <Field id="email" label="Email" error={errors.email?.message} required>
            <Input {...register("email")} hasError={Boolean(errors.email)} placeholder="staff@example.com" />
          </Field>
          <Field id="password" label="Password" error={errors.password?.message} required>
            <Input
              type="password"
              {...register("password")}
              hasError={Boolean(errors.password)}
              placeholder="Create temporary password"
            />
          </Field>
          <Field id="contactNumber" label="Contact number" error={errors.contactNumber?.message}>
            <Input {...register("contactNumber")} placeholder="+977 ..." />
          </Field>
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-muted">Menu access</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {assignableMenus.map((menu) => (
                <label
                  key={menu.code}
                  className="touch-target flex items-center gap-1.5 rounded-lg border border-(--color-border) bg-surface-muted px-2.5 py-2 text-xs sm:text-sm"
                >
                  <input
                    type="checkbox"
                    value={menu.code}
                    {...register("accessMenuCodes")}
                    className="h-4 w-4 rounded border-input"
                  />
                  {menu.name}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" loading={loading} className="w-fit md:col-span-2">
            Create Staff
          </Button>
        </form>
      </Card>

      {loading && staff.length === 0 ? <TableSkeleton /> : null}

      {!loading && staff.length === 0 ? (
        <EmptyState
          title="No staff members yet"
          description="Create your first staff account using the form above."
        />
      ) : null}

      {staff.length > 0 ? (
        <Card density="compact" className="mt-4">
          <ResponsiveTable
            headers={["Staff ID", "Name", "Email", "Menus", "Status", ""]}
            ariaLabel="Staff records"
            density="compact"
          >
            {staff.map((item) => (
              <tr key={item.id} className="border-t border-(--color-border)">
                <td className="px-3 py-2.5">{item.staffId}</td>
                <td className="px-3 py-2.5">{item.fullName}</td>
                <td className="px-3 py-2.5">{item.email}</td>
                <td className="px-3 py-2.5 text-xs text-muted">
                  {item.menuAccess?.map((a) => a.menu.code).join(", ") ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={item.isActive ? "success" : "warning"}>
                    {item.isActive ? "Active" : "Disabled"}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      ) : null}

      <Modal open={editStaff !== null} title="Edit staff" onClose={() => setEditStaff(null)}>
        <div className="space-y-4">
          <Field id="editName" label="Full name" required>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Field id="editContact" label="Contact">
            <Input value={editContact} onChange={(e) => setEditContact(e.target.value)} />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium text-muted">Menu access</p>
            <MenuCheckboxes selected={editMenus} onChange={setEditMenus} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditStaff(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveEdit()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
