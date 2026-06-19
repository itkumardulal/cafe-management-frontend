"use client";

import { Card } from "@/src/components/ui/card";
import { WaterfallRow } from "@/src/features/reports/components/report-waterfall-row";
import { formatMoney } from "@/src/lib/format-display";

export function ReportProfitWaterfall({
  grossSalesBeforeDiscount,
  totalDiscountGiven,
  revenue,
  costOfGoodsSold,
  grossProfit,
}: {
  grossSalesBeforeDiscount: string;
  totalDiscountGiven: string;
  revenue: string;
  costOfGoodsSold: string;
  grossProfit: string;
}) {
  const discountNum = Number(totalDiscountGiven);
  const grossProfitNum = Number(grossProfit);
  const discountDisplay =
    discountNum > 0 ? `−${formatMoney(totalDiscountGiven)}` : formatMoney(totalDiscountGiven);

  return (
    <Card density="compact" className="space-y-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
        Profit breakdown
      </p>
      <div className="mt-3 space-y-0" role="list" aria-label="Profit breakdown">
        <WaterfallRow
          label="Sales before discounts"
          value={formatMoney(grossSalesBeforeDiscount)}
        />
        <WaterfallRow
          label="Discounts given"
          value={discountDisplay}
          tone="warning"
          dividerAfter
        />
        <WaterfallRow label="Net revenue" value={formatMoney(revenue)} emphasized />
        <WaterfallRow
          label="Cost of goods sold"
          value={`−${formatMoney(costOfGoodsSold)}`}
          tone="warning"
          dividerAfter
        />
        <WaterfallRow
          label="Gross profit"
          value={formatMoney(grossProfit)}
          tone={grossProfitNum >= 0 ? "positive" : "negative"}
          emphasized
        />
      </div>
    </Card>
  );
}
