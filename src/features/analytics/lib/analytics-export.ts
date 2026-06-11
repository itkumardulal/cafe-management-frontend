import type { AnalyticsOverview } from "@/src/features/analytics/types/analytics.types";
import { formatSalePaymentMethod } from "@/src/lib/ar-display";

type ExportSheet = {
  sheetName: string;
  rows: (string | number)[][];
};

function periodFileLabel(overview: AnalyticsOverview): string {
  return overview.period.label.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
}

function kpiRows(overview: AnalyticsOverview): Array<{ metric: string; value: string }> {
  const rows: Array<{ metric: string; value: string }> = [
    { metric: "Period", value: overview.period.label },
    { metric: "Comparison period", value: overview.comparisonPeriod.label },
  ];

  if (overview.kpis.totalSales) {
    rows.push({ metric: "Total sales", value: String(overview.kpis.totalSales.value) });
  }
  if (overview.kpis.netProfit) {
    rows.push({ metric: "Net profit", value: String(overview.kpis.netProfit.value) });
  }
  if (overview.kpis.totalOrders) {
    rows.push({ metric: "Total orders", value: String(overview.kpis.totalOrders.value) });
  }
  if (overview.kpis.averageOrderValue) {
    rows.push({ metric: "Average order value", value: String(overview.kpis.averageOrderValue.value) });
  }
  if (overview.kpis.discountImpact) {
    rows.push({ metric: "Discount impact", value: overview.kpis.discountImpact.value });
  }
  if (overview.kpis.customerReceivablesOutstanding) {
    rows.push({
      metric: "Customer receivables (live)",
      value: overview.kpis.customerReceivablesOutstanding.value,
    });
  }
  if (overview.kpis.supplierPayablesOutstanding) {
    rows.push({
      metric: "Supplier payables (live)",
      value: overview.kpis.supplierPayablesOutstanding.value,
    });
  }
  if (overview.kpis.bankBalanceSnapshot) {
    rows.push({
      metric: "Bank & cash balance (live)",
      value: overview.kpis.bankBalanceSnapshot.value,
    });
  }

  return rows;
}

function buildExportSheets(overview: AnalyticsOverview): ExportSheet[] {
  const sheets: ExportSheet[] = [
    {
      sheetName: "KPIs",
      rows: [
        ["Metric", "Value"],
        ...kpiRows(overview).map((row) => [row.metric, row.value]),
      ],
    },
  ];

  if (overview.charts.salesTrend?.points.length) {
    sheets.push({
      sheetName: "Sales trend",
      rows: [
        ["Date", "Sales", "Orders"],
        ...overview.charts.salesTrend.points.map((p) => [p.date, p.totalSales, p.orderCount]),
      ],
    });
  }

  if (overview.charts.profitExpense?.buckets.length) {
    sheets.push({
      sheetName: "Profit vs expense",
      rows: [
        ["Date", "Revenue", "Expenses", "Net profit"],
        ...overview.charts.profitExpense.buckets.map((b) => [
          b.date,
          b.revenue,
          b.expenses,
          b.netProfit,
        ]),
      ],
    });
  }

  if (overview.charts.topMenuItems?.length) {
    sheets.push({
      sheetName: "Top menu items",
      rows: [
        ["Item", "Qty sold", "Revenue"],
        ...overview.charts.topMenuItems.map((item) => [item.name, item.quantitySold, item.revenue]),
      ],
    });
  }

  if (overview.charts.salesByCategory?.length) {
    sheets.push({
      sheetName: "Sales by category",
      rows: [
        ["Category", "Revenue", "% of total"],
        ...overview.charts.salesByCategory.map((item) => [
          item.categoryName,
          item.revenue,
          item.percentOfTotal,
        ]),
      ],
    });
  }

  if (overview.charts.paymentMethods?.length) {
    sheets.push({
      sheetName: "Payment methods",
      rows: [
        ["Method", "Amount", "% of total"],
        ...overview.charts.paymentMethods.map((item) => [
          item.paymentMethod === "CREDIT" ? "Credit" : formatSalePaymentMethod(item.paymentMethod),
          item.totalAmount,
          item.percentOfTotal,
        ]),
      ],
    });
  }

  if (overview.charts.peakHours?.length) {
    sheets.push({
      sheetName: "Peak hours",
      rows: [
        ["Hour", "Orders", "Sales"],
        ...overview.charts.peakHours.map((item) => [item.label, item.orderCount, item.totalSales]),
      ],
    });
  }

  if (overview.charts.receivablesAging?.length) {
    sheets.push({
      sheetName: "AR aging",
      rows: [
        ["Bucket", "Outstanding", "Customers"],
        ...overview.charts.receivablesAging.map((item) => [
          item.label,
          item.outstandingAmount,
          item.customerCount,
        ]),
      ],
    });
  }

  if (overview.charts.supplierPayables?.length) {
    sheets.push({
      sheetName: "Supplier payables",
      rows: [
        ["Supplier", "Outstanding"],
        ...overview.charts.supplierPayables.map((item) => [item.supplierName, item.outstandingAmount]),
      ],
    });
  }

  if (overview.charts.salesByServiceType?.length) {
    sheets.push({
      sheetName: "Service type",
      rows: [
        ["Type", "Revenue", "Orders"],
        ...overview.charts.salesByServiceType.map((item) => [
          item.label,
          item.revenue,
          item.orderCount,
        ]),
      ],
    });
  }

  if (overview.charts.expenseByCategory?.length) {
    sheets.push({
      sheetName: "Expense categories",
      rows: [
        ["Category", "Amount", "% of total"],
        ...overview.charts.expenseByCategory.map((item) => [
          item.label,
          item.amount,
          item.percentOfTotal,
        ]),
      ],
    });
  }

  if (overview.widgets.activityFeed.items.length) {
    sheets.push({
      sheetName: "Activity feed",
      rows: [
        ["Time", "Type", "Title", "Description"],
        ...overview.widgets.activityFeed.items.map((item) => [
          item.occurredAt,
          item.eventType,
          item.title,
          item.description,
        ]),
      ],
    });
  }

  return sheets;
}

