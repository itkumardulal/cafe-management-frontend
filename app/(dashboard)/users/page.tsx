"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { ResponsiveTable } from "@/src/components/ui/table";
import { NotAuthorized } from "@/src/components/shared/not-authorized";
import { staffSchema, type StaffSchemaType } from "@/src/features/users/schemas/staff.schema";
import { appToast } from "@/src/lib/toast";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { createStaffThunk, fetchStaffThunk } from "@/src/store/slices/user.slice";

const menuOptions = [
  "DASHBOARD",
  "BILLING",
  "INVENTORY",
  "ORDERS",
  "REPORTS",
  "USERS",
  "SETTINGS",
  "ACCOUNTING",
];

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const { staff, loading } = useAppSelector((state) => state.user);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffSchemaType>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      role: "STAFF",
      accessMenuCodes: ["DASHBOARD", "USERS"],
    },
  });

  useEffect(() => {
    if (authUser?.role === "CAFE_ADMIN") {
      void dispatch(fetchStaffThunk());
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
      reset();
      void dispatch(fetchStaffThunk());
      return;
    }
    appToast.error("Network error or validation issue");
  };

  return (
    <section className="page-shell page-content">
      <div className="space-y-1">
        <h1 className="heading-display text-foreground">Staff Management</h1>
        <p className="text-muted">Create staff users and monitor status.</p>
      </div>

      <Card density="comfortable">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3.5 sm:gap-4 md:grid-cols-2">
          <Field id="fullName" label="Full name" error={errors.fullName?.message} required>
            <Input
              {...register("fullName")}
              hasError={Boolean(errors.fullName)}
              aria-invalid={Boolean(errors.fullName)}
              placeholder="Enter full name"
            />
          </Field>
          <Field id="email" label="Email" error={errors.email?.message} required>
            <Input
              {...register("email")}
              hasError={Boolean(errors.email)}
              aria-invalid={Boolean(errors.email)}
              placeholder="staff@example.com"
            />
          </Field>
          <Field id="password" label="Password" error={errors.password?.message} required>
            <Input
              type="password"
              {...register("password")}
              hasError={Boolean(errors.password)}
              aria-invalid={Boolean(errors.password)}
              placeholder="Create temporary password"
            />
          </Field>
          <Field id="contactNumber" label="Contact number" error={errors.contactNumber?.message}>
            <Input
              {...register("contactNumber")}
              hasError={Boolean(errors.contactNumber)}
              aria-invalid={Boolean(errors.contactNumber)}
              placeholder="+977 ..."
            />
          </Field>
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-muted">Menu access</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {menuOptions.map((menu) => (
                <label
                  key={menu}
                  className="touch-target flex items-center gap-1.5 rounded-lg border border-(--color-border) bg-surface-muted px-2.5 text-[11px] leading-tight text-muted sm:gap-2 sm:px-3 sm:text-sm"
                >
                  <input
                    type="checkbox"
                    value={menu}
                    {...register("accessMenuCodes")}
                    className="h-4 w-4 rounded border-input"
                  />
                  {menu}
                </label>
              ))}
            </div>
          </div>
          <Button
            type="submit"
            loading={loading}
            className="w-fit md:col-span-2"
          >
            {loading ? "Saving..." : "Create Staff"}
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
        <>
          <ResponsiveTable
            headers={["Staff ID", "Name", "Email", "Status"]}
            className="hidden md:block"
            ariaLabel="Staff records"
            density="compact"
          >
            {staff.map((item) => (
              <tr key={item.id} className="border-t border-(--color-border)">
                <td className="px-3 py-2.5">{item.staffId}</td>
                <td className="px-3 py-2.5">{item.fullName}</td>
                <td className="px-3 py-2.5">{item.email}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={item.isActive ? "success" : "warning"}>
                    {item.isActive ? "Active" : "Disabled"}
                  </Badge>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
          <div className="space-y-3 md:hidden">
            {staff.map((item) => (
              <Card key={item.id} density="compact" className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{item.fullName}</p>
                  <Badge variant={item.isActive ? "success" : "warning"}>
                    {item.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-muted">{item.email}</p>
                <p className="text-xs text-subtle">Staff ID: {item.staffId}</p>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
