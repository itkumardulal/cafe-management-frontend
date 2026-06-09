"use client";

import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";

type WaterfallRowProps = {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "positive" | "negative";
  emphasized?: boolean;
  dividerAfter?: boolean;
};

const toneStyles: Record<NonNullable<WaterfallRowProps["tone"]>, string> = {
  neutral: "text-foreground",
  warning: "text-amber-700 dark:text-amber-400",
  positive: "text-emerald-700 dark:text-emerald-400",
  negative: "text-red-700 dark:text-red-400",
};

function WaterfallRow({
  label,
  value,
  tone = "neutral",
  emphasized = false,
  dividerAfter = false,
}: WaterfallRowProps) {
  return (
    <>
      <div
        className={cn(
          "flex items-baseline justify-between gap-4 py-2",
          emphasized && "border-t border-border pt-3",
        )}
      >
        <span
          className={cn(
            "text-sm",
            emphasized ? "font-semibold text-foreground" : "text-muted",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "shrink-0 font-mono text-sm tabular-nums",
            emphasized && "text-base font-semibold",
            toneStyles[tone],
          )}
        >
          {value}
        </span>
      </div>
      {dividerAfter ? <div className="border-b border-border/60" aria-hidden /> : null}
    </>
  );
}

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
