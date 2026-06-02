"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/src/components/shared/page-header";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Select } from "@/src/components/ui/select";
import { formatMoney } from "@/src/lib/format-display";
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
  const [apMetrics, setApMetrics] = useState<{
    outstandingBillsAmount: string;
    overdueBillsAmount: string;
    billsDueThisWeekAmount: string;
    suppliersWithOutstandingCount: number;
  } | null>(null);
  const [stockAlerts, setStockAlerts] = useState<{
    counts: { low: number; out: number };
    low: Array<{ id: string; kind: string; name: string; quantityOnHand: string }>;
  } | null>(null);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      return;
    }
    void operationsApi.dashboard
      .cafeMetrics()
      .then(setApMetrics)
      .catch(() => {});
    void operationsApi
      .stockAlerts()
      .then((data) => setStockAlerts({ counts: data.counts, low: data.low.slice(0, 5) }))
      .catch(() => {});
  }, [user?.role]);
  const { selectedCafeId, managedCafes, selectedCafeOverview, loading } = useAppSelector(
    (state) => state.cafe,
  );

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      void dispatch(fetchManagedCafesThunk());
    }
  }, [dispatch, user?.role]);

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
          <Card density="compact">
            <label className="mb-2 block text-sm font-medium text-muted" htmlFor="cafe-switcher">
              Select cafe
            </label>
            <Select
              id="cafe-switcher"
              value={selectedCafeId ?? ""}
              onChange={(event) => dispatch(setCafe(event.target.value || null))}
            >
              {managedCafes.map((cafe) => (
                <option key={cafe.id} value={cafe.id}>
                  {cafe.cafeName}
                </option>
              ))}
            </Select>
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
              href: "/supplier-bills?hasOutstanding=true",
            },
            {
              title: "Overdue bills",
              value: apMetrics ? formatMoney(apMetrics.overdueBillsAmount) : "—",
              href: "/supplier-bills?billStatus=OVERDUE",
            },
            {
              title: "Suppliers with dues",
              value: apMetrics ? String(apMetrics.suppliersWithOutstandingCount) : "—",
              href: "/supplier-bills",
            },
            {
              title: "Due this week",
              value: apMetrics ? formatMoney(apMetrics.billsDueThisWeekAmount) : "—",
              href: "/supplier-bills?dueWithinDays=7",
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
