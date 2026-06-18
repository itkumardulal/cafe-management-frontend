"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { formatSalePaymentMethod } from "@/src/lib/ar-display";
import type { AnalyticsOverview } from "@/src/features/analytics/types/analytics.types";
import { CHART_COLORS, chartAxisStyle, chartGridStroke, chartTooltipStyle } from "@/src/features/analytics/lib/chart-theme";
import { AnalyticsChartViewport } from "@/src/features/analytics/components/charts/analytics-chart-viewport";
import { ChartGranularityToggle } from "@/src/features/analytics/components/charts/chart-granularity-toggle";
import { useChartLayout } from "@/src/features/analytics/hooks/use-chart-layout";
import {
  type ChartGranularity,
  rebucketProfitExpense,
} from "@/src/features/analytics/lib/rebucket-time-series";
import {
  resolveChartGranularity,
  resolveChartGranularityOptions,
} from "@/src/features/analytics/lib/chart-granularity-by-period";
import type { ReportPeriodKey } from "@/src/features/reports/types/reports.types";

function ChartCard({
  title,
  children,
  className,
  emptyMessage,
  isEmpty,
  headerAction,
  footnote,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
  headerAction?: React.ReactNode;
  footnote?: string;
}) {
  return (
    <Card density="comfortable" className={cn("w-full min-w-0 max-w-full", className)}>
      <div className="mb-3 flex flex-col gap-2 max-md:gap-2.5 md:flex-row md:items-start md:justify-between md:gap-2">
        <h3 className="min-w-0 text-sm font-semibold text-foreground">{title}</h3>
        {headerAction ? <div className="shrink-0 self-start">{headerAction}</div> : null}
      </div>
      {isEmpty ? (
        <div className="flex h-64 w-full min-w-0 items-center justify-center text-sm text-muted sm:h-72">
          {emptyMessage ?? "No data in this period"}
        </div>
      ) : (
        children
      )}
      {footnote ? <p className="mt-2 text-xs text-[var(--color-muted)]">{footnote}</p> : null}
    </Card>
  );
}

function MetricToggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ key: string; label: string }>;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-100)] p-0.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={
            value === opt.key
              ? "rounded-md bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-foreground shadow-sm"
              : "rounded-md px-2.5 py-1 text-xs font-medium text-[var(--color-muted)] hover:text-foreground"
          }
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ReceivablesAgingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string; amount: number; customerCount: number } }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{row.label}</p>
      <p className="text-muted">{formatMoney(String(row.amount))} across {row.customerCount} customers</p>
    </div>
  );
}

function AnalyticsPieChart({
  rows,
  nameKey = "name",
  legendFormatter,
  tooltipFormatter,
}: {
  rows: Array<{ fill: string; value: number; [key: string]: string | number }>;
  nameKey?: string;
  legendFormatter?: (value: string) => string;
  tooltipFormatter?: (value: number) => string;
}) {
  const { pieInnerRadius, pieOuterRadius, legendStyle } = useChartLayout();
  const formatTooltip = tooltipFormatter ?? ((v) => formatMoney(String(v)));

  return (
    <PieChart>
      <Pie
        data={rows}
        dataKey="value"
        nameKey={nameKey}
        cx="50%"
        cy="50%"
        innerRadius={pieInnerRadius}
        outerRadius={pieOuterRadius}
        paddingAngle={2}
      >
        {rows.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.fill} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={chartTooltipStyle}
        formatter={(v) => formatTooltip(Number(v ?? 0))}
      />
      <Legend wrapperStyle={legendStyle} formatter={legendFormatter} />
    </PieChart>
  );
}

