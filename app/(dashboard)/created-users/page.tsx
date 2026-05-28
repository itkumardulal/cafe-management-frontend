"use client";

import { useEffect } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ResponsiveTable } from "@/src/components/ui/table";
import { NotAuthorized } from "@/src/components/shared/not-authorized";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchCreatedUsersThunk } from "@/src/store/slices/user.slice";

export default function CreatedUsersPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { createdUsers, loading } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      void dispatch(fetchCreatedUsersThunk());
    }
  }, [dispatch, user?.role]);

  if (user?.role !== "SUPER_ADMIN") {
    return <NotAuthorized description="Only Super Admin can view users created by them." />;
  }

  return (
    <section className="page-shell page-content">
      <div className="space-y-1">
        <h1 className="heading-display text-foreground">Created Users</h1>
        <p className="text-muted">Users created by your Super Admin account.</p>
      </div>

      {!loading && createdUsers.length === 0 ? (
        <EmptyState
          title="No users created yet"
          description="Created cafe admins and staff will appear here."
        />
      ) : null}

      {createdUsers.length > 0 ? (
        <Card density="compact">
          <ResponsiveTable
            headers={["Name", "Email", "Role", "Cafe", "Status"]}
            className="hidden md:block"
            ariaLabel="Created users records"
            density="compact"
          >
            {createdUsers.map((item) => (
              <tr key={item.id} className="border-t border-(--color-border)">
                <td className="px-3 py-2.5">{item.fullName}</td>
                <td className="px-3 py-2.5">{item.email}</td>
                <td className="px-3 py-2.5">{item.role}</td>
                <td className="px-3 py-2.5">{item.cafe?.cafeName ?? "-"}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={item.isActive ? "success" : "warning"}>
                    {item.isActive ? "Active" : "Disabled"}
                  </Badge>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      ) : null}
    </section>
  );
}
