"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { User, UserCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import type { CustomerType } from "@/src/lib/ar-types";
import { formatMoney } from "@/src/lib/format-display";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type SearchHit = {
  id: string;
  name: string;
  phoneNumber: string;
  outstandingAmount: string;
};

type Props = {
  customerType: CustomerType;
  onCustomerTypeChange: (t: CustomerType) => void;
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

export function PosCustomerPicker({
  customerType,
  onCustomerTypeChange,
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
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (customerType !== "REGISTERED" || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await operationsApi.customers.search({ q, limit: 8 });
      setSuggestions(res.items);
      setHighlight(0);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, [customerType]);

  useEffect(() => {
    if (customerType !== "REGISTERED") {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(customerPhone);
    }, 280);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [customerPhone, customerType, runSearch]);

  const selectCustomer = (hit: SearchHit) => {
    onCustomerIdChange(hit.id);
    onCustomerNameChange(hit.name);
    onCustomerPhoneChange(hit.phoneNumber);
    setShowList(false);
  };

  const onTypeChange = (t: CustomerType) => {
    onCustomerTypeChange(t);
    if (t === "WALK_IN") {
      onCustomerIdChange(null);
      onCustomerNameChange("");
      onCustomerPhoneChange("");
      onCustomerEmailChange("");
      onCustomerAddressChange("");
    }
  };

  const segmentClass = (active: boolean) =>
    cn(
      "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-[var(--color-primary)] text-white"
        : "border border-[var(--color-border)] bg-[var(--color-surface)] text-muted",
      disabled && "pointer-events-none opacity-60",
    );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          className={segmentClass(customerType === "WALK_IN")}
          disabled={disabled}
          onClick={() => onTypeChange("WALK_IN")}
        >
          <UserCircle className="h-4 w-4" />
          Walk-in
        </button>
        <button
          type="button"
          className={segmentClass(customerType === "REGISTERED")}
          disabled={disabled}
          onClick={() => onTypeChange("REGISTERED")}
        >
          <User className="h-4 w-4" />
          Registered
        </button>
      </div>

      {customerType === "REGISTERED" ? (
        <div className="relative space-y-3">
          <Field id="pos-customer-phone" label="Phone" required>
            <Input
              id="pos-customer-phone"
              value={customerPhone}
              onChange={(e) => {
                onCustomerPhoneChange(e.target.value);
                onCustomerIdChange(null);
                setShowList(true);
              }}
              onFocus={() => setShowList(true)}
              onKeyDown={(e) => {
                if (!showList || suggestions.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const hit = suggestions[highlight];
                  if (hit) selectCustomer(hit);
                } else if (e.key === "Escape") {
                  setShowList(false);
                }
              }}
              placeholder="Search by phone or name"
              disabled={disabled}
              autoComplete="off"
            />
          </Field>

          {showList && (suggestions.length > 0 || searching) ? (
            <ul
              className="absolute z-20 mt-[-0.5rem] max-h-56 w-full overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
              role="listbox"
            >
              {searching && suggestions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">Searching…</li>
              ) : null}
              {suggestions.map((hit, i) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-[var(--color-cream-100)]",
                      i === highlight && "bg-[var(--color-primary-soft)]",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectCustomer(hit);
                    }}
                  >
                    <span className="font-medium text-foreground">{hit.name}</span>
                    <span className="text-xs text-muted">
                      {hit.phoneNumber}
                      {Number(hit.outstandingAmount) > 0.005
                        ? ` · Outstanding: ${formatMoney(hit.outstandingAmount)}`
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
              {!searching && customerPhone.trim().length >= 3 && suggestions.length === 0 ? (
                <li className="border-t border-[var(--color-border)] p-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setCreatePhone(customerPhone.trim());
                      setCreateName(customerName.trim());
                      setCreateAddress(customerAddress.trim());
                      setCreateOpen(true);
                      setShowList(false);
                    }}
                  >
                    Create new customer
                  </Button>
                </li>
              ) : null}
            </ul>
          ) : null}

          <Input
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            disabled={disabled}
          />
          <Input
            type="email"
            placeholder="Email (optional)"
            value={customerEmail}
            onChange={(e) => onCustomerEmailChange(e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="Address"
            value={customerAddress}
            onChange={(e) => onCustomerAddressChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      ) : (
        <p className="text-sm text-muted">
          Walk-in sale — no customer account. Credit sales are not available.
        </p>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New customer"
      >
        <div className="space-y-3">
          <Field id="pos-create-customer-name" label="Name" required>
            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} />
          </Field>
          <Field id="pos-create-customer-phone" label="Phone" required>
            <Input value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} />
          </Field>
          <Field id="pos-create-customer-address" label="Address">
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
                setCreating(true);
                try {
                  const c = await operationsApi.customers.create({
                    name: createName.trim(),
                    phoneNumber: createPhone.trim(),
                    address: createAddress.trim() || undefined,
                  });
                  selectCustomer(c);
                  setCreateOpen(false);
                  appToast.success("Customer created");
                } catch (error) {
                  appToast.error(getApiErrorMessage(error, "Failed to create customer"));
                } finally {
                  setCreating(false);
                }
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
