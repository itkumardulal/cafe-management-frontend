"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { fetchAllReportPages } from "@/src/features/reports/lib/fetch-all-report-pages";
import {
  exportTableToExcel,
  type ExportExtraRow,
  type ExportTableColumn,
} from "@/src/features/reports/lib/export-table-to-excel";

type ReportExportButtonProps<T> = {
  fileName: string;
  sheetName?: string;
  columns: ExportTableColumn<T>[];
  mode: "loaded" | "fetchAll";
  rows?: T[];
  fetchAllPages?: (page: number, limit: number) => Promise<{ items: T[]; total: number }>;
  getFooterRow: (rows: T[]) => (string | number)[];
  extraRows?: ExportExtraRow[];
  disabled?: boolean;
};

export function ReportExportButton<T>({
  fileName,
  sheetName,
  columns,
  mode,
  rows = [],
  fetchAllPages,
  getFooterRow,
  extraRows,
  disabled = false,
}: ReportExportButtonProps<T>) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (disabled || exporting) {
      return;
    }

    setExporting(true);
    try {
      let exportRows = rows;
      let truncated = false;
      let total = rows.length;

      if (mode === "fetchAll") {
        if (!fetchAllPages) {
          throw new Error("fetchAllPages is required for fetchAll export mode");
        }
        const result = await fetchAllReportPages({ fetchPage: fetchAllPages });
        exportRows = result.items;
        truncated = result.truncated;
        total = result.total;
      }

      if (exportRows.length === 0) {
        toast.error("No data to export");
        return;
      }

      await exportTableToExcel({
        fileName,
        sheetName,
        columns,
        rows: exportRows,
        footerRow: getFooterRow(exportRows),
        extraRows,
      });

      if (truncated) {
        toast.warning(`Exported ${exportRows.length} of ${total} records`);
      } else {
        toast.success("Report exported to Excel");
      }
    } catch {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={disabled || exporting}
      onClick={() => void handleExport()}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      Export to Excel
    </Button>
  );
}
