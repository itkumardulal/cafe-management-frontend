export type ChartGranularity = "day" | "week" | "month";

function weekStartKey(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function monthStartKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function rebucketSalesTrendPoints(
  points: Array<{ date: string; totalSales: string; orderCount: number }>,
  granularity: ChartGranularity,
) {
  if (granularity === "day") {
    return points;
  }

  const groups = new Map<
    string,
    { date: string; totalSales: number; orderCount: number }
  >();

  for (const point of points) {
    const key =
      granularity === "week" ? weekStartKey(point.date) : monthStartKey(point.date);
    const existing = groups.get(key) ?? { date: key, totalSales: 0, orderCount: 0 };
    existing.totalSales += Number(point.totalSales);
    existing.orderCount += point.orderCount;
    groups.set(key, existing);
  }

  return [...groups.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      date: row.date,
      totalSales: row.totalSales.toFixed(2),
      orderCount: row.orderCount,
    }));
}

export function rebucketProfitExpense(
  buckets: Array<{ date: string; revenue: string; expenses: string; netProfit: string }>,
  granularity: ChartGranularity,
) {
  if (granularity === "day") {
    return buckets;
  }

  const groups = new Map<
    string,
    { date: string; revenue: number; expenses: number; netProfit: number }
  >();

  for (const bucket of buckets) {
    const key =
      granularity === "week" ? weekStartKey(bucket.date) : monthStartKey(bucket.date);
    const existing = groups.get(key) ?? {
      date: key,
      revenue: 0,
      expenses: 0,
      netProfit: 0,
    };
    existing.revenue += Number(bucket.revenue);
    existing.expenses += Number(bucket.expenses);
    existing.netProfit += Number(bucket.netProfit);
    groups.set(key, existing);
  }

  return [...groups.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      date: row.date,
      revenue: row.revenue.toFixed(2),
      expenses: row.expenses.toFixed(2),
      netProfit: row.netProfit.toFixed(2),
    }));
}
