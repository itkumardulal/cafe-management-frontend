"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { reportHref, type ReportPeriodParams } from "@/src/features/reports/types/reports.types";
import { REPORT_CATALOG } from "@/src/features/reports/lib/report-catalog";

const categoryVariant: Record<string, "default" | "success" | "warning"> = {
  Performance: "success",
  Finance: "warning",
  Operations: "default",
};

type ReportEntryCardsProps = {
  periodParams: ReportPeriodParams;
};

export function ReportEntryCards({ periodParams }: ReportEntryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {REPORT_CATALOG.map((entry, index) => {
        const Icon = entry.icon;
        const href = reportHref(`/reports/${entry.slug}`, periodParams);
        return (
          <motion.div
            key={entry.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.03, duration: 0.22 }}
            className="h-full"
          >
            <Link href={href} className="group block h-full">
              <Card
                density="comfortable"
                className="flex h-full flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] transition-colors group-hover:bg-[var(--color-primary)]/15">
                    <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{entry.title}</h3>
                      <Badge variant={categoryVariant[entry.category] ?? "default"} size="sm">
                        {entry.category}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted">{entry.description}</p>
                  </div>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)]">
                  Open report
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
