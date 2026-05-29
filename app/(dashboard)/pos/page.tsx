"use client";

import {
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Split,
  Trash2,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PosSaleDetail } from "@/src/components/sales/pos-sale-detail";
import {
  PosSaleReceipt,
  type PosSaleReceiptData,
} from "@/src/components/sales/pos-sale-receipt";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
} from "@/src/components/ui/table";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { formatDateTime, formatMoney } from "@/src/lib/format-display";
import { normalizePhone } from "@/src/lib/phone-normalize";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

type CatalogItem = {
  id: string;
  name: string;
  categoryName: string;
  imageUrl?: string | null;
  quantityOnHand: string;
  sellPricePerUnit: string;
};

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

type PaymentPreset = "CASH" | "BANK" | "BOTH";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

const actionIconClass = cn(
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)]",
  focusRing,
);

const panelShell =
  "flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]";

const segmentClass = (active: boolean) =>
  cn(
    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
    focusRing,
    active
      ? "bg-[var(--color-primary)] text-white shadow-sm"
      : "text-muted hover:bg-[var(--color-cream-100)] hover:text-foreground",
  );

const checkoutSectionTitle = "text-sm font-semibold text-foreground";
const checkoutSectionGap = "space-y-3";

const chipClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
    focusRing,
    active
      ? "bg-[var(--color-primary)] text-white shadow-sm"
      : "bg-[var(--color-cream-100)] text-muted hover:bg-[var(--color-cream-200)] hover:text-foreground",
  );

