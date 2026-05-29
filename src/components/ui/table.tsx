import { type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export type TableHeaderConfig = {
  label: string;
  thClassName?: string;
  labelWrapperClassName?: string;
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
}: {
  headers: TableHeader[];
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  density?: "compact" | "comfortable";
}) {
  const cellPad = density === "comfortable" ? "px-4 py-3" : "px-3 py-2.5";

  return (
    <div className={cn("surface-card overflow-hidden p-0", className)}>
      <div className="max-w-full overflow-x-auto">
        <table
          className="min-w-[640px] w-full text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[var(--color-surface-muted)] [&_tbody_tr:focus-within]:bg-[var(--color-primary-soft)] [&_tbody_td]:align-middle"
          aria-label={ariaLabel}
        >
          <thead className="sticky top-0 bg-[var(--color-cream-100)] text-[var(--color-muted)]">
            <tr>
              {headers.map((header) => {
                const column = normalizeHeader(header);
                return (
                  <th
                    key={column.label}
                    className={cn("font-medium", cellPad, column.thClassName)}
                  >
                    {column.labelWrapperClassName ? (
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

/** Aligns action buttons to the column end with the header centered above them. */
export const tableActionsColumnClass =
  "ml-auto flex w-[9.75rem] flex-col items-center";
export const tableActionsCellClass = "ml-auto flex w-[9.75rem] justify-center";
