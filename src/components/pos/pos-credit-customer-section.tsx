"use client";

import {
  Mail,
  MapPin,
  User,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import type { CustomerSearchHit } from "@/src/lib/ar-types";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { normalizePhone } from "@/src/lib/phone-normalize";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

export type CreditCustomerMode = "existing" | "new";

type Props = {
  mode: CreditCustomerMode;
  onModeChange: (mode: CreditCustomerMode) => void;
  customerId: string | null;
  onCustomerIdChange: (id: string | null) => void;
  customerName: string;
  onCustomerNameChange: (v: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (v: string) => void;
  customerEmail: string;
  onCustomerEmailChange: (v: string) => void;
  customerAddress: string;
  onCustomerAddressChange: (v: string) => void;
  disabled?: boolean;
};

const CUSTOMER_SEARCH_LIMIT = 25;

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

const compactInputClass = "h-9";

function segmentClass(active: boolean, disabled?: boolean) {
  return cn(
    "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium",
    focusRing,
    active
      ? "bg-[var(--color-primary)] text-white shadow-sm"
      : "menu-segment-idle",
    disabled && "pointer-events-none opacity-60",
  );
}

function customerOptionLabel(hit: CustomerSearchHit): string {
  const hasDue = Number(hit.outstandingAmount) > 0.005;
  const due = hasDue ? ` · Due ${formatMoney(hit.outstandingAmount)}` : "";
  return `${hit.name} · ${hit.phoneNumber}${due}`;
}

function applyCustomerHit(
  hit: CustomerSearchHit,
  handlers: {
    onCustomerIdChange: (id: string | null) => void;
    onCustomerNameChange: (v: string) => void;
    onCustomerPhoneChange: (v: string) => void;
    onCustomerEmailChange: (v: string) => void;
    onCustomerAddressChange: (v: string) => void;
  },
) {
  handlers.onCustomerIdChange(hit.id);
  handlers.onCustomerNameChange(hit.name);
  handlers.onCustomerPhoneChange(hit.phoneNumber);
  handlers.onCustomerEmailChange(hit.email?.trim() ?? "");
  handlers.onCustomerAddressChange(hit.address?.trim() ?? "");
}

function CreditCustomerProfileCard({
  name,
  phone,
  email,
  address,
  outstandingAmount,
}: {
  name: string;
  phone: string;
  email: string;
  address: string;
  outstandingAmount?: string;
}) {
  const hasDue = outstandingAmount != null && Number(outstandingAmount) > 0.005;

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-50)]/80">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <User className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{name}</p>
            <p className="font-mono text-[11px] tabular-nums leading-tight text-muted">{phone}</p>
          </div>
        </div>
        {hasDue ? (
          <span className="shrink-0 rounded-full bg-[var(--color-warning)]/15 px-2 py-0.5 text-[10px] font-semibold tone-warning-text">
            Due {formatMoney(outstandingAmount!)}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            Clear
          </span>
        )}
      </div>
      {(address.trim() || email.trim()) ? (
        <dl className="space-y-1 px-2.5 py-1.5 text-xs leading-snug">
          {address.trim() ? (
            <div className="flex gap-1.5 text-muted">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              <dd className="min-w-0 text-foreground">{address}</dd>
            </div>
          ) : null}
          {email.trim() ? (
            <div className="flex gap-1.5 text-muted">
              <Mail className="mt-0.5 h-3 w-3 shrink-0" />
              <dd className="min-w-0 break-all text-foreground">{email}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

export function PosCreditCustomerSection({
  mode,
  onModeChange,
  customerId,
  onCustomerIdChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  customerEmail,
  onCustomerEmailChange,
  customerAddress,
  onCustomerAddressChange,
  disabled,
}: Props) {
  const [customers, setCustomers] = useState<CustomerSearchHit[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CustomerSearchHit | null>(null);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [creating, setCreating] = useState(false);

  const handlers = {
    onCustomerIdChange,
    onCustomerNameChange,
    onCustomerPhoneChange,
    onCustomerEmailChange,
    onCustomerAddressChange,
  };

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    setLoadError(false);
    try {
      const res = await operationsApi.customers.search({ limit: CUSTOMER_SEARCH_LIMIT });
      setCustomers(res.items);
    } catch {
      setCustomers([]);
      setLoadError(true);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "existing") {
      void loadCustomers();
    }
  }, [mode, loadCustomers]);

  const unlinkIfLinked = () => {
    if (customerId) {
      onCustomerIdChange(null);
      setSelectedSnapshot(null);
    }
  };

  const clearSelection = () => {
    onCustomerIdChange(null);
    onCustomerNameChange("");
    onCustomerPhoneChange("");
    onCustomerEmailChange("");
    onCustomerAddressChange("");
    setSelectedSnapshot(null);
    setEditDetailsOpen(false);
  };

  const handleDropdownChange = (id: string) => {
    if (!id) {
      clearSelection();
      return;
    }
    const hit = customers.find((c) => c.id === id);
    if (!hit) {
      return;
    }
    applyCustomerHit(hit, handlers);
    setSelectedSnapshot(hit);
    setEditDetailsOpen(false);
  };

  const switchMode = (next: CreditCustomerMode) => {
    onModeChange(next);
    setEditDetailsOpen(false);
    if (next === "new") {
      clearSelection();
    }
  };

  const phoneInputProps = {
    inputMode: "numeric" as const,
    maxLength: 10,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      const controlKeys = new Set([
        "Backspace",
        "Delete",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ]);
      if (controlKeys.has(e.key) || e.ctrlKey || e.metaKey) return;
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
        return;
      }
      if (customerPhone.length >= 10) {
        e.preventDefault();
      }
    },
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
      onCustomerPhoneChange(`${customerPhone}${pasted}`.slice(0, 10));
      unlinkIfLinked();
    },
  };

  const showProfileCard =
    mode === "existing" && customerId && customerName.trim() && !editDetailsOpen;

  const showDetailFields =
    mode === "new" || (mode === "existing" && (!customerId || editDetailsOpen));

  return (
    <div className="space-y-2">
      <div
        className="flex gap-1 rounded-lg bg-[var(--color-cream-100)] p-0.5"
        role="group"
        aria-label="Customer type"
      >
        <button
          type="button"
          className={segmentClass(mode === "existing", disabled)}
          disabled={disabled}
          onClick={() => switchMode("existing")}
        >
          <User className="h-3.5 w-3.5 shrink-0" />
          Existing
        </button>
        <button
          type="button"
          className={segmentClass(mode === "new", disabled)}
          disabled={disabled}
          onClick={() => switchMode("new")}
        >
          <UserPlus className="h-3.5 w-3.5 shrink-0" />
          New customer
        </button>
      </div>

      {mode === "existing" ? (
        <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
          <Field
            id="pos-credit-customer-select"
            label="Customer"
            required
            reserveErrorSpace={false}
            className="space-y-0.5"
          >
            <Select
              id="pos-credit-customer-select"
              value={customerId ?? ""}
              onChange={(e) => handleDropdownChange(e.target.value)}
              disabled={disabled || loadingCustomers}
              searchable
              searchPlaceholder="Filter by name or phone…"
              includeEmptyOptionInList
              size="sm"
            >
              <option value="">
                {loadingCustomers
                  ? "Loading customers…"
                  : loadError
                    ? "Could not load customers"
                    : customers.length === 0
                      ? "No registered customers yet"
                      : "Choose a customer…"}
              </option>
              {customers.map((hit) => (
                <option key={hit.id} value={hit.id}>
                  {customerOptionLabel(hit)}
                </option>
              ))}
            </Select>
          </Field>

          {loadError ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loadingCustomers}
              onClick={() => void loadCustomers()}
            >
              Retry
            </Button>
          ) : null}

          {showProfileCard ? (
            <>
              <CreditCustomerProfileCard
                name={customerName}
                phone={customerPhone}
                email={customerEmail}
                address={customerAddress}
                outstandingAmount={selectedSnapshot?.outstandingAmount}
              />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                <button
                  type="button"
                  className={cn(
                    "font-medium text-[var(--color-primary)] hover:underline",
                    focusRing,
                  )}
                  onClick={() => setEditDetailsOpen(true)}
                  disabled={disabled}
                >
                  Edit details
                </button>
                <span className="text-muted">·</span>
                <button
                  type="button"
                  className={cn(
                    "font-medium text-muted hover:text-foreground hover:underline",
                    focusRing,
                  )}
                  onClick={clearSelection}
                  disabled={disabled}
                >
                  Clear
                </button>
              </div>
            </>
          ) : !customerId ? (
            <p className="text-[11px] leading-snug text-muted">
              Select a customer to auto-fill their details.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-cream-50)]/50 px-2.5 py-1.5 text-[11px] leading-snug text-muted">
          First-time credit customer — fill in the form below.
        </p>
      )}

      {showDetailFields ? (
        <div className="grid gap-2 border-t border-[var(--color-border)] pt-2">
          {mode === "existing" && editDetailsOpen ? (
            <p className="text-[11px] font-medium text-muted">Editing for this sale</p>
          ) : null}
          <Field
            id="pos-credit-name"
            label="Name"
            required
            reserveErrorSpace={false}
            className="space-y-0.5"
          >
            <Input
              id="pos-credit-name"
              value={customerName}
              onChange={(e) => {
                onCustomerNameChange(e.target.value);
                unlinkIfLinked();
              }}
              disabled={disabled}
              placeholder="Full name"
              className={compactInputClass}
            />
          </Field>
          <Field
            id="pos-credit-phone"
            label="Phone"
            required
            reserveErrorSpace={false}
            className="space-y-0.5"
          >
            <Input
              id="pos-credit-phone"
              value={customerPhone}
              onChange={(e) => {
                onCustomerPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10));
                unlinkIfLinked();
              }}
              disabled={disabled}
              placeholder="10-digit mobile"
              className={cn(compactInputClass, "font-mono tabular-nums")}
              {...phoneInputProps}
            />
          </Field>
          <Field
            id="pos-credit-address"
            label="Address"
            required
            reserveErrorSpace={false}
            className="space-y-0.5"
          >
            <Input
              id="pos-credit-address"
              value={customerAddress}
              onChange={(e) => {
                onCustomerAddressChange(e.target.value);
                unlinkIfLinked();
              }}
              disabled={disabled}
              placeholder="Billing / delivery address"
              className={compactInputClass}
            />
          </Field>
          <Field
            id="pos-credit-email"
            label="Email"
            required
            reserveErrorSpace={false}
            className="space-y-0.5"
          >
            <Input
              id="pos-credit-email"
              type="email"
              value={customerEmail}
              onChange={(e) => {
                onCustomerEmailChange(e.target.value);
                unlinkIfLinked();
              }}
              disabled={disabled}
              placeholder="name@example.com"
              className={compactInputClass}
            />
          </Field>
          {mode === "existing" && editDetailsOpen ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 w-full sm:w-auto"
              onClick={() => setEditDetailsOpen(false)}
            >
              Done
            </Button>
          ) : null}
        </div>
      ) : null}

      {mode === "new" ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 w-full sm:w-auto"
          disabled={disabled}
          onClick={() => {
            setCreateName(customerName.trim());
            setCreatePhone(customerPhone.trim());
            setCreateEmail(customerEmail.trim());
            setCreateAddress(customerAddress.trim());
            setCreateOpen(true);
          }}
        >
          Save to customer list
        </Button>
      ) : null}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Register new customer">
        <div className="form-fields">
          <Field id="pos-create-credit-name" label="Name" required>
            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} />
          </Field>
          <Field id="pos-create-credit-phone" label="Phone" required>
            <Input
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
            />
          </Field>
          <Field id="pos-create-credit-email" label="Email">
            <Input
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
          </Field>
          <Field id="pos-create-credit-address" label="Address" required>
            <Input value={createAddress} onChange={(e) => setCreateAddress(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={creating}
              onClick={async () => {
                const phone = normalizePhone(createPhone);
                if (!phone || !/^9\d{9}$/.test(phone)) {
                  appToast.error("Enter a valid 10-digit phone starting with 9");
                  return;
                }
                if (!createName.trim()) {
                  appToast.error("Name is required");
                  return;
                }
                if (!createAddress.trim()) {
                  appToast.error("Address is required");
                  return;
                }
                setCreating(true);
                try {
                  const c = await operationsApi.customers.create({
                    name: createName.trim(),
                    phoneNumber: phone,
                    address: createAddress.trim(),
                    email: createEmail.trim() || undefined,
                  });
                  applyCustomerHit(c, handlers);
                  setSelectedSnapshot(c);
                  setCustomers((prev) => {
                    if (prev.some((p) => p.id === c.id)) return prev;
                    return [c, ...prev];
                  });
                  onModeChange("existing");
                  setEditDetailsOpen(false);
                  setCreateOpen(false);
                  appToast.success("Customer registered");
                } catch (error) {
                  appToast.error(getApiErrorMessage(error, "Failed to register customer"));
                } finally {
                  setCreating(false);
                }
              }}
            >
              Register
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
