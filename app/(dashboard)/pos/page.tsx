"use client";

import {
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThermalPrintHost } from "@/src/features/printing/components/thermal-print-host";
import { useThermalPrint } from "@/src/features/printing/hooks/use-thermal-print";
import {
  buildInitialPaymentsFromCheckout,
  PosCheckoutPaymentSection,
  useCheckoutPaymentValidation,
  type BankAccountOption,
} from "@/src/components/pos/pos-checkout-payment-section";
import { PosSaleDetail } from "@/src/components/sales/pos-sale-detail";
import type { CheckoutPaymentType } from "@/src/lib/ar-types";
import { ViewModalSkeleton } from "@/src/components/skeletons/view-modal-skeleton";
import {
  PosSaleReceipt,
  type PosSaleReceiptData,
} from "@/src/components/sales/pos-sale-receipt";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Input } from "@/src/components/ui/input";
import { NumberInput } from "@/src/components/ui/number-input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
} from "@/src/components/ui/table";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { invalidateGetCache } from "@/src/lib/api-fetch-dedupe";
import { cn } from "@/src/lib/cn";
import { formatDateTime, formatMoney } from "@/src/lib/format-display";
import { roundMoneyStr } from "@/src/lib/money-input";
import { normalizePhone } from "@/src/lib/phone-normalize";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchSellableCatalogThunk } from "@/src/store/slices/reference-data.slice";
import {
  buildCatalogSections,
  buildCategoryChips,
} from "@/src/lib/menu-catalog-layout";
import type { SellableCatalogItem } from "@/src/store/types/reference-data.types";

type CatalogItem = SellableCatalogItem;

type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  maxQty: number;
};

type SaleRow = {
  id: string;
  receiptNo: string;
  saleAt: string;
  serviceType: "DINE_IN" | "DELIVERY";
  billingType: "PAID" | "CREDIT";
  customerPhone?: string | null;
  grandTotal: string;
  cashPaidAmount: string;
  bankPaidAmount: string;
  creditAmount: string;
};

function parseMoneyInput(str: string) {
  const t = str.trim();
  if (t === "") return { amount: 0, invalid: false };
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return { amount: 0, invalid: true };
  return { amount: Math.round(n * 100) / 100, invalid: false };
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

const AUTO_PRINT_STORAGE_KEY = "pos.autoPrintReceipt";

const actionIconClass = cn(
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)]",
  focusRing,
);

const panelShell =
  "flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]";

const menuPanelShell = cn(
  panelShell,
  "max-lg:rounded-b-none max-lg:border-b-0 lg:rounded-r-none lg:border-r-0",
);

const checkoutPanelShell = cn(
  panelShell,
  "max-lg:rounded-t-none lg:rounded-l-none lg:border-l-0",
);

const segmentClass = (active: boolean) =>
  cn(
    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
    focusRing,
    active
      ? "bg-[var(--color-primary)] text-white shadow-sm"
      : "menu-segment-idle",
  );

const checkoutSectionTitle = "text-sm font-semibold text-foreground";
const checkoutSectionGap = "space-y-2";

const chipClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
    focusRing,
    active
      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-nav-active-text)] shadow-sm"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-nav-idle)] hover:border-[var(--color-input)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)]",
  );

