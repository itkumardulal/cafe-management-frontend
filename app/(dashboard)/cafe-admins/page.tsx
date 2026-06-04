"use client";

import { Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Modal } from "@/src/components/ui/modal";
import { ResponsiveTable, tableActionsCellClass, tableActionsColumnClass, tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { PageHeader } from "@/src/components/shared/page-header";
import { CreateCafeAdminForm } from "@/src/features/cafes/components/create-cafe-admin-form";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { cn } from "@/src/lib/cn";
import { userStatusBadgeVariant, userStatusLabel } from "@/src/lib/user-status";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { appToast } from "@/src/lib/toast";
import { api } from "@/src/services/api";
import { fetchManagedCafesThunk } from "@/src/store/slices/cafe.slice";
import { EmptyState } from "@/src/components/ui/empty-state";

function CafeAdminsPageContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const { managedCafes, managedCafesStatus } = useAppSelector((state) => state.cafe);
  const loading = managedCafesStatus === "loading" && managedCafes.length === 0;
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      void dispatch(fetchManagedCafesThunk());
    }
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setAddOpen(true);
      router.replace("/cafe-admins", { scroll: false });
    }
  }, [searchParams, router]);

  const rows = managedCafes.flatMap((cafe) =>
    cafe.users.map((admin) => ({
      id: admin.id,
      cafeId: cafe.id,
      cafeName: cafe.cafeName,
      cafeEmail: cafe.email,
      adminName: admin.fullName,
      adminEmail: admin.email,
      isActive: admin.isActive,
      status: admin.status,
    })),
  );

  const handleResendInvite = async (cafeId: string) => {
    try {
      await api.post(`/cafes/${cafeId}/admin/resend-invitation`);
      appToast.success("Invitation sent");
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to resend invitation"));
    }
  };

  const closeAddModal = () => setAddOpen(false);

  const onCafeCreated = () => {
    closeAddModal();
    void dispatch(fetchManagedCafesThunk({ force: true }));
  };

  return (
    <section className="page-shell page-content">
      <PageHeader
        title="Cafe Admins"
        description="Cafe admins created by you."
        action={
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            Add cafe admin
          </Button>
        }
      />

      {!loading && rows.length === 0 ? (
        <EmptyState
          title="No cafe admins found"
          description="Create a cafe and its admin account to get started."
          icon={Store}
          action={{ label: "Add cafe admin", onClick: () => setAddOpen(true) }}
        />
      ) : null}

      {rows.length > 0 ? (
        <>
          <ListCardStack>
            {rows.map((row) => (
              <ListCard
                key={row.id}
                title={row.cafeName}
                subtitle={row.adminName}
                badge={
                  <Badge variant={userStatusBadgeVariant(row.status, row.isActive)}>
                    {userStatusLabel(row.status, row.isActive)}
                  </Badge>
                }
                fields={[
                  { label: "Cafe email", value: row.cafeEmail },
                  { label: "Admin email", value: row.adminEmail },
                ]}
                actions={
                  row.status === "INVITED" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleResendInvite(row.cafeId)}
                    >
                      Resend invite
                    </Button>
                  ) : null
                }
              />
            ))}
          </ListCardStack>
          <Card density="compact" className="hidden md:block">
            <ResponsiveTable
              headers={["Cafe", "Cafe Email", "Admin Name", "Admin Email", { label: "Status", thClassName: tableCenterColumnClass }, { label: "Actions", thClassName: tableActionsColumnClass }]}
              ariaLabel="Cafe admin records"
              density="compact"
            >
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-(--color-border)">
                <td className="px-3 py-2.5">{row.cafeName}</td>
                <td className="px-3 py-2.5">{row.cafeEmail}</td>
                <td className="px-3 py-2.5">{row.adminName}</td>
                <td className="px-3 py-2.5">{row.adminEmail}</td>
                <td className={cn("px-3 py-2.5", tableCenterCellClass)}>
                  <Badge variant={userStatusBadgeVariant(row.status, row.isActive)}>
                    {userStatusLabel(row.status, row.isActive)}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <div className={tableActionsCellClass}>
                  {row.status === "INVITED" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleResendInvite(row.cafeId)}
                    >
                      Resend invite
                    </Button>
                  ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
          </Card>
        </>
      ) : null}

      <Modal
        open={addOpen}
        title="Add cafe admin"
        description="Create a cafe profile and admin account. Leave password empty to send an invitation email."
        onClose={closeAddModal}
        size="xl"
        mobileVariant="fullscreen"
      >
        {addOpen ? (
          <CreateCafeAdminForm key="create-cafe-admin" onSuccess={onCafeCreated} onCancel={closeAddModal} />
        ) : null}
      </Modal>
    </section>
  );
}

export default function CafeAdminsPage() {
  return (
    <Suspense fallback={null}>
      <CafeAdminsPageContent />
    </Suspense>
  );
}