export async function exportAnalyticsWorkbook(overview: AnalyticsOverview): Promise<void> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const sheet of buildExportSheets(overview)) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName.slice(0, 31));
  }

  XLSX.writeFile(workbook, `dashboard_${periodFileLabel(overview)}.xlsx`);
}

export async function exportAnalyticsExcel(overview: AnalyticsOverview): Promise<void> {
  await exportAnalyticsWorkbook(overview);
}

export function exportAnalyticsCsv(overview: AnalyticsOverview): void {
  const lines: string[] = [`Period,${overview.period.label}`, `Comparison,${overview.comparisonPeriod.label}`];

  for (const row of kpiRows(overview)) {
    lines.push(`${row.metric},${row.value}`);
  }

  if (overview.charts.salesTrend?.points.length) {
    lines.push("");
    lines.push("Sales trend");
    lines.push("Date,Sales,Orders");
    overview.charts.salesTrend.points.forEach((p) => {
      lines.push(`${p.date},${p.totalSales},${p.orderCount}`);
    });
  }

  if (overview.charts.profitExpense?.buckets.length) {
    lines.push("");
    lines.push("Profit vs expense");
    lines.push("Date,Revenue,Expenses,Net profit");
    overview.charts.profitExpense.buckets.forEach((b) => {
      lines.push(`${b.date},${b.revenue},${b.expenses},${b.netProfit}`);
    });
  }

  if (overview.charts.topMenuItems?.length) {
    lines.push("");
    lines.push("Top menu items");
    lines.push("Item,Qty sold,Revenue");
    overview.charts.topMenuItems.forEach((item) => {
      lines.push(`${item.name},${item.quantitySold},${item.revenue}`);
    });
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dashboard_${periodFileLabel(overview)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportAnalyticsPdf(overview: AnalyticsOverview): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Dashboard Analytics", 14, 18);
  doc.setFontSize(10);
  doc.text(`Period: ${overview.period.label}`, 14, 26);
  doc.text(`Compared to: ${overview.comparisonPeriod.label}`, 14, 32);
  doc.text(`Generated: ${new Date(overview.generatedAt).toLocaleString()}`, 14, 38);

  let startY = 44;

  autoTable(doc, {
    startY,
    head: [["Metric", "Value"]],
    body: kpiRows(overview).map((row) => [row.metric, row.value]),
  });

  startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const appendTable = (title: string, head: string[], body: string[][]) => {
    if (body.length === 0) {
      return;
    }
    if (startY > 250) {
      doc.addPage();
      startY = 18;
    }
    doc.setFontSize(11);
    doc.text(title, 14, startY);
    startY += 4;
    autoTable(doc, {
      startY,
      head: [head],
      body,
    });
    startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  };

  appendTable(
    "Sales trend",
    ["Date", "Sales", "Orders"],
    overview.charts.salesTrend?.points.map((p) => [p.date, p.totalSales, String(p.orderCount)]) ?? [],
  );

  appendTable(
    "Profit vs expense",
    ["Date", "Revenue", "Expenses", "Net profit"],
    overview.charts.profitExpense?.buckets.map((b) => [b.date, b.revenue, b.expenses, b.netProfit]) ?? [],
  );

  appendTable(
    "Top menu items",
    ["Item", "Qty", "Revenue"],
    overview.charts.topMenuItems?.map((i) => [i.name, i.quantitySold, i.revenue]) ?? [],
  );

  appendTable(
    "Payment methods",
    ["Method", "Amount"],
    overview.charts.paymentMethods?.map((p) => [
      p.paymentMethod === "CREDIT" ? "Credit" : formatSalePaymentMethod(p.paymentMethod),
      p.totalAmount,
    ]) ?? [],
  );

  doc.save(`dashboard_${periodFileLabel(overview)}.pdf`);
}
