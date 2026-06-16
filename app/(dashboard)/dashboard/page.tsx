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
import { CafeAnalyticsDashboard } from "@/src/features/analytics/components/cafe-analytics-dashboard";
import { DEFAULT_PAGE_SIZE, getStoredPageSize, setStoredPageSize, type PageSizeOption } from "@/src/lib/pagination-storage";
import { appToast } from "@/src/lib/toast";
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
  const {
    selectedCafeId,
    managedCafes,
    selectedCafeOverview,
    managedCafesStatus,
    overviewStatus,
    overviewLoadedCafeId,
  } = useAppSelector((state) => state.cafe);
  const loading =
    (managedCafesStatus === "loading" && managedCafes.length === 0) ||
    (overviewStatus === "loading" && selectedCafeOverview === null);
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
    const overviewCached =
      overviewStatus === "loaded" &&
      overviewLoadedCafeId === selectedCafeId &&
      selectedCafeOverview !== null;
    if (overviewCached) {
      return;
    }

    let cancelled = false;
    void dispatch(fetchCafeOverviewThunk(selectedCafeId)).then((result) => {
      if (cancelled) {
        return;
      }
      if (
        fetchCafeOverviewThunk.rejected.match(result) &&
        !result.meta.aborted &&
        !result.meta.condition
      ) {
        appToast.error(result.payload ?? "Failed to load cafe overview");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedCafeId, user?.role]);

  if (user?.role === "SUPER_ADMIN") {
    return (
      <section className="page-shell page-content min-w-0">
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
          <Card density="compact" className="w-full min-w-0 overflow-hidden p-0">
            <div className="space-y-2 p-4">
              <label className="block text-sm font-medium text-muted" htmlFor="cafe-switcher">
                Select cafe
              </label>
              <Select
                searchable
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
            <div className="grid w-full min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
              {[
                { title: "Total users", value: selectedCafeOverview.metrics.totalUsers },
                { title: "Total staff", value: selectedCafeOverview.metrics.totalStaff },
                { title: "Active staff", value: selectedCafeOverview.metrics.activeStaff },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  className="min-w-0 w-full max-w-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card density="compact" className="w-full min-w-0 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-subtle">{item.title}</p>
                    <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                    <Badge variant="default" size="sm">
                      Read-only
                    </Badge>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card density="comfortable" className="w-full min-w-0 space-y-2">
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

  return <CafeAnalyticsDashboard />;
}
