import { Badge } from "@/src/components/ui/badge";
import type { SaleBillStatus, SalePaymentStatus } from "@/src/lib/ar-types";
import {
  saleBillStatusLabel,
  saleBillStatusVariant,
  salePaymentStatusLabel,
  salePaymentStatusVariant,
} from "@/src/lib/ar-display";

export function SalePaymentStatusBadge({ status }: { status: SalePaymentStatus }) {
  return (
    <Badge variant={salePaymentStatusVariant(status)} size="sm">
      {salePaymentStatusLabel(status)}
    </Badge>
  );
}

export function SaleBillStatusBadge({ status }: { status: SaleBillStatus }) {
  return (
    <Badge variant={saleBillStatusVariant(status)} size="sm">
      {saleBillStatusLabel(status)}
    </Badge>
  );
}
