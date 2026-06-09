import type { SalePaymentRow, SalePaymentStatus } from "@/src/lib/ar-types";
import {
  formatSalePaymentMethod,
  salePaymentStatusLabel,
} from "@/src/lib/ar-display";
import { formatDateOnly } from "@/src/lib/format-display";
import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";
import { ThermalRow } from "@/src/features/printing/components/thermal-row";
import { formatMoneyCompact } from "@/src/features/printing/lib/thermal-money";

const MAX_PAYMENT_LINES = 3;

type ThermalCreditBlockProps = {
  paymentStatus: SalePaymentStatus;
  paidAmount: string;
  remainingAmount: string;
  dueDate?: string | null;
  paymentTermsLabel?: string | null;
  payments: SalePaymentRow[];
};

export function ThermalCreditBlock({
  paymentStatus,
  paidAmount,
  remainingAmount,
  dueDate,
  paymentTermsLabel,
  payments,
}: ThermalCreditBlockProps) {
  if (paymentStatus === "PAID") return null;

  const visiblePayments = payments.slice(0, MAX_PAYMENT_LINES);
  const hiddenCount = payments.length - visiblePayments.length;

  return (
    <>
      <ThermalDivider />
      <div className="space-y-0.5 text-[10px]">
        <p className="font-semibold uppercase tracking-wide">Credit / balance</p>
        <ThermalRow label="Status" value={salePaymentStatusLabel(paymentStatus)} bold />
        <ThermalRow label="Paid so far" value={formatMoneyCompact(paidAmount)} />
        <ThermalRow label="Balance due" value={formatMoneyCompact(remainingAmount)} bold />
        {dueDate ? (
          <ThermalRow
            label="Due date"
            value={`${formatDateOnly(dueDate)}${paymentTermsLabel ? ` (${paymentTermsLabel})` : ""}`}
          />
        ) : null}
        {visiblePayments.length > 0 ? (
          <div className="pt-1">
            <p className="text-[9px] uppercase tracking-wide">Payment history</p>
            {visiblePayments.map((payment) => (
              <ThermalRow
                key={payment.id}
                label={formatSalePaymentMethod(payment.paymentMethod)}
                value={formatMoneyCompact(payment.amount)}
              />
            ))}
            {hiddenCount > 0 ? (
              <p className="text-[9px]">and {hiddenCount} more payment(s)</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
