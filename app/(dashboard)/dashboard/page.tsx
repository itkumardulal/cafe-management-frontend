"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/src/components/shared/page-header";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Pagination } from "@/src/components/ui/pagination";
import { Select } from "@/src/components/ui/select";
import { formatMoney } from "@/src/lib/format-display";
import { DEFAULT_PAGE_SIZE, getStoredPageSize, setStoredPageSize, type PageSizeOption } from "@/src/lib/pagination-storage";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  fetchCafeOverviewThunk,
  fetchManagedCafesThunk,
  setCafe,
} from "@/src/store/slices/cafe.slice";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [cafePageSize, setCafePageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);
  const [cafePage, setCafePage] = useState(1);
  const [apMetrics, setApMetrics] = useState<{
    outstandingBillsAmount: string;
    overdueBillsAmount: string;
    billsDueThisWeekAmount: string;
    suppliersWithOutstandingCount: number;
  } | null>(null);
  const [arMetrics, setArMetrics] = useState<{
    totalOutstanding: string;
    customersWithCreditCount: number;
    overdueCreditsAmount: string;
    topCreditCustomers: Array<{
      id: string;
      name: string;
      phoneNumber: string;
      outstandingAmount: string;
    }>;
  } | null>(null);
  const [stockAlerts, setStockAlerts] = useState<{
    counts: { low: number; out: number };
    low: Array<{ id: string; kind: string; name: string; quantityOnHand: string }>;
  } | null>(null);

  useEffect(() => {
    if (!user?.role || user.role === "SUPER_ADMIN") {
      return;
    }
    void operationsApi.dashboard
      .cafeMetrics()
      .then(setApMetrics)
      .catch(() => {});
    void operationsApi.dashboard
      .customerReceivables()
      .then(setArMetrics)
      .catch(() => {});
    void operationsApi
      .stockAlerts()
      .then((data: { counts: { low: number; out: number }; low: Array<{ id: string; kind: string; name: string; quantityOnHand: string }> }) =>
        setStockAlerts({ counts: data.counts, low: data.low.slice(0, 5) }),
      )
      .catch(() => {});
  }, [user?.role]);
  const { selectedCafeId, managedCafes, selectedCafeOverview, loading } = useAppSelector(
    (state) => state.cafe,
  );
  const totalCafePages = Math.max(1, Math.ceil(managedCafes.length / cafePageSize));
  const pagedManagedCafes = useMemo(() => {
    const start = (cafePage - 1) * cafePageSize;
    return managedCafes.slice(start, start + cafePageSize);
  }, [cafePage, cafePageSize, managedCafes]);

  useEffect(() => {
    setCafePageSize(getStoredPageSize("dashboard.superadmin.cafes"));
  }, []);

  useEffect(() => {
    setCafePage((prev) => Math.min(prev, totalCafePages));
  }, [totalCafePages]);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      void dispatch(fetchManagedCafesThunk());
    }
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (!selectedCafeId || managedCafes.length === 0) {
      return;
    }
    const selectedIndex = managedCafes.findIndex((cafe) => cafe.id === selectedCafeId);
    if (selectedIndex < 0) {
      return;
    }
    const selectedPage = Math.floor(selectedIndex / cafePageSize) + 1;
    if (selectedPage !== cafePage) {
      setCafePage(selectedPage);
    }
  }, [cafePage, cafePageSize, managedCafes, selectedCafeId]);

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN" || selectedCafeId) {
      return;
    }
    const firstCafeId = managedCafes[0]?.id;
    if (firstCafeId) {
      dispatch(setCafe(firstCafeId));
    }
  }, [dispatch, managedCafes, selectedCafeId, user?.role]);

  useEffect(() => {
    if (!selectedCafeId || user?.role !== "SUPER_ADMIN") {
      return;
    }
    void dispatch(fetchCafeOverviewThunk(selectedCafeId))
      .unwrap()
      .catch(() => appToast.error("Failed to load cafe overview"));
  }, [dispatch, selectedCafeId, user?.role]);

  if (user?.role === "SUPER_ADMIN") {
    return (
      <section className="page-shell page-content">
        <PageHeader
          title="Cafe Overview (Read-only)"
          description="Switch cafe context to view summary data for cafes you created."
          action={
            <Link href="/cafe-admins?add=1">
              <Button type="button" size="sm">
                Add cafe admin
              </Button>
            </Link>
          }
        />

        {managedCafes.length > 0 ? (
          <Card density="compact" className="overflow-hidden p-0">
            <div className="space-y-2 p-4">
              <label className="block text-sm font-medium text-muted" htmlFor="cafe-switcher">
                Select cafe
              </label>
              <Select
                id="cafe-switcher"
                value={selectedCafeId ?? ""}
                onChange={(event) => dispatch(setCafe(event.target.value || null))}
              >
                {pagedManagedCafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.cafeName}
                  </option>
                ))}
              </Select>
            </div>
            <Pagination
              currentPage={cafePage}
              totalPages={totalCafePages}
              totalRecords={managedCafes.length}
              pageSize={cafePageSize}
              onPageChange={setCafePage}
              onPageSizeChange={(size) => {
                setCafePageSize(size);
                setStoredPageSize("dashboard.superadmin.cafes", size);
                setCafePage(1);
              }}
            />
          </Card>
        ) : null}

        {!loading && managedCafes.length === 0 ? (
          <EmptyState
            title="No cafes created yet"
            description="Create a cafe admin first to start seeing read-only cafe dashboard summaries."
          />
        ) : null}

        {selectedCafeOverview ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { title: "Total users", value: selectedCafeOverview.metrics.totalUsers },
                { title: "Total staff", value: selectedCafeOverview.metrics.totalStaff },
                { title: "Active staff", value: selectedCafeOverview.metrics.activeStaff },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card density="compact" className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-subtle">{item.title}</p>
                    <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                    <Badge variant="default" size="sm">
                      Read-only
                    </Badge>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card density="comfortable" className="space-y-2">
              <p className="text-sm text-muted">
                Cafe Admin: {selectedCafeOverview.cafe.users[0]?.fullName ?? "Not assigned"}
              </p>
              <p className="text-sm text-muted">
                Cafe Email: {selectedCafeOverview.cafe.email}
              </p>
            </Card>
          </>
        ) : null}
      </section>
    );
  }

  return (
    <section className="page-shell page-content">
      <div className="space-y-1">
        <h1 className="heading-display text-foreground">Dashboard</h1>
        <p className="text-muted sm:text-base">
          Logged in as <span className="font-medium">{user?.fullName}</span> ({user?.role})
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            {
              title: "Outstanding bills",
              value: apMetrics ? formatMoney(apMetrics.outstandingBillsAmount) : "—",
              href: "/bill-settlement?hasOutstanding=true",
            },
            {
              title: "Overdue bills",
              value: apMetrics ? formatMoney(apMetrics.overdueBillsAmount) : "—",
              href: "/bill-settlement?hasOutstanding=true",
            },
            {
              title: "Suppliers with dues",
              value: apMetrics ? String(apMetrics.suppliersWithOutstandingCount) : "—",
              href: "/bill-settlement?hasOutstanding=true",
            },
            {
              title: "Due this week",
              value: apMetrics ? formatMoney(apMetrics.billsDueThisWeekAmount) : "—",
              href: "/bill-settlement?activeVendors=true",
            },
          ] as const
        ).map((item, index) => (
          <motion.div
            key={item.title}
            className="h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={item.href} className="block h-full">
              <Card density="compact" className="flex h-full flex-col space-y-2 transition-shadow hover:shadow-md">
                <p className="text-xs uppercase tracking-wide text-subtle">{item.title}</p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">{item.value}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Customer receivables</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              {
                title: "Total outstanding",
                value: arMetrics ? formatMoney(arMetrics.totalOutstanding) : "—",
                href: "/customer-receivables?hasOutstanding=true",
              },
              {
                title: "Customers with credit",
                value: arMetrics ? String(arMetrics.customersWithCreditCount) : "—",
                href: "/customer-receivables?hasOutstanding=true",
              },
              {
                title: "Overdue credits",
                value: arMetrics ? formatMoney(arMetrics.overdueCreditsAmount) : "—",
                href: "/customer-receivables",
              },
              {
                title: "Top credit customer",
                value: arMetrics?.topCreditCustomers[0]
                  ? arMetrics.topCreditCustomers[0].name
                  : "—",
                href: arMetrics?.topCreditCustomers[0]
                  ? `/customer-receivables/${arMetrics.topCreditCustomers[0].id}`
                  : "/customer-receivables",
              },
            ] as const
          ).map((item, index) => (
            <motion.div
              key={item.title}
              className="h-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Link href={item.href} className="block h-full">
                <Card
                  density="compact"
                  className="flex h-full flex-col space-y-2 transition-shadow hover:shadow-md"
                >
                  <p className="text-xs uppercase tracking-wide text-subtle">{item.title}</p>
                  <p className="text-lg font-semibold text-foreground tabular-nums">{item.value}</p>
                  {item.title === "Top credit customer" &&
                  arMetrics?.topCreditCustomers[0] ? (
                    <p className="text-xs text-muted font-mono tabular-nums">
                      {formatMoney(arMetrics.topCreditCustomers[0].outstandingAmount)}
                    </p>
                  ) : null}
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {stockAlerts && stockAlerts.counts.low + stockAlerts.counts.out > 0 ? (
        <Card density="comfortable" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Low stock</h2>
            <Link href="/inventory?filter=low" className="text-sm text-[var(--color-primary)] hover:underline">
              View inventory
            </Link>
          </div>
          <p className="text-sm text-muted">
            {stockAlerts.counts.out} out of stock, {stockAlerts.counts.low} running low
          </p>
          <ul className="space-y-1 text-sm">
            {stockAlerts.low.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex justify-between gap-2">
                <span>
                  {item.name}
                  <span className="ml-1 text-xs text-muted">
                    ({item.kind === "INVENTORY" ? "Inventory" : "Menu"})
                  </span>
                </span>
                <span className="tabular-nums text-muted">{item.quantityOnHand}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card density="comfortable">
        <p className="text-muted">
          This dashboard is optimized for staff use with a mobile-first layout, fast touch targets,
          and reusable UI patterns.
        </p>
      </Card>
    </section>
  );
}