function MenuItemCard({
  item,
  qtyInCart,
  onAdd,
}: {
  item: CatalogItem;
  qtyInCart: number;
  onAdd: () => void;
}) {
  const inCart = qtyInCart > 0;
  const stock = item.trackStock ? Number(item.quantityOnHand ?? 0) : null;
  const outOfStock =
    item.trackStock && (!Number.isFinite(stock!) || (stock ?? 0) <= 0);

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-[var(--color-surface)] text-left transition-all",
        outOfStock && "opacity-50",
        inCart
          ? "border-[var(--color-primary)] shadow-sm"
          : "border-[var(--color-border)]",
      )}
    >
      <div className="relative aspect-[5/4] w-full bg-[var(--color-cream-100)]">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/35">
            <UtensilsCrossed className="h-9 w-9" strokeWidth={1.25} />
          </div>
        )}
        {inCart ? (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            ×{qtyInCart % 1 === 0 ? qtyInCart : qtyInCart.toFixed(2)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-foreground">
          {item.name}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <p className="text-sm font-bold tabular-nums text-[var(--color-primary)]">
              {formatMoney(item.sellPricePerUnit)}
            </p>
            {item.trackStock ? (
              <p className="text-[10px] tabular-nums text-muted">
                {outOfStock ? "Out of stock" : `${item.quantityOnHand} left`}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={outOfStock}
            onClick={onAdd}
            aria-label={`Add ${item.name}`}
            className={cn(
              "shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              focusRing,
              outOfStock
                ? "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted)] opacity-50"
                : "border-transparent bg-[var(--color-danger)] text-white hover:bg-[color-mix(in_srgb,var(--color-danger)_88%,#000)]",
            )}
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

function CollapsibleBlock({
  title,
  open,
  onToggle,
  hint,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-[var(--color-border)]">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md py-2 text-left transition-colors hover:bg-[var(--color-cream-100)]/80",
          focusRing,
        )}
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="flex items-center gap-2">
          {hint ? (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                hint === "Required"
                  ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                  : "bg-[var(--color-cream-100)] text-muted",
              )}
            >
              {hint}
            </span>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 text-muted transition-transform duration-200", open && "rotate-180")}
          />
        </span>
      </button>
      {open ? <div className="pb-3 pt-0.5">{children}</div> : null}
    </div>
  );
}

function PosPageContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const diningSessionIdParam = searchParams.get("sessionId");
  const billingFromSession = Boolean(diningSessionIdParam);

  const catalog = useAppSelector((state) => state.referenceData.sellableCatalog);
  const catalogItems = catalog.items;
  const sellableCatalogStatus = useAppSelector((state) => state.referenceData.sellableCatalogStatus);
  const catalogLoading = sellableCatalogStatus === "loading" && catalogItems.length === 0;
  const [posTableOptions, setPosTableOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [serviceType, setServiceType] = useState<"DINE_IN" | "DELIVERY">("DINE_IN");
  const [checkoutPaymentType, setCheckoutPaymentType] =
    useState<CheckoutPaymentType>("FULLY_PAID");
  const [paidAmountStr, setPaidAmountStr] = useState("");
  const [tenderMode, setTenderMode] = useState<"CASH" | "BANK" | "SPLIT">("CASH");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [otherChargeStr, setOtherChargeStr] = useState("");
  const [discountMode, setDiscountMode] = useState<"none" | "amount" | "percent">("none");
  const [discountStr, setDiscountStr] = useState("");
  const [cashPaidStr, setCashPaidStr] = useState("0");
  const [bankPaidStr, setBankPaidStr] = useState("0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [billingLoading, setBillingLoading] = useState(billingFromSession);
  const [sessionTableNames, setSessionTableNames] = useState<string[]>([]);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewSale, setViewSale] = useState<PosSaleReceiptData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [bankQrOpen, setBankQrOpen] = useState(false);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [successSale, setSuccessSale] = useState<{ id: string; receiptNo: string } | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const needsCustomerDetails =
    serviceType === "DELIVERY" ||
    checkoutPaymentType === "CREDIT" ||
    checkoutPaymentType === "PARTIALLY_PAID";

  useEffect(() => {
    if (needsCustomerDetails) {
      setCustomerOpen(true);
    }
  }, [needsCustomerDetails]);

  useEffect(() => {
    setAutoPrintReceipt(localStorage.getItem(AUTO_PRINT_STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    void operationsApi.bankAccounts
      .options()
      .then((items) => {
        setBankAccounts(items);
        if (items.length === 1) {
          setBankAccountId(items[0]!.id);
        }
      })
      .catch(() => setBankAccounts([]));
  }, []);

  const loadPosTableOptions = useCallback(async () => {
    if (billingFromSession) return;
    setTablesError(false);
    setTablesLoading(true);
    try {
      const items = await operationsApi.diningTables.options({ excludeOccupied: true });
      setPosTableOptions(items);
      if (tableId && !items.some((t) => t.id === tableId)) {
        setTableId("");
        appToast.error("Table is no longer available");
      }
    } catch {
      setTablesError(true);
    } finally {
      setTablesLoading(false);
    }
  }, [billingFromSession, tableId]);

  const { printDocument, isPrinting, requestPrint, printLoaded } =
    useThermalPrint<PosSaleReceiptData>({
      onError: (error) =>
        appToast.error(getApiErrorMessage(error, "Failed to load receipt for printing")),
    });

  const toggleAutoPrintReceipt = () => {
    setAutoPrintReceipt((prev) => {
      const next = !prev;
      localStorage.setItem(AUTO_PRINT_STORAGE_KEY, String(next));
      return next;
    });
  };

  const categories = useMemo(
    () => buildCategoryChips(catalog.categories, catalogItems),
    [catalog.categories, catalogItems],
  );

  const catalogSections = useMemo(
    () =>
      buildCatalogSections(catalog.categories, catalogItems, {
        categoryFilter,
        search,
      }),
    [catalog.categories, catalogItems, categoryFilter, search],
  );

  const cartQtyByItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart) {
      map.set(line.menuItemId, line.qty);
    }
    return map;
  }, [cart]);

  const cartTotal = useMemo(() => {
    let t = 0;
    for (const l of cart) {
      const q = Number(l.qty);
      const p = Number(l.unitPrice);
      if (Number.isFinite(q) && Number.isFinite(p) && q > 0 && p >= 0) {
        t += Math.round(q * p * 100) / 100;
      }
    }
    return Math.round(t * 100) / 100;
  }, [cart]);

  const otherChargeResult = useMemo(() => parseMoneyInput(otherChargeStr), [otherChargeStr]);

  const preDiscountTotal = useMemo(() => {
    if (otherChargeResult.invalid) return cartTotal;
    return Math.round((cartTotal + otherChargeResult.amount) * 100) / 100;
  }, [cartTotal, otherChargeResult]);

  const discountPreview = useMemo(() => {
    if (discountMode === "none" || !discountStr.trim()) return 0;
    const parsed = parseMoneyInput(discountStr);
    if (parsed.invalid) return 0;
    if (discountMode === "amount") {
      return Math.min(parsed.amount, preDiscountTotal);
    }
    if (parsed.amount > 100) return preDiscountTotal;
    return Math.round(((preDiscountTotal * parsed.amount) / 100) * 100) / 100;
  }, [discountMode, discountStr, preDiscountTotal]);

  const discountInputInvalid = useMemo(() => {
    if (discountMode === "none" || !discountStr.trim()) return false;
    const parsed = parseMoneyInput(discountStr);
    if (parsed.invalid) return true;
    if (discountMode === "percent" && parsed.amount > 100) return true;
    return false;
  }, [discountMode, discountStr]);

  const grandTotalPreview = Math.max(
    0,
    Math.round((preDiscountTotal - discountPreview) * 100) / 100,
  );

  const cashPaidResult = useMemo(() => parseMoneyInput(cashPaidStr), [cashPaidStr]);
  const bankPaidResult = useMemo(() => parseMoneyInput(bankPaidStr), [bankPaidStr]);

  const paidNowPreview = useMemo(() => {
    if (checkoutPaymentType === "FULLY_PAID") {
      if (tenderMode === "CASH") return cashPaidResult.invalid ? 0 : cashPaidResult.amount;
      if (tenderMode === "BANK") return grandTotalPreview;
      return (cashPaidResult.invalid ? 0 : cashPaidResult.amount) +
        (bankPaidResult.invalid ? 0 : bankPaidResult.amount);
    }
    if (checkoutPaymentType === "CREDIT") return 0;
    const p = parseMoneyInput(paidAmountStr);
    return p.invalid ? 0 : p.amount;
  }, [
    checkoutPaymentType,
    tenderMode,
    cashPaidResult.invalid,
    cashPaidResult.amount,
    bankPaidResult.invalid,
    bankPaidResult.amount,
    grandTotalPreview,
    paidAmountStr,
  ]);

  const creditPreview = useMemo(
    () => Math.max(0, Math.round((grandTotalPreview - paidNowPreview) * 100) / 100),
    [grandTotalPreview, paidNowPreview],
  );

  const paymentValid = useCheckoutPaymentValidation({
    checkoutPaymentType,
    grandTotal: grandTotalPreview,
    paidAmountStr,
    tenderMode,
    cashPaidStr,
    bankPaidStr,
    bankAccountId,
    bankAccountsCount: bankAccounts.length,
  });

  useEffect(() => {
    if (sellableCatalogStatus === "idle") {
      void dispatch(fetchSellableCatalogThunk());
    }
  }, [dispatch, sellableCatalogStatus]);

  useEffect(() => {
    void loadPosTableOptions();
    const id = setInterval(() => void loadPosTableOptions(), 30_000);
    return () => clearInterval(id);
  }, [loadPosTableOptions]);

  const billingHandoffSessionIdRef = useRef<string | null>(null);
  const billingCompletedSessionIdRef = useRef<string | null>(null);

  const hydrateFromBillingHandoff = useCallback(async (sessionId: string) => {
    setBillingLoading(true);
    try {
      const handoff = await operationsApi.tableOrders.billingHandoff(sessionId);
      if (billingCompletedSessionIdRef.current === sessionId) return;
      setServiceType("DINE_IN");
      setTableId(handoff.primaryTableId);
      setSessionTableNames(handoff.tableNames);
      setCart(
        handoff.lines.map((l) => {
          const catalogItem = catalogItems.find((c) => c.id === l.menuItemId);
          const maxQty = catalogItem?.trackStock
            ? Number(catalogItem.quantityOnHand ?? 0)
            : 999_999;
          return {
            key: l.menuItemId,
            menuItemId: l.menuItemId,
            name: l.name,
            unitPrice: l.unitPrice,
            qty: l.quantity,
            maxQty: maxQty > 0 ? maxQty : 999_999,
          };
        }),
      );
    } catch (error) {
      if (billingCompletedSessionIdRef.current === sessionId) return;
      billingHandoffSessionIdRef.current = null;
      appToast.error(getApiErrorMessage(error, "Failed to load table order for billing"));
      router.replace("/table-orders");
    } finally {
      setBillingLoading(false);
    }
  }, [catalogItems, router]);

  useEffect(() => {
    if (!diningSessionIdParam || catalogLoading) return;
    if (billingHandoffSessionIdRef.current === diningSessionIdParam) return;
    billingHandoffSessionIdRef.current = diningSessionIdParam;
    void hydrateFromBillingHandoff(diningSessionIdParam);
  }, [diningSessionIdParam, catalogLoading, hydrateFromBillingHandoff]);

  const handleCancelBilling = async () => {
    if (!diningSessionIdParam) return;
    try {
      await operationsApi.tableOrders.cancelBilling(diningSessionIdParam);
      appToast.success("Billing cancelled — order resumed on Table Menu");
      router.replace("/table-orders");
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to cancel billing"));
    }
  };

  const addToCart = (item: CatalogItem) => {
    const maxQty = item.trackStock ? Number(item.quantityOnHand ?? 0) : 999_999;
    const price = Number(item.sellPricePerUnit);
    setCart((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id);
      if (existing) {
        const nextQty = Math.min(existing.qty + 1, maxQty);
        return prev.map((l) =>
          l.menuItemId === item.id ? { ...l, qty: nextQty } : l,
        );
      }
      return [
        ...prev,
        {
          key: item.id,
          menuItemId: item.id,
          name: item.name,
          unitPrice: price,
          qty: 1,
          maxQty,
        },
      ];
    });
  };

  const updateCartLine = (key: string, patch: Partial<Pick<CartLine, "qty" | "unitPrice">>) => {
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  };

  const removeLine = (key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  };

  const validateCheckout = (): string | null => {
    if (cart.length === 0) return "Add items to the cart";
    for (const l of cart) {
      if (l.qty <= 0 || l.qty > l.maxQty) {
        return `Invalid quantity for ${l.name}`;
      }
    }
    if (otherChargeResult.invalid) return "Invalid other charge";
    if (discountInputInvalid) {
      return discountMode === "percent"
        ? "Discount percent must be between 0 and 100"
        : "Invalid discount amount";
    }
    if (discountMode !== "none" && discountStr.trim() && discountPreview <= 0) {
      return "Enter a discount greater than zero";
    }

    const name = customerName.trim();
    const phone = normalizePhone(customerPhone);
    const email = customerEmail.trim();
    const address = customerAddress.trim();

    if (phone && !name) return "Customer name is required when phone is provided";
    if (phone && !/^9\d{9}$/.test(phone)) {
      return "Phone number must be 10 digits and start with 9";
    }

    if (serviceType === "DELIVERY") {
      if (!name || !phone || !address) {
        return "Delivery requires customer name, phone, and delivery address";
      }
    }

    if (
      checkoutPaymentType === "CREDIT" ||
      checkoutPaymentType === "PARTIALLY_PAID"
    ) {
      if (!phone || !name || !address) {
        return "Credit sales require customer name, phone, and address";
      }
      if (!email) {
        return "Email is required for credit and partial payment sales";
      }
    }

    if (!paymentValid) {
      return "Complete payment details";
    }

    return null;
  };

  const resetCheckout = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setOtherChargeStr("");
    setDiscountMode("none");
    setDiscountStr("");
    setNotes("");
    setCashPaidStr("0");
    setBankPaidStr("0");
    setCheckoutPaymentType("FULLY_PAID");
    setPaidAmountStr("");
    setTenderMode("CASH");
    setBankAccountId(bankAccounts[0]?.id ?? "");
    setTableId("");
  };

  const onCheckout = async () => {
    const err = validateCheckout();
    if (err) {
      appToast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const paidResult = parseMoneyInput(paidAmountStr);
      const paidAmount =
        checkoutPaymentType === "CREDIT"
            ? 0
            : checkoutPaymentType === "FULLY_PAID"
              ? paidNowPreview
              : paidResult.invalid
                ? 0
                : paidResult.amount;

      const initialPayments = buildInitialPaymentsFromCheckout({
        checkoutPaymentType,
        grandTotal: grandTotalPreview,
        paidAmount,
        tenderMode,
        cashPaid: cashPaidResult.amount,
        bankPaid: bankPaidResult.amount,
        bankAccountId,
      });

      const result = await operationsApi.sales.create({
        serviceType,
        checkoutPaymentType,
        ...(initialPayments.length > 0 ? { initialPayments } : {}),
        ...(serviceType === "DINE_IN" && tableId ? { tableId } : {}),
        ...(diningSessionIdParam ? { diningSessionId: diningSessionIdParam } : {}),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        otherChargeAmount: otherChargeResult.amount,
        ...(discountMode === "amount" && discountPreview > 0
          ? { discountAmount: discountPreview }
          : {}),
        ...(discountMode === "percent" && discountPreview > 0
          ? { discountPercent: parseMoneyInput(discountStr).amount }
          : {}),
        notes: notes.trim() || undefined,
        lines: cart.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.qty,
          unitPrice: l.unitPrice,
        })),
      });
      const creditMsg =
        creditPreview > 0.005 ? ` · Credit due: ${formatMoney(creditPreview)}` : "";
      appToast.success(`Sale ${result.receiptNo} recorded${creditMsg}`);
      if (billingFromSession && diningSessionIdParam) {
        billingCompletedSessionIdRef.current = diningSessionIdParam;
        invalidateGetCache("/table-orders");
        setSessionTableNames([]);
        router.replace("/pos");
      }
      setSuccessSale({ id: result.id, receiptNo: result.receiptNo });
      if (localStorage.getItem(AUTO_PRINT_STORAGE_KEY) === "true") {
        void requestPrint(() => fetchSaleDetail(result.id));
      }
      resetCheckout();
      void dispatch(fetchSellableCatalogThunk({ force: true }));
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to complete sale"));
    } finally {
      setSubmitting(false);
    }
  };

  const fetchSaleDetail = async (id: string) => {
    const detail = await operationsApi.sales.getOne(id);
    return detail as PosSaleReceiptData;
  };

  const openView = async (id: string) => {
    setViewLoading(true);
    setViewSale(null);
    setViewOpen(true);
    try {
      setViewSale(await fetchSaleDetail(id));
    } catch (error) {
      setViewOpen(false);
      appToast.error(getApiErrorMessage(error, "Failed to load sale"));
    } finally {
      setViewLoading(false);
    }
  };

  const handlePrint = (id: string) => {
    void requestPrint(() => fetchSaleDetail(id));
  };

  const scrollToCheckout = () => {
    document.getElementById("pos-checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className={cn(
        "page-shell safe-bottom flex flex-col pb-24 lg:h-full lg:min-h-0 lg:overflow-hidden lg:pb-0",
        cart.length > 0 && "max-lg:pb-36",
      )}
    >
      {billingFromSession ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-400/40 bg-sky-50/80 px-3 py-2 dark:bg-sky-950/30">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Billing table order
              {sessionTableNames.length > 0
                ? ` — ${sessionTableNames.join(" + ")}`
                : ""}
            </p>
            <p className="text-xs text-muted">
              Table assignment is locked · adjust items and payment below
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={billingLoading || submitting}
            onClick={() => void handleCancelBilling()}
          >
            Cancel billing
          </Button>
        </div>
      ) : null}

      <div className="mb-2 flex shrink-0 flex-wrap items-start justify-between gap-2 sm:items-center">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">POS</h1>
          <p className="mt-0.5 text-xs text-muted">
            {billingFromSession
              ? "Complete payment for the table order"
              : "Menu and checkout on one screen"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => router.push("/table-orders")}
          >
            <span className="inline-flex items-center gap-1.5">
              <UtensilsCrossed size={15} strokeWidth={1.75} aria-hidden />
              Table orders
            </span>
          </Button>
          {!billingFromSession ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => router.push("/invoices")}
            >
              <span className="inline-flex items-center gap-1.5">
                <FileText size={15} strokeWidth={1.75} aria-hidden />
                Invoices
              </span>
            </Button>
          ) : null}
          {successSale ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/8 px-3 py-1.5 text-sm shadow-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
            <span>
              <span className="font-mono font-semibold">{successSale.receiptNo}</span> saved
            </span>
            <Button type="button" size="sm" variant="ghost" onClick={() => void openView(successSale.id)}>
              <span className="inline-flex items-center gap-1.5">
                <Eye size={15} strokeWidth={1.75} aria-hidden />
                View
              </span>
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => void handlePrint(successSale.id)}>
              <span className="inline-flex items-center gap-1.5">
                <Printer size={15} strokeWidth={1.75} aria-hidden />
                Print
              </span>
            </Button>
            <button
              type="button"
              className="text-xs text-muted hover:text-foreground"
              onClick={() => setSuccessSale(null)}
            >
              Dismiss
            </button>
          </div>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 shrink-0 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] xl:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)]">
          {/* Menu — toolbar fixed, catalog scrolls */}
          <div className={cn(menuPanelShell, "flex min-h-0 flex-col")}>
            <div className="shrink-0 space-y-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-3 py-1.5">
              <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                placeholder="Search menu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={() => setCategoryFilter("")} className={chipClass(!categoryFilter)}>
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryFilter(c.id)}
                    className={chipClass(categoryFilter === c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2 pt-1 [scrollbar-gutter:stable]">
            {catalogLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted">
                <div className="h-6 w-6 animate-pulse rounded-full bg-[var(--color-cream-200)]" />
                <p className="text-sm">Loading menu…</p>
              </div>
            ) : catalogItems.length === 0 ? (
              <EmptyState title="No items" description="No sellable stock." />
            ) : (
              <div className="space-y-5">
                {catalogSections.map((section) => (
                  <section key={section.id}>
                    {section.title ? (
                      <h2 className="mb-2.5 text-xs font-semibold text-foreground">{section.title}</h2>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {section.items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          qtyInCart={cartQtyByItemId.get(item.id) ?? 0}
                          onAdd={() => addToCart(item)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
          </div>

          {/* Checkout — body scrolls vertically; total + Bill stay pinned */}
          <div id="pos-checkout" className={cn(checkoutPanelShell, "flex min-h-0 flex-col scroll-mt-4")}>
            <div className="flex shrink-0 items-center border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-3 py-1.5">
              <h2 className="text-sm font-semibold text-foreground">Checkout</h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 [scrollbar-gutter:stable]">
              <div className="space-y-3">
              <section className={checkoutSectionGap}>
                <h3 className={checkoutSectionTitle}>How is this order?</h3>
                <div className="space-y-2">
                  {!billingFromSession ? (
                    <div>
                      <p className="mb-1 text-xs text-muted">Service</p>
                      <div className="flex gap-1 rounded-lg bg-[var(--color-cream-100)] p-1">
                        <button
                          type="button"
                          className={segmentClass(serviceType === "DINE_IN")}
                          onClick={() => {
                            setServiceType("DINE_IN");
                            void loadPosTableOptions();
                          }}
                        >
                          <UtensilsCrossed className="h-4 w-4" />
                          Dine in
                        </button>
                        <button
                          type="button"
                          className={segmentClass(serviceType === "DELIVERY")}
                          onClick={() => {
                            setServiceType("DELIVERY");
                            setTableId("");
                          }}
                        >
                          <Truck className="h-4 w-4" />
                          Delivery
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {serviceType === "DINE_IN" || billingFromSession ? (
                    <div>
                      <p className="mb-1 text-xs text-muted">Table</p>
                      {billingFromSession ? (
                        billingLoading ? (
                          <p className="text-xs text-muted">Loading table…</p>
                        ) : (
                          <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-cream-50)] px-2.5 py-2 text-sm font-medium">
                            {sessionTableNames.length > 0
                              ? sessionTableNames.join(", ")
                              : posTableOptions.find((t) => t.id === tableId)?.name ?? "—"}
                          </p>
                        )
                      ) : tablesLoading ? (
                        <p className="text-xs text-muted">Loading tables…</p>
                      ) : tablesError ? (
                        <div className="space-y-1">
                          <p className="text-xs text-[var(--color-danger)]">Could not load tables</p>
                          <button
                            type="button"
                            className="text-xs font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                            onClick={() => void loadPosTableOptions()}
                          >
                            Try again
                          </button>
                        </div>
                      ) : posTableOptions.length === 0 ? (
                        <p className="text-xs tone-warning-text">
                          No tables set up. Ask a manager to add tables in the Tables menu.
                        </p>
                      ) : (
                        <Select
                          searchable
                          value={tableId}
                          onChange={(e) => setTableId(e.target.value)}
                        >
                          <option value="">Select table</option>
                          {posTableOptions.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className={checkoutSectionGap}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className={checkoutSectionTitle}>Items</h3>
                  {cart.length > 0 ? (
                    <span className="text-xs text-muted">
                      {cart.length} line{cart.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-cream-50)]/50 px-4 py-10 text-center">
                <ShoppingCart className="mx-auto h-8 w-8 text-muted/70" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-foreground">No items yet</p>
                <p className="mt-1 text-xs text-muted">Use Add on each dish in the menu to add them here</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {cart.map((line) => {
                  const over = line.qty > line.maxQty;
                  const lineTotal = Math.round(line.qty * line.unitPrice * 100) / 100;
                  return (
                    <li
                      key={line.key}
                      className={cn(
                        "rounded-xl border p-3 transition-colors",
                        over
                          ? "border-red-300/60 bg-red-500/5"
                          : "border-[var(--color-border)] bg-[var(--color-surface)]",
                      )}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2">
                          <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
                            {line.name}
                          </p>
                          <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                            {formatMoney(lineTotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className={actionIconClass}
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[11px] text-muted">Quantity</label>
                            <div className="flex items-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                              <button
                                type="button"
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center text-muted hover:bg-[var(--color-cream-100)]",
                                  focusRing,
                                )}
                                onClick={() =>
                                  updateCartLine(line.key, {
                                    qty: Math.max(0.01, Math.round((line.qty - 1) * 100) / 100),
                                  })
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <NumberInput
                                min={0.01}
                                fullWidth={false}
                                className="h-9 w-full min-w-0 rounded-none border-0 px-1 text-center"
                                value={roundMoneyStr(line.qty)}
                                onValueChange={(value) => {
                                  const qty = Number(value);
                                  if (Number.isFinite(qty)) {
                                    updateCartLine(line.key, { qty });
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center text-muted hover:bg-[var(--color-cream-100)]",
                                  focusRing,
                                )}
                                onClick={() =>
                                  updateCartLine(line.key, {
                                    qty: Math.min(
                                      line.maxQty,
                                      Math.round((line.qty + 1) * 100) / 100,
                                    ),
                                  })
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] text-muted">Unit price</label>
                            <NumberInput
                              min={0}
                              className="h-9 font-mono tabular-nums"
                              value={roundMoneyStr(line.unitPrice)}
                              onValueChange={(value) => {
                                const unitPrice = Number(value);
                                if (Number.isFinite(unitPrice)) {
                                  updateCartLine(line.key, { unitPrice });
                                }
                              }}
                              aria-label={`Unit price for ${line.name}`}
                            />
                          </div>
                        </div>
                        {over ? (
                          <p className="text-xs text-red-600">Only {line.maxQty} in stock</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
              </section>

              <section className={checkoutSectionGap}>
                <h3 className={checkoutSectionTitle}>
                  {serviceType === "DELIVERY" ? "Delivery fee" : "Extra charges"}
                </h3>
                <NumberInput
                  id="pos-other-charge"
                  min={0}
                  value={otherChargeStr}
                  onValueChange={setOtherChargeStr}
                  placeholder="0.00"
                  className="h-10"
                />
              </section>

              <section className={checkoutSectionGap}>
                <h3 className={checkoutSectionTitle}>Discount (optional)</h3>
                <div className="flex gap-1 rounded-lg bg-[var(--color-cream-100)] p-1">
                  <button
                    type="button"
                    className={segmentClass(discountMode === "none")}
                    onClick={() => {
                      setDiscountMode("none");
                      setDiscountStr("");
                    }}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    className={segmentClass(discountMode === "amount")}
                    onClick={() => setDiscountMode("amount")}
                  >
                    Amount
                  </button>
                  <button
                    type="button"
                    className={segmentClass(discountMode === "percent")}
                    onClick={() => setDiscountMode("percent")}
                  >
                    Percent
                  </button>
                </div>
                {discountMode !== "none" ? (
                  <div>
                    <NumberInput
                      min={0}
                      max={discountMode === "percent" ? 100 : undefined}
                      value={discountStr}
                      onValueChange={setDiscountStr}
                      placeholder={discountMode === "percent" ? "e.g. 10" : "0.00"}
                      className="h-10"
                      aria-label={
                        discountMode === "percent" ? "Discount percent" : "Discount amount"
                      }
                    />
                    {discountInputInvalid ? (
                      <p className="mt-1 text-xs text-red-600">
                        {discountMode === "percent"
                          ? "Enter a percent from 0 to 100"
                          : "Enter a valid discount amount"}
                      </p>
                    ) : discountPreview > 0 ? (
                      <p className="mt-1 text-xs text-muted">
                        Discount: −{formatMoney(discountPreview)}
                        {discountMode === "percent" && discountStr.trim()
                          ? ` (${discountStr.trim()}%)`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section className={checkoutSectionGap}>
                <h3 className={checkoutSectionTitle}>Summary</h3>
                <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2 text-muted">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums">{formatMoney(cartTotal)}</span>
                    </div>
                    {!otherChargeResult.invalid && otherChargeResult.amount > 0 ? (
                      <div className="flex justify-between gap-2 text-muted">
                        <span>{serviceType === "DELIVERY" ? "Delivery" : "Extra"}</span>
                        <span className="font-mono tabular-nums">
                          {formatMoney(otherChargeResult.amount)}
                        </span>
                      </div>
                    ) : null}
                    {discountPreview > 0 ? (
                      <div className="flex justify-between gap-2 text-muted">
                        <span>Discount</span>
                        <span className="font-mono tabular-nums">−{formatMoney(discountPreview)}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-[var(--color-primary)]/15 pt-3">
                    <span className="text-sm font-medium text-foreground">Total due</span>
                    <span className="font-mono text-2xl font-bold tabular-nums text-[var(--color-primary)]">
                      {formatMoney(grandTotalPreview)}
                    </span>
                  </div>
                </div>
              </section>

              <section className={checkoutSectionGap}>
                <h3 className={checkoutSectionTitle}>Payment</h3>
                <PosCheckoutPaymentSection
                  grandTotal={grandTotalPreview}
                  checkoutPaymentType={checkoutPaymentType}
                  onCheckoutPaymentTypeChange={setCheckoutPaymentType}
                  paidAmountStr={paidAmountStr}
                  onPaidAmountStrChange={setPaidAmountStr}
                  tenderMode={tenderMode}
                  onTenderModeChange={setTenderMode}
                  cashPaidStr={cashPaidStr}
                  onCashPaidStrChange={setCashPaidStr}
                  bankPaidStr={bankPaidStr}
                  onBankPaidStrChange={setBankPaidStr}
                  bankAccountId={bankAccountId}
                  onBankAccountIdChange={setBankAccountId}
                  bankAccounts={bankAccounts}
                  onViewBankQr={() => setBankQrOpen(true)}
                  disabled={submitting || otherChargeResult.invalid || grandTotalPreview <= 0}
                />
              </section>

              <section className={checkoutSectionGap}>
                <CollapsibleBlock
                  title="Customer details"
                  open={customerOpen}
                  onToggle={() => setCustomerOpen((o) => !o)}
                  hint={needsCustomerDetails ? "Required" : "Optional"}
                >
                  <div className="grid gap-3">
                    <Input
                      placeholder="Customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Phone number"
                      inputMode="numeric"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      onKeyDown={(e) => {
                        const controlKeys = new Set([
                          "Backspace",
                          "Delete",
                          "Tab",
                          "ArrowLeft",
                          "ArrowRight",
                          "Home",
                          "End",
                        ]);
                        if (controlKeys.has(e.key) || e.ctrlKey || e.metaKey) {
                          return;
                        }
                        if (!/^\d$/.test(e.key)) {
                          e.preventDefault();
                          return;
                        }
                        if (customerPhone.length >= 10) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                        const next = `${customerPhone}${pasted}`.slice(0, 10);
                        setCustomerPhone(next);
                      }}
                    />
                    <Input
                      placeholder={
                        serviceType === "DELIVERY"
                          ? "Delivery address"
                          : checkoutPaymentType === "CREDIT" || checkoutPaymentType === "PARTIALLY_PAID"
                            ? "Address"
                            : "Address (optional)"
                      }
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder={
                        checkoutPaymentType === "CREDIT" || checkoutPaymentType === "PARTIALLY_PAID"
                          ? "Email"
                          : "Email (optional)"
                      }
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </CollapsibleBlock>
              </section>

              <section className={checkoutSectionGap}>
                <h3 className={checkoutSectionTitle}>Notes</h3>
                <Input
                  className="h-10"
                  placeholder="Optional note for this sale"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </section>
              </div>
            </div>

            <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-cream-50)]/60 px-3 py-2.5">
            <label className="mb-2 flex cursor-pointer items-start gap-2 text-[10px] text-muted">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={autoPrintReceipt}
                onChange={toggleAutoPrintReceipt}
              />
              <span>
                Auto-print receipt after checkout. Use an 80mm thermal printer and disable
                headers/footers in the print dialog.
              </span>
            </label>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Total</p>
                <p className="font-mono text-lg font-bold leading-tight tabular-nums text-[var(--color-primary)]">
                  {formatMoney(grandTotalPreview)}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-9 shrink-0 px-6 font-semibold"
                disabled={submitting || cart.length === 0 || isPrinting}
                onClick={() => void onCheckout()}
              >
                {submitting ? "…" : "Bill"}
              </Button>
            </div>
            </div>
          </div>
        </div>

        {cart.length > 0 ? (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm safe-bottom lg:hidden">
            <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <ShoppingCart className="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs text-[var(--color-muted)]">
                    {cart.length} item{cart.length === 1 ? "" : "s"}
                  </p>
                  <p className="truncate font-mono text-base font-semibold tabular-nums text-[var(--color-primary)]">
                    {formatMoney(grandTotalPreview)}
                  </p>
                </div>
              </div>
              <Button type="button" size="sm" className="h-11 shrink-0 px-5" onClick={scrollToCheckout}>
                Checkout
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={bankQrOpen}
        size="md"
        title="Bank QR image"
        description={bankAccounts.find((b) => b.id === bankAccountId)?.label ?? "Selected bank account"}
        onClose={() => setBankQrOpen(false)}
      >
        {bankAccounts.find((b) => b.id === bankAccountId)?.qrImageUrl ? (
          <img
            src={bankAccounts.find((b) => b.id === bankAccountId)?.qrImageUrl ?? ""}
            alt="Bank payment QR"
            className="max-h-[70vh] w-full rounded-lg border border-[var(--color-border)] object-contain bg-[var(--color-surface-muted)]"
          />
        ) : (
          <p className="text-sm text-muted">No QR image available for this bank account.</p>
        )}
      </Modal>

      <Modal
        open={viewOpen}
        size="lg"
        title="Sale details"
        description={
          viewSale
            ? `${viewSale.receiptNo} · ${formatDateTime(viewSale.saleAt)}`
            : "Loading sale…"
        }
        onClose={() => {
          if (!viewLoading) {
            setViewOpen(false);
            setViewSale(null);
          }
        }}
      >
        <div className="space-y-5">
          {viewLoading ? (
            <ViewModalSkeleton rows={3} />
          ) : viewSale ? (
            <PosSaleDetail
              sale={viewSale}
              onSaleUpdated={(updated) => {
                setViewSale(updated);
              }}
              onNavigateAway={() => {
                setViewOpen(false);
                setViewSale(null);
              }}
            />
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setViewOpen(false);
                setViewSale(null);
              }}
              disabled={viewLoading}
            >
              Close
            </Button>
            {viewSale?.id ? (
              <Button
                type="button"
                disabled={isPrinting}
                onClick={() => printLoaded(viewSale)}
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Print receipt
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      <ThermalPrintHost open={printDocument != null}>
        {printDocument ? (
          <PosSaleReceipt sale={printDocument} id="pos-sale-receipt-print" />
        ) : null}
      </ThermalPrintHost>
    </section>
  );
}

export default function PosPage() {
  return (
    <Suspense fallback={<section className="page-shell page-content p-6 text-sm text-muted">Loading POS…</section>}>
      <PosPageContent />
    </Suspense>
  );
}
