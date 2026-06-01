"use client";

import { useEffect } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ResponsiveTable, tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { PageHeader } from "@/src/components/shared/page-header";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { cn } from "@/src/lib/cn";
import { userStatusBadgeVariant, userStatusLabel } from "@/src/lib/user-status";
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

  return (
    <section className="page-shell page-content">
      <PageHeader
        title="Created Users"
        description="Users created by your Super Admin account."
      />

      {!loading && createdUsers.length === 0 ? (
        <EmptyState
          title="No users created yet"
          description="Created cafe admins and staff will appear here."
        />
      ) : null}

      {createdUsers.length > 0 ? (
        <>
          <ListCardStack>
            {createdUsers.map((item) => (
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
                  { label: "Role", value: item.role },
                  { label: "Cafe", value: item.cafe?.cafeName ?? "—" },
                ]}
              />
            ))}
          </ListCardStack>
          <Card density="compact" className="hidden md:block">
            <ResponsiveTable
              headers={["Name", "Email", { label: "Role", thClassName: tableCenterColumnClass }, "Cafe", { label: "Status", thClassName: tableCenterColumnClass }]}
              ariaLabel="Created users records"
              density="compact"
            >
            {createdUsers.map((item) => (
              <tr key={item.id} className="border-t border-(--color-border)">
                <td className="px-3 py-2.5">{item.fullName}</td>
                <td className="px-3 py-2.5">{item.email}</td>
                <td className={cn("px-3 py-2.5", tableCenterCellClass)}>{item.role}</td>
                <td className="px-3 py-2.5">{item.cafe?.cafeName ?? "-"}</td>
                <td className={cn("px-3 py-2.5", tableCenterCellClass)}>
                  <Badge variant={userStatusBadgeVariant(item.status, item.isActive)}>
                    {userStatusLabel(item.status, item.isActive)}
                  </Badge>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
          </Card>
        </>
      ) : null}
    </section>
  );
}
