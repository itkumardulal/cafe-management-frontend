import { type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export function ResponsiveTable({
  headers,
  children,
  className,
  ariaLabel,
  density = "comfortable",
}: {
  headers: string[];
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  density?: "compact" | "comfortable";
}) {
  return (
    <div className={cn("surface-card overflow-hidden p-0", className)}>
      <div className="max-w-full overflow-x-auto">
        <table
          className="min-w-[640px] w-full text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[var(--color-surface-muted)] [&_tbody_tr:focus-within]:bg-[var(--color-primary-soft)] [&_tbody_td]:align-middle"
          aria-label={ariaLabel}
        >
          <thead className="sticky top-0 bg-[var(--color-cream-100)] text-[var(--color-muted)]">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className={cn(
                    "font-medium",
                    density === "comfortable" ? "px-4 py-3" : "px-3 py-2.5",
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