export function SalesTrendChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["salesTrend"]>;
}) {
  const { chartMargin, yAxisWidth } = useChartLayout();

  const points = useMemo(
    () =>
      data.points.map((p) => ({
      ...p,
      sales: Number(p.totalSales),
      })),
    [data.points],
  );

  const isEmpty = points.length === 0 || points.every((p) => p.sales === 0 && p.orderCount === 0);

  return (
    <ChartCard
      title="Sales trend"
      className="lg:col-span-2"
      isEmpty={isEmpty}
      emptyMessage="No sales in this period"
    >
      <AnalyticsChartViewport>
        <BarChart data={points} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
          <XAxis dataKey="date" tick={chartAxisStyle} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={chartAxisStyle} tickFormatter={(v) => formatMoney(String(v))} width={yAxisWidth} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [formatMoney(String(value ?? 0)), "Sales"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Bar dataKey="sales" name="Sales" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function ProfitExpenseChart({
  data,
  period,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["profitExpense"]>;
  period?: ReportPeriodKey;
}) {
  const granularityOptions = resolveChartGranularityOptions(period);
  const [granularity, setGranularity] = useState<ChartGranularity>(
    () => resolveChartGranularity(period, granularityOptions[0] ?? "day"),
  );
  const { chartMargin, yAxisWidth } = useChartLayout();

  const effectiveGranularity = resolveChartGranularity(period, granularity);

  const buckets = useMemo(() => {
    const rebucketed = rebucketProfitExpense(data.buckets, effectiveGranularity);
    return rebucketed.map((b) => ({
      ...b,
      revenueNum: Number(b.revenue),
      expensesNum: Number(b.expenses),
      netProfitNum: Number(b.netProfit),
    }));
  }, [data.buckets, effectiveGranularity]);

  const isEmpty =
    buckets.length === 0 ||
    buckets.every((b) => b.revenueNum === 0 && b.expensesNum === 0 && b.netProfitNum === 0);

  return (
    <ChartCard
      title="Profit vs expense"
      isEmpty={isEmpty}
      emptyMessage="No profit or expense data in this period"
      headerAction={
        <ChartGranularityToggle
          value={effectiveGranularity}
          onChange={setGranularity}
          options={granularityOptions}
        />
      }
      footnote="Net profit = revenue − COGS − operating expenses"
    >
      <AnalyticsChartViewport>
        <BarChart data={buckets} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
          <XAxis dataKey="date" tick={chartAxisStyle} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={chartAxisStyle} tickFormatter={(v) => formatMoney(String(v))} width={yAxisWidth} />
          <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => formatMoney(String(v ?? 0))} />
          <Legend />
          <Bar dataKey="revenueNum" name="Revenue" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          <Bar dataKey="expensesNum" name="Expenses" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
          <Bar dataKey="netProfitNum" name="Net profit" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function TopMenuItemsChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["topMenuItems"]>;
}) {
  const [metric, setMetric] = useState<"quantity" | "revenue">("quantity");
  const { categoryAxisWidth } = useChartLayout();

  const rows = useMemo(
    () =>
      [...data]
        .reverse()
        .map((item) => ({
          name: item.name.length > 24 ? `${item.name.slice(0, 24)}…` : item.name,
          quantity: Number(item.quantitySold),
          revenue: Number(item.revenue),
        })),
    [data],
  );

  const isEmpty = rows.length === 0 || rows.every((r) => r.quantity === 0 && r.revenue === 0);
  const dataKey = metric === "quantity" ? "quantity" : "revenue";
  const name = metric === "quantity" ? "Qty sold" : "Revenue";

  return (
    <ChartCard
      title="Top selling menu items"
      isEmpty={isEmpty}
      emptyMessage="No menu item sales in this period"
      headerAction={
        <MetricToggle
          value={metric}
          onChange={(v) => setMetric(v as "quantity" | "revenue")}
          options={[
            { key: "quantity", label: "Qty" },
            { key: "revenue", label: "Revenue" },
          ]}
        />
      }
    >
      <AnalyticsChartViewport>
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
          <XAxis
            type="number"
            tick={chartAxisStyle}
            tickFormatter={(v) => (metric === "revenue" ? formatMoney(String(v)) : String(v))}
          />
          <YAxis type="category" dataKey="name" tick={chartAxisStyle} width={categoryAxisWidth} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(v) =>
              metric === "revenue" ? formatMoney(String(v ?? 0)) : String(v ?? 0)
            }
          />
          <Bar dataKey={dataKey} name={name} fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function SalesByCategoryChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["salesByCategory"]>;
}) {
  const rows = data.map((item, i) => ({
    name: item.categoryName,
    value: Number(item.revenue),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const isEmpty = rows.length === 0 || rows.every((r) => r.value === 0);

  return (
    <ChartCard title="Sales by category" isEmpty={isEmpty} emptyMessage="No category sales in this period">
      <AnalyticsChartViewport>
        <AnalyticsPieChart rows={rows} />
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function PaymentMethodsChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["paymentMethods"]>;
}) {
  const rows = data.map((item, i) => ({
    name: item.paymentMethod === "CREDIT" ? "Credit" : formatSalePaymentMethod(item.paymentMethod),
    value: Number(item.totalAmount),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const isEmpty = rows.length === 0 || rows.every((r) => r.value === 0);

  return (
    <ChartCard title="Payment methods" isEmpty={isEmpty} emptyMessage="No payments in this period">
      <AnalyticsChartViewport>
        <AnalyticsPieChart rows={rows} legendFormatter={(value) => String(value)} />
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function PeakHoursChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["peakHours"]>;
}) {
  const { chartMargin, yAxisWidth, yAxisWidthCompact } = useChartLayout();
  const rows = data.map((row) => ({
    ...row,
    sales: Number(row.totalSales),
  }));

  const isEmpty = rows.every((r) => r.orderCount === 0 && r.sales === 0);

  return (
    <ChartCard title="Peak business hours" isEmpty={isEmpty} emptyMessage="No orders in this period">
      <AnalyticsChartViewport>
        <ComposedChart data={rows} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
          <XAxis dataKey="label" tick={chartAxisStyle} interval={2} />
          <YAxis yAxisId="left" tick={chartAxisStyle} width={yAxisWidthCompact} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={chartAxisStyle}
            tickFormatter={(v) => formatMoney(String(v))}
            width={yAxisWidth}
          />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend />
          <Bar yAxisId="left" dataKey="orderCount" name="Orders" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="sales"
            name="Sales"
            stroke={CHART_COLORS[2]}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function ReceivablesAgingChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["receivablesAging"]>;
}) {
  const { chartMargin, yAxisWidth } = useChartLayout();
  const rows = data.map((item) => ({
    ...item,
    amount: Number(item.outstandingAmount),
  }));

  const isEmpty = rows.every((r) => r.amount === 0);

  return (
    <ChartCard title="Customer receivable aging" isEmpty={isEmpty} emptyMessage="No outstanding receivables">
      <AnalyticsChartViewport>
        <BarChart data={rows} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
          <XAxis dataKey="label" tick={chartAxisStyle} />
          <YAxis tick={chartAxisStyle} tickFormatter={(v) => formatMoney(String(v))} width={yAxisWidth} />
          <Tooltip content={<ReceivablesAgingTooltip />} />
          <Bar dataKey="amount" name="Outstanding" fill={CHART_COLORS[5]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function SupplierPayablesChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["supplierPayables"]>;
}) {
  const { categoryAxisWidth } = useChartLayout();
  const rows = [...data].reverse().map((item) => ({
    name: item.supplierName.length > 20 ? `${item.supplierName.slice(0, 20)}…` : item.supplierName,
    outstanding: Number(item.outstandingAmount),
  }));

  const isEmpty = rows.length === 0 || rows.every((r) => r.outstanding === 0);

  return (
    <ChartCard title="Supplier payables" isEmpty={isEmpty} emptyMessage="No supplier payables">
      <AnalyticsChartViewport>
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
          <XAxis type="number" tick={chartAxisStyle} tickFormatter={(v) => formatMoney(String(v))} />
          <YAxis type="category" dataKey="name" tick={chartAxisStyle} width={categoryAxisWidth} />
          <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => formatMoney(String(v ?? 0))} />
          <Bar dataKey="outstanding" name="Outstanding" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function ServiceTypeChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["salesByServiceType"]>;
}) {
  const rows = data.map((item, i) => ({
    name: item.label,
    value: Number(item.revenue),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const isEmpty = rows.length === 0 || rows.every((r) => r.value === 0);

  return (
    <ChartCard title="Sales by service type" isEmpty={isEmpty} emptyMessage="No sales by service type">
      <AnalyticsChartViewport>
        <AnalyticsPieChart rows={rows} />
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function ExpenseCategoryChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["expenseByCategory"]>;
}) {
  const rows = data.map((item, i) => ({
    name: item.label,
    value: Number(item.amount),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const isEmpty = rows.length === 0 || rows.every((r) => r.value === 0);

  return (
    <ChartCard title="Expenses by category" isEmpty={isEmpty} emptyMessage="No categorized expenses in this period">
      <AnalyticsChartViewport>
        <AnalyticsPieChart rows={rows} />
      </AnalyticsChartViewport>
    </ChartCard>
  );
}

export function TableOccupancyChart({
  data,
}: {
  data: NonNullable<AnalyticsOverview["charts"]["tableOccupancy"]>;
}) {
  const rows = data.map((item, i) => ({
    ...item,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const isEmpty = rows.every((r) => r.value === 0);

  return (
    <ChartCard title="Table occupancy" isEmpty={isEmpty} emptyMessage="No table data">
      <AnalyticsChartViewport>
        <AnalyticsPieChart rows={rows} nameKey="label" tooltipFormatter={(v) => String(v)} />
      </AnalyticsChartViewport>
    </ChartCard>
  );
}
