"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ResponsiveTable } from "@/src/components/ui/table";
import { NotAuthorized } from "@/src/components/shared/not-authorized";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchManagedCafesThunk } from "@/src/store/slices/cafe.slice";

export default function CafeAdminsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { managedCafes, loading } = useAppSelector((state) => state.cafe);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      void dispatch(fetchManagedCafesThunk());
    }
  }, [dispatch, user?.role]);

  if (user?.role !== "SUPER_ADMIN") {
    return <NotAuthorized description="Only Super Admin can view cafe admins." />;
  }

  const rows = managedCafes.flatMap((cafe) =>
    cafe.users.map((admin) => ({
      id: admin.id,
      cafeName: cafe.cafeName,
      cafeEmail: cafe.email,
      adminName: admin.fullName,
      adminEmail: admin.email,
      isActive: admin.isActive,
    })),
  );

  return (
    <section className="page-shell page-content">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Cafe Admins</h1>
          <p className="text-muted">Cafe admins created by you.</p>
        </div>
        <Link href="/cafe-admins/create">
          <Button type="button" size="sm">
            Create Cafe Admin
          </Button>
        </Link>
      </div>

      {!loading && rows.length === 0 ? (
        <EmptyState
          title="No cafe admins found"
          description="Create a new cafe to automatically create its cafe admin."
        />
      ) : null}

      {rows.length > 0 ? (
        <Card density="compact">
          <ResponsiveTable
            headers={["Cafe", "Cafe Email", "Admin Name", "Admin Email", "Status"]}
            className="hidden md:block"
            ariaLabel="Cafe admin records"
            density="compact"
          >
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-(--color-border)">
                <td className="px-3 py-2.5">{row.cafeName}</td>
                <td className="px-3 py-2.5">{row.cafeEmail}</td>
                <td className="px-3 py-2.5">{row.adminName}</td>
                <td className="px-3 py-2.5">{row.adminEmail}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={row.isActive ? "success" : "warning"}>
                    {row.isActive ? "Active" : "Disabled"}
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