const paymentPresetClass = (active: boolean) =>
  cn(
    "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-colors",
    focusRing,
    active
      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-muted hover:border-[var(--color-primary)]/30",
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
  const stock = Number(item.quantityOnHand);
  const outOfStock = !Number.isFinite(stock) || stock <= 0;

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={onAdd}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-[var(--color-surface)] text-left transition-all",
        focusRing,
        outOfStock
          ? "cursor-not-allowed opacity-50"
          : "hover:shadow-md active:scale-[0.99]",
        inCart
          ? "border-[var(--color-primary)] shadow-sm"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/35",
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
        <div className="mt-auto flex items-center justify-between gap-1">
          <span className="text-sm font-bold tabular-nums text-[var(--color-primary)]">
            {formatMoney(item.sellPricePerUnit)}
          </span>
          <span className="text-[10px] tabular-nums text-muted">
            {outOfStock ? "Out of stock" : `${item.quantityOnHand} left`}
          </span>
        </div>
      </div>
    </button>
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
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
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

export default function PosPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [serviceFilter, setServiceFilter] = useState<"" | "DINE_IN" | "DELIVERY">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [serviceType, setServiceType] = useState<"DINE_IN" | "DELIVERY">("DINE_IN");
  const [billingType, setBillingType] = useState<"PAID" | "CREDIT">("PAID");
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

  const [viewOpen, setViewOpen] = useState(false);
  const [viewSale, setViewSale] = useState<PosSaleReceiptData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [printSale, setPrintSale] = useState<PosSaleReceiptData | null>(null);
  const printAfterRender = useRef(false);
  const [successSale, setSuccessSale] = useState<{ id: string; receiptNo: string } | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const needsCustomerDetails =
    serviceType === "DELIVERY" || billingType === "CREDIT";

  useEffect(() => {
    if (needsCustomerDetails) {
      setCustomerOpen(true);
    }
  }, [needsCustomerDetails]);

  const categories = useMemo(() => {
    const set = new Set(catalog.map((c) => c.categoryName));
    return [...set].sort();
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    let items = catalog;
    if (categoryFilter) {
      items = items.filter((c) => c.categoryName === categoryFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q));
    }
    return items;
  }, [catalog, categoryFilter, search]);

  const cartQtyByItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart) {
      map.set(line.menuItemId, line.qty);
    }
    return map;
  }, [cart]);

  const showGroupedMenu = !categoryFilter && !search.trim();

  const catalogSections = useMemo(() => {
    if (!showGroupedMenu) {
      return [["", filteredCatalog] as const];
    }
    const map = new Map<string, CatalogItem[]>();
    for (const item of filteredCatalog) {
      const list = map.get(item.categoryName) ?? [];
      list.push(item);
      map.set(item.categoryName, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredCatalog, showGroupedMenu]);

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

  useEffect(() => {
    if (billingType === "PAID") {
      setCashPaidStr(String(grandTotalPreview));
      setBankPaidStr("0");
    }
  }, [grandTotalPreview, billingType]);

  const cashPaidResult = useMemo(() => parseMoneyInput(cashPaidStr), [cashPaidStr]);
  const bankPaidResult = useMemo(() => parseMoneyInput(bankPaidStr), [bankPaidStr]);

  const creditPreview = useMemo(() => {
    if (otherChargeResult.invalid || cashPaidResult.invalid || bankPaidResult.invalid) {
      return 0;
    }
    return (
      Math.round((grandTotalPreview - cashPaidResult.amount - bankPaidResult.amount) * 100) / 100
    );
  }, [
    grandTotalPreview,
    cashPaidResult,
    bankPaidResult,
    otherChargeResult.invalid,
  ]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const data = await operationsApi.sales.sellableCatalog();
      setCatalog(data);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load menu"));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadSales = useCallback(async () => {
    try {
      const data = await operationsApi.sales.list({
        limit: 50,
        serviceType: serviceFilter || undefined,
      });
      setSales(
        data.items.map((s) => ({
          id: s.id,
          receiptNo: s.receiptNo,
          saleAt: s.saleAt,
          serviceType: s.serviceType,
          billingType: s.billingType,
          customerPhone: s.customerPhone,
          grandTotal: s.grandTotal,
          cashPaidAmount: s.cashPaidAmount,
          bankPaidAmount: s.bankPaidAmount,
          creditAmount: s.creditAmount,
        })),
      );
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load sales"));
    }
  }, [serviceFilter]);

  useEffect(() => {
    void loadCatalog();
    void loadSales();
  }, [loadCatalog, loadSales]);

  const addToCart = (item: CatalogItem) => {
    const maxQty = Number(item.quantityOnHand);
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
    const address = customerAddress.trim();

    if (phone && !name) return "Customer name is required when phone is provided";

    if (serviceType === "DELIVERY") {
      if (!name || !phone || !address) {
        return "Delivery requires customer name, phone, and delivery address";
      }
    }

    if (billingType === "CREDIT") {
      if (!phone || !name || !address) {
        return "Credit sales require customer name, phone, and address";
      }
      if (creditPreview <= 0) {
        return "Credit billing requires a credit balance; use Paid if fully collected";
      }
      if (cashPaidResult.amount + bankPaidResult.amount > grandTotalPreview + 0.005) {
        return "Cash and bank cannot exceed the grand total";
      }
    } else {
      if (creditPreview > 0.005) {
        return "Paid sales must have no credit balance";
      }
      if (
        Math.round((cashPaidResult.amount + bankPaidResult.amount) * 100) !==
        Math.round(grandTotalPreview * 100)
      ) {
        return "Cash and bank must add up to the grand total";
      }
    }

    if (cashPaidResult.invalid || bankPaidResult.invalid) {
      return "Invalid payment amounts";
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
  };

  const onCheckout = async () => {
    const err = validateCheckout();
    if (err) {
      appToast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const result = await operationsApi.sales.create({
        serviceType,
        billingType,
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
        cashPaidAmount: cashPaidResult.amount,
        bankPaidAmount: bankPaidResult.amount,
        notes: notes.trim() || undefined,
        lines: cart.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.qty,
          unitPrice: l.unitPrice,
        })),
      });
      appToast.success(`Sale ${result.receiptNo} recorded`);
      setSuccessSale({ id: result.id, receiptNo: result.receiptNo });
      resetCheckout();
      void loadCatalog();
      void loadSales();
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

  const handlePrint = async (id: string) => {
    try {
      const detail = await fetchSaleDetail(id);
      printAfterRender.current = true;
      setPrintSale(detail);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load receipt for printing"));
    }
  };

  useEffect(() => {
    if (!printSale || !printAfterRender.current) return;
    printAfterRender.current = false;
    const timer = window.setTimeout(() => {
      window.print();
      setPrintSale(null);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [printSale]);

  const roundMoneyStr = (n: number) => String(Math.round(Math.max(0, n) * 100) / 100);

  const setAllCashPayment = () => {
    setCashPaidStr(roundMoneyStr(grandTotalPreview));
    setBankPaidStr("0");
  };

  const setAllBankPayment = () => {
    setCashPaidStr("0");
    setBankPaidStr(roundMoneyStr(grandTotalPreview));
  };

  /** Paid: 50% cash + 50% bank. Credit: 50% of total paid now, split cash/bank; rest on credit. */
  const setSplitHalfPayment = () => {
    if (billingType === "CREDIT") {
      const paidNow = Math.floor((grandTotalPreview * 100) / 2) / 100;
      const cashHalf = Math.floor((paidNow * 100) / 2) / 100;
      const bankHalf = Math.round((paidNow - cashHalf) * 100) / 100;
      setCashPaidStr(roundMoneyStr(cashHalf));
      setBankPaidStr(roundMoneyStr(bankHalf));
      return;
    }
    const cashHalf = Math.floor((grandTotalPreview * 100) / 2) / 100;
    const bankHalf = Math.round((grandTotalPreview - cashHalf) * 100) / 100;
    setCashPaidStr(roundMoneyStr(cashHalf));
    setBankPaidStr(roundMoneyStr(bankHalf));
  };

  const detectedPaymentPreset = useMemo((): PaymentPreset | "CUSTOM" => {
    if (otherChargeResult.invalid || grandTotalPreview <= 0) return "CUSTOM";
    const cash = cashPaidResult.amount;
    const bank = bankPaidResult.amount;
    const sum = Math.round((cash + bank) * 100);
    const grand = Math.round(grandTotalPreview * 100);
    if (sum !== grand) return "CUSTOM";
    if (bank < 0.005) return "CASH";
    if (cash < 0.005) return "BANK";
    const half = Math.floor(grand / 2);
    if (Math.round(cash * 100) === half && Math.round(bank * 100) === grand - half) {
      return "BOTH";
    }
    if (cash > 0.005 && bank > 0.005) return "BOTH";
    return "CUSTOM";
  }, [
    cashPaidResult.amount,
    bankPaidResult.amount,
    grandTotalPreview,
    otherChargeResult.invalid,
  ]);

  const paymentCollected = cashPaidResult.amount + bankPaidResult.amount;
  const paymentRemainder =
    billingType === "PAID"
      ? grandTotalPreview - paymentCollected
      : creditPreview;
  const paymentBalanced =
    billingType === "PAID"
      ? Math.abs(paymentRemainder) < 0.005
      : creditPreview > 0 && paymentCollected <= grandTotalPreview + 0.005;

  const fillBankFromCash = () => {
    const c = parseMoneyInput(cashPaidStr);
    if (c.invalid) return;
    setBankPaidStr(roundMoneyStr(grandTotalPreview - c.amount));
  };

  const fillCashFromBank = () => {
    const b = parseMoneyInput(bankPaidStr);
    if (b.invalid) return;
    setCashPaidStr(roundMoneyStr(grandTotalPreview - b.amount));
  };

  return (
    <section className="page-shell flex flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">POS</h1>
          <p className="text-[11px] text-muted">
            Menu and checkout stay on screen · scroll the page for recent sales
          </p>
        </div>
        {successSale ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/8 px-3 py-1.5 text-sm shadow-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
            <span>
              <span className="font-mono font-semibold">{successSale.receiptNo}</span> saved
            </span>
            <Button type="button" size="sm" variant="ghost" onClick={() => void openView(successSale.id)}>
              View
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => void handlePrint(successSale.id)}>
              Print
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

      <div className="flex h-[calc(100dvh-6.5rem)] shrink-0 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] xl:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)]">
          {/* Menu — scrolls inside pane */}
          <div className={cn(panelShell, "min-h-0")}>
          <div className="shrink-0 space-y-2 border-b border-[var(--color-border)] px-3 py-2.5">
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
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                <button type="button" onClick={() => setCategoryFilter("")} className={chipClass(!categoryFilter)}>
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoryFilter(c)}
                    className={chipClass(categoryFilter === c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-gutter:stable]">
            {catalogLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted">
                <div className="h-6 w-6 animate-pulse rounded-full bg-[var(--color-cream-200)]" />
                <p className="text-sm">Loading menu…</p>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <EmptyState title="No items" description="No sellable stock." />
            ) : (
              <div className="space-y-5">
                {catalogSections.map(([category, items]) => (
                  <section key={category || "all"}>
                    {showGroupedMenu && category ? (
                      <h2 className="mb-2.5 text-xs font-semibold text-foreground">{category}</h2>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {items.map((item) => (
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

          {/* Checkout — middle scrolls; total + Bill always visible */}
          <div className={cn(panelShell, "min-h-0")}>
          <div className="shrink-0 border-b border-[var(--color-border)] px-3 py-2">
            <h2 className="text-sm font-semibold text-foreground">Checkout</h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
            <div className="space-y-6">
              <section className={checkoutSectionGap}>
                <h3 className={checkoutSectionTitle}>How is this order?</h3>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1.5 text-xs text-muted">Service</p>
                    <div className="flex gap-1 rounded-lg bg-[var(--color-cream-100)] p-1">
                      <button
                        type="button"
                        className={segmentClass(serviceType === "DINE_IN")}
                        onClick={() => setServiceType("DINE_IN")}
                      >
                        <UtensilsCrossed className="h-4 w-4" />
                        Dine in
                      </button>
                      <button
                        type="button"
                        className={segmentClass(serviceType === "DELIVERY")}
                        onClick={() => setServiceType("DELIVERY")}
                      >
                        <Truck className="h-4 w-4" />
                        Delivery
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs text-muted">Payment type</p>
                    <div className="flex gap-1 rounded-lg bg-[var(--color-cream-100)] p-1">
                      <button
                        type="button"
                        className={segmentClass(billingType === "PAID")}
                        onClick={() => setBillingType("PAID")}
                      >
                        Paid now
                      </button>
                      <button
                        type="button"
                        className={segmentClass(billingType === "CREDIT")}
                        onClick={() => setBillingType("CREDIT")}
                      >
                        On credit
                      </button>
                    </div>
                  </div>
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
                <p className="mt-1 text-xs text-muted">Tap dishes on the left to add them here</p>
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
                              <Input
                                type="number"
                                min={0.01}
                                step="0.01"
                                fullWidth={false}
                                className="h-9 w-full min-w-0 rounded-none border-0 px-1 text-center"
                                value={line.qty}
                                onChange={(e) =>
                                  updateCartLine(line.key, { qty: Number(e.target.value) })
                                }
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
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="h-9 font-mono tabular-nums"
                              value={line.unitPrice}
                              onChange={(e) =>
                                updateCartLine(line.key, { unitPrice: Number(e.target.value) })
                              }
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
                <Input
                  id="pos-other-charge"
                  type="number"
                  min={0}
                  step="0.01"
                  value={otherChargeStr}
                  onChange={(e) => setOtherChargeStr(e.target.value)}
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
                    <Input
                      type="number"
                      min={0}
                      max={discountMode === "percent" ? 100 : undefined}
                      step={discountMode === "percent" ? "0.01" : "0.01"}
                      value={discountStr}
                      onChange={(e) => setDiscountStr(e.target.value)}
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
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder="Email (optional)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                    <Input
                      placeholder={
                        serviceType === "DELIVERY"
                          ? "Delivery address"
                          : "Address (optional)"
                      }
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                  </div>
                </CollapsibleBlock>
              </section>

              <section className={checkoutSectionGap}>
                <h3 className={checkoutSectionTitle}>Payment</h3>
                <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "CASH" as const, label: "Cash", icon: Banknote, onClick: setAllCashPayment },
                    { key: "BANK" as const, label: "Bank", icon: Building2, onClick: setAllBankPayment },
                    { key: "BOTH" as const, label: "Both", icon: Split, onClick: setSplitHalfPayment },
                  ] as const
                ).map(({ key, label, icon: Icon, onClick }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={otherChargeResult.invalid || grandTotalPreview <= 0}
                    onClick={onClick}
                    className={paymentPresetClass(detectedPaymentPreset === key)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                ))}
              </div>
              {grandTotalPreview > 0 && !otherChargeResult.invalid ? (
                <div className="mt-3 space-y-1">
                  <div className="flex h-2 overflow-hidden rounded-full bg-[var(--color-cream-200)]">
                    <div
                      className="bg-emerald-600 transition-all duration-300 ease-out"
                      style={{
                        width: `${Math.min(100, (cashPaidResult.amount / grandTotalPreview) * 100)}%`,
                      }}
                    />
                    <div
                      className="bg-sky-600 transition-all duration-300 ease-out"
                      style={{
                        width: `${Math.min(100, (bankPaidResult.amount / grandTotalPreview) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-700/15 bg-emerald-500/5 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                  <label htmlFor="pos-cash" className="mb-1.5 block text-xs font-medium text-muted">
                    Cash received
                  </label>
                  <Input
                    id="pos-cash"
                    type="number"
                    min={0}
                    step="0.01"
                    value={cashPaidStr}
                    onChange={(e) => setCashPaidStr(e.target.value)}
                    onBlur={billingType === "PAID" ? fillBankFromCash : undefined}
                    className="h-10 border-emerald-700/20 bg-[var(--color-surface)] font-mono tabular-nums dark:border-emerald-500/30"
                  />
                </div>
                <div className="rounded-xl border border-sky-700/15 bg-sky-500/5 p-3 dark:border-sky-500/25 dark:bg-sky-500/10">
                  <label htmlFor="pos-bank" className="mb-1.5 block text-xs font-medium text-muted">
                    Bank received
                  </label>
                  <Input
                    id="pos-bank"
                    type="number"
                    min={0}
                    step="0.01"
                    value={bankPaidStr}
                    onChange={(e) => setBankPaidStr(e.target.value)}
                    onBlur={billingType === "PAID" ? fillCashFromBank : undefined}
                    className="h-10 border-sky-700/20 bg-[var(--color-surface)] font-mono tabular-nums dark:border-sky-500/30"
                  />
                </div>
              </div>
              <div
                className={cn(
                  "mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
                  paymentBalanced
                    ? "bg-green-500/10 text-green-800 dark:text-green-300"
                    : "bg-amber-500/10 text-amber-900 dark:text-amber-200",
                )}
              >
                {paymentBalanced ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
                <span className="leading-snug">
                  {billingType === "CREDIT"
                    ? `On credit: ${formatMoney(creditPreview)}`
                    : paymentBalanced
                      ? "Payment matches total"
                      : `${paymentRemainder > 0 ? "Still due" : "Overpaid"}: ${formatMoney(Math.abs(paymentRemainder))}`}
                </span>
              </div>
                </div>
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

          <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-cream-50)]/60 px-3 py-2">
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
                disabled={submitting || cart.length === 0}
                onClick={() => void onCheckout()}
              >
                {submitting ? "…" : "Bill"}
              </Button>
            </div>
          </div>
          </div>
        </div>
      </div>

      <section
        id="pos-recent-sales"
        className="mt-6 space-y-3 border-t border-[var(--color-border)] pt-6 pb-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent sales</h2>
            <p className="text-xs text-muted">Latest completed orders</p>
          </div>
          <div className="flex gap-1.5">
            {(["", "DINE_IN", "DELIVERY"] as const).map((f) => (
              <button
                key={f || "all"}
                type="button"
                onClick={() => setServiceFilter(f)}
                className={chipClass(serviceFilter === f)}
              >
                {f === "" ? "All" : f === "DINE_IN" ? "Dine in" : "Delivery"}
              </button>
            ))}
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-cream-50)]/50 px-4 py-8 text-center">
            <p className="text-sm text-muted">No sales yet</p>
          </div>
        ) : (
          <ResponsiveTable
              headers={[
                "Receipt",
                "Date",
                "Service",
                "Bill",
                { label: "Total", thClassName: "text-right" },
                {
                  label: "Actions",
                  thClassName: "text-right",
                  labelWrapperClassName: tableActionsColumnClass,
                },
              ]}
              ariaLabel="Recent sales"
              density="compact"
              className="min-w-0 border-0 shadow-none [&_table]:min-w-[40rem]"
            >
              {sales.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-foreground whitespace-nowrap">
                    {s.receiptNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                    {formatDateTime(s.saleAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default" size="sm">
                      {s.serviceType === "DELIVERY" ? "Delivery" : "Dine in"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.billingType === "CREDIT" ? "warning" : "success"} size="sm">
                      {s.billingType === "CREDIT" ? "Credit" : "Paid"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                    {formatMoney(s.grandTotal)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={tableActionsCellClass}>
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className={actionIconClass}
                          onClick={() => void openView(s.id)}
                          aria-label={`View ${s.receiptNo}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={actionIconClass}
                          onClick={() => void handlePrint(s.id)}
                          aria-label={`Print ${s.receiptNo}`}
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </ResponsiveTable>
        )}
      </section>

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
            <p className="py-8 text-center text-sm text-muted">Loading sale…</p>
          ) : viewSale ? (
            <PosSaleDetail sale={viewSale} />
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
              <Button type="button" onClick={() => void handlePrint(viewSale.id!)}>
                <Printer className="mr-1.5 h-4 w-4" />
                Print receipt
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      {typeof document !== "undefined" && printSale
        ? createPortal(
            <div id="pos-sale-print-host" className="hidden print:flex">
              <PosSaleReceipt sale={printSale} id="pos-sale-receipt-print" />
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
