"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Select } from "@/src/components/ui/select";
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
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="heading-display text-foreground">Cafe Overview (Read-only)</h1>
            <p className="text-muted sm:text-base">
              Switch cafe context to view summary data for cafes you created.
            </p>
          </div>
          <Link href="/cafe-admins/create">
            <Button type="button" size="sm">
              Create Cafe Admin
            </Button>
          </Link>
        </div>

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
        {["Today Orders", "Revenue", "Active Tables", "Staff On Duty"].map((title, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card density="compact" className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-subtle">{title}</p>
              <p className="text-2xl font-semibold text-foreground">--</p>
              <Badge variant="default" size="sm">
                Live soon
              </Badge>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card density="comfortable">
        <p className="text-muted">
          This dashboard is optimized for staff use with a mobile-first layout, fast touch targets,
          and reusable UI patterns.
        </p>
      </Card>
    </section>
  );
}
