import { type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export type TableHeaderConfig = {
  label: string;
  thClassName?: string;
  labelWrapperClassName?: string;
  headerContent?: ReactNode;
};

export type TableHeader = string | TableHeaderConfig;

function normalizeHeader(header: TableHeader): TableHeaderConfig {
  return typeof header === "string" ? { label: header } : header;
}

export function ResponsiveTable({
  headers,
  children,
  className,
  ariaLabel,
  density = "comfortable",
  variant = "card",
}: {
  headers: TableHeader[];
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  density?: "compact" | "comfortable";
  /** `embedded` removes outer card chrome for use inside modals/detail panels. */
  variant?: "card" | "embedded";
}) {
  const cellPad = density === "comfortable" ? "px-4 py-3" : "px-3 py-2.5";
  const isEmbedded = variant === "embedded";

  return (
    <div
      className={cn(
        isEmbedded ? "overflow-hidden p-0" : "surface-card overflow-hidden p-0",
        className,
      )}
    >
      <div className="max-w-full overflow-x-auto">
        <table
          className={cn(
            "w-full text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_td]:align-middle",
            isEmbedded
              ? "min-w-full [&_tbody_tr:first-child]:border-t-0 [&_tbody_tr:hover]:bg-transparent [&_tbody_tr:focus-within]:bg-transparent"
              : "min-w-[640px] [&_tbody_tr:hover]:bg-[var(--color-surface-muted)] [&_tbody_tr:focus-within]:bg-[var(--color-primary-soft)]",
          )}
          aria-label={ariaLabel}
        >
          <thead
            className={cn(
              "text-[var(--color-muted)]",
              isEmbedded
                ? "border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]"
                : "sticky top-0 bg-[var(--color-cream-100)]",
            )}
          >
            <tr>
              {headers.map((header) => {
                const column = normalizeHeader(header);
                return (
                  <th
                    key={typeof column.label === "string" ? column.label : column.headerContent?.toString()}
                    className={cn("font-medium", cellPad, column.thClassName)}
                  >
                    {column.headerContent ? (
                      column.headerContent
                    ) : column.labelWrapperClassName ? (
                      <div className={column.labelWrapperClassName}>{column.label}</div>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

/** Center short/fixed-width column content (counts, badges, status, actions). */
export const tableCenterColumnClass = "text-center";
export const tableCenterCellClass = "text-center";

/** Right-align numeric/money columns with longer values. */
export const tableNumericColumnClass = "text-right";
export const tableNumericCellClass = "text-right tabular-nums";

/** Action button column — header and cells centered. */
export const tableActionsColumnClass = "text-center";
export const tableActionsCellClass = "flex justify-center";
