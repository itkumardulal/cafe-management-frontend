import { Badge } from "@/src/components/ui/badge";
import {
  billStatusLabel,
  billStatusVariant,
  paymentStatusLabel,
  paymentStatusVariant,
} from "@/src/lib/ap-display";
import type { PurchasePaymentStatus, SupplierBillStatus } from "@/src/lib/ap-types";

export function PaymentStatusBadge({ status }: { status: PurchasePaymentStatus }) {
  return (
    <Badge variant={paymentStatusVariant(status)} size="sm">
      {paymentStatusLabel(status)}
    </Badge>
  );
}

export function BillStatusBadge({ status }: { status: SupplierBillStatus }) {
  return (
    <Badge variant={billStatusVariant(status)} size="sm">
      {billStatusLabel(status)}
    </Badge>
  );
}
