"use client";

import { Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Modal } from "@/src/components/ui/modal";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { PageHeader } from "@/src/components/shared/page-header";
import { CreateCafeAdminForm } from "@/src/features/cafes/components/create-cafe-admin-form";
import {
  EditCafeAdminForm,
  type EditCafeAdminRecord,
} from "@/src/features/cafes/components/edit-cafe-admin-form";
import { UserLifecycleActions } from "@/src/features/users/components/user-lifecycle-actions";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { cn } from "@/src/lib/cn";
import { userStatusBadgeVariant, userStatusLabel } from "@/src/lib/user-status";
import type { UserStatus } from "@/src/lib/user-status";
import { api } from "@/src/services/api";
import { operationsApi } from "@/src/services/operations-api";
import { fetchManagedCafesThunk } from "@/src/store/slices/cafe.slice";
import { EmptyState } from "@/src/components/ui/empty-state";

type CafeAdminRow = {
  id: string;
  cafeId: string;
  cafeName: string;
  cafeEmail: string;
  adminName: string;
  adminEmail: string;
  slug: string;
  address?: string | null;
  contactNumber?: string | null;
  logo?: string | null;
  isActive: boolean;
  status?: UserStatus;
};

function CafeAdminLifecycleActions({
  row,
  onEdit,
  onLifecycleChange,
}: {
  row: CafeAdminRow;
  onEdit: (row: CafeAdminRow) => void;
  onLifecycleChange: () => void;
}) {
  return (
    <UserLifecycleActions
      status={row.status}
      isActive={row.isActive}
      displayName={row.adminName}
      onResendInvite={() =>
        api.post(`/cafes/${row.cafeId}/admin/resend-invitation`).then(() => undefined)
      }
      onEdit={() => onEdit(row)}
      onDeactivate={() => operationsApi.cafes.admin.disable(row.cafeId).then(() => undefined)}
      onActivate={() => operationsApi.cafes.admin.enable(row.cafeId).then(() => undefined)}
      onSuccess={onLifecycleChange}
    />
  );
}

function CafeAdminsPageContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const { managedCafes, managedCafesStatus } = useAppSelector((state) => state.cafe);
  const loading = managedCafesStatus === "loading" && managedCafes.length === 0;
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EditCafeAdminRecord | null>(null);

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

  const rows: CafeAdminRow[] = managedCafes.flatMap((cafe) =>
    cafe.users.map((admin) => ({
      id: admin.id,
      cafeId: cafe.id,
      cafeName: cafe.cafeName,
      cafeEmail: cafe.email,
      adminName: admin.fullName,
      adminEmail: admin.email,
      slug: cafe.slug,
      address: cafe.address,
      contactNumber: cafe.contactNumber,
      logo: cafe.logo,
      isActive: admin.isActive,
      status: admin.status,
    })),
  );

  const openEdit = (row: CafeAdminRow) => {
    setEditRecord({
      cafeId: row.cafeId,
      cafeName: row.cafeName,
      adminName: row.adminName,
      adminEmail: row.adminEmail,
      slug: row.slug,
      address: row.address,
      contactNumber: row.contactNumber,
      logo: row.logo,
    });
  };

  const refreshList = () => {
    void dispatch(fetchManagedCafesThunk({ force: true }));
  };

  const closeAddModal = () => setAddOpen(false);

  const onCafeCreated = () => {
    closeAddModal();
    refreshList();
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
                  <CafeAdminLifecycleActions
                    row={row}
                    onEdit={openEdit}
                    onLifecycleChange={refreshList}
                  />
                }
              />
            ))}
          </ListCardStack>
          <Card density="compact" className="hidden md:block">
            <ResponsiveTable
              headers={[
                "Cafe",
                "Cafe Email",
                "Admin Name",
                "Admin Email",
                { label: "Status", thClassName: tableCenterColumnClass },
                { label: "Actions", thClassName: tableActionsColumnClass },
              ]}
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
                      <CafeAdminLifecycleActions
                        row={row}
                        onEdit={openEdit}
                        onLifecycleChange={refreshList}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </ResponsiveTable>
          </Card>
        </>
      ) : null}

      <Modal
        open={editRecord !== null}
        title="Edit cafe admin"
        description="Update cafe profile and admin account details."
        onClose={() => setEditRecord(null)}
        size="xl"
        mobileVariant="fullscreen"
      >
        {editRecord ? (
          <EditCafeAdminForm
            key={editRecord.cafeId}
            record={editRecord}
            onSuccess={() => {
              setEditRecord(null);
              refreshList();
            }}
            onCancel={() => setEditRecord(null)}
          />
        ) : null}
      </Modal>

      <Modal
        open={addOpen}
        title="Add cafe admin"
        description="Create a cafe profile and admin account. Leave password empty for an invitation link, or set a password to email login credentials."
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
