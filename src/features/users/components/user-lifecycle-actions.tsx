"use client";

import { useState } from "react";
import { FormFooter } from "@/src/components/shared/form-footer";
import { Button } from "@/src/components/ui/button";
import { Dropdown } from "@/src/components/ui/dropdown";
import { Modal } from "@/src/components/ui/modal";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { appToast } from "@/src/lib/toast";
import type { UserStatus } from "@/src/lib/user-status";

type ConfirmKind = "deactivate" | "delete" | null;

export function UserLifecycleActions({
  status,
  displayName,
  onResendInvite,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  deleteWarning,
  onSuccess,
}: {
  status?: UserStatus;
  isActive?: boolean;
  displayName: string;
  onResendInvite?: () => Promise<void>;
  onEdit?: () => void;
  onDeactivate: () => Promise<void>;
  onActivate: () => Promise<void>;
  onDelete?: () => Promise<void>;
  deleteWarning?: string;
  onSuccess: () => void;
}) {
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [loading, setLoading] = useState(false);

  const isLocked = status === "LOCKED";
  const isInactive = status === "INACTIVE";
  const canDeactivate = !isInactive;
  const canActivate = isInactive || isLocked;

  const closeConfirm = () => {
    if (!loading) {
      setConfirmKind(null);
    }
  };

  const handleResendInvite = async () => {
    if (!onResendInvite) return;
    setLoading(true);
    try {
      await onResendInvite();
      appToast.success("Invitation sent");
      onSuccess();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to resend invitation"));
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      await onActivate();
      appToast.success("User activated");
      onSuccess();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to activate user"));
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async () => {
    if (!confirmKind) return;
    setLoading(true);
    try {
      if (confirmKind === "deactivate") {
        await onDeactivate();
        appToast.success("User deactivated");
      } else if (onDelete) {
        await onDelete();
        appToast.success("User deleted");
      }
      setConfirmKind(null);
      onSuccess();
    } catch (error) {
      const fallback =
        confirmKind === "deactivate" ? "Failed to deactivate user" : "Failed to delete user";
      appToast.error(getApiErrorMessage(error, fallback));
    } finally {
      setLoading(false);
    }
  };

  const dropdownItems: { id: string; label: string; onClick: () => void }[] = [];

  if (status === "INVITED" && onResendInvite) {
    dropdownItems.push({
      id: "resend",
      label: "Resend invite",
      onClick: () => void handleResendInvite(),
    });
  }

  if (onEdit) {
    dropdownItems.push({
      id: "edit",
      label: "Edit",
      onClick: onEdit,
    });
  }

  if (canActivate) {
    dropdownItems.push({
      id: "activate",
      label: isLocked ? "Unlock" : "Activate",
      onClick: () => void handleActivate(),
    });
  }

  if (canDeactivate) {
    dropdownItems.push({
      id: "deactivate",
      label: "Deactivate",
      onClick: () => setConfirmKind("deactivate"),
    });
  }

  if (onDelete) {
    dropdownItems.push({
      id: "delete",
      label: "Delete",
      onClick: () => setConfirmKind("delete"),
    });
  }

  if (dropdownItems.length === 0) {
    return null;
  }

  return (
    <>
      <Dropdown label={loading ? "..." : "Actions"} items={dropdownItems} disabled={loading} />

      <Modal
        open={confirmKind === "deactivate"}
        title="Deactivate user?"
        description="They will be signed out and cannot log in until reactivated."
        onClose={closeConfirm}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Deactivate <span className="font-semibold text-foreground">{displayName}</span>?
          </p>
          <FormFooter>
            <Button type="button" variant="secondary" onClick={closeConfirm} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void confirmAction()}
              loading={loading}
            >
              Deactivate
            </Button>
          </FormFooter>
        </div>
      </Modal>

      {onDelete ? (
        <Modal
          open={confirmKind === "delete"}
          title="Delete user?"
          description={
            deleteWarning ??
            "This permanently removes the user from your team list. Historical records are kept."
          }
          onClose={closeConfirm}
        >
          <div className="space-y-5">
            <p className="text-sm text-muted">
              Delete <span className="font-semibold text-foreground">{displayName}</span>? This cannot
              be undone from the app.
            </p>
            <FormFooter>
              <Button type="button" variant="secondary" onClick={closeConfirm} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => void confirmAction()}
                loading={loading}
              >
                Yes, delete
              </Button>
            </FormFooter>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
