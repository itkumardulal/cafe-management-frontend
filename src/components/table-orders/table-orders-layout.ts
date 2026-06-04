import { cn } from "@/src/lib/cn";

export const tableOrdersPanelShell =
  "flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]";

/** Shared panel header height so floor + workspace tops align */
export const tableOrdersPanelHeader =
  "flex min-h-[4.25rem] shrink-0 items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-4 py-3";

/** Floor panel when joined to workspace (flush, divider on workspace left) */
export const tableOrdersFloorPanelJoined = cn(
  "max-lg:max-h-[36vh] max-lg:shrink-0 lg:max-h-none",
  "lg:rounded-r-none lg:rounded-br-none lg:border-r-0",
);

/** Workspace panel when joined to floor — full-height vertical rule on the left */
export const tableOrdersWorkspacePanelJoined = cn(
  "lg:rounded-l-none lg:rounded-tl-none lg:border-l lg:border-[var(--color-border)]",
);

/** Menu + ticket grid — vertical rule between columns (desktop) */
export const tableOrdersWorkspaceSplit = cn(
  "grid min-h-0 flex-1 basis-0 gap-0 overflow-hidden",
  "max-lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] max-lg:divide-y max-lg:divide-[var(--color-border)]",
  "lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:divide-x lg:divide-[var(--color-border)]",
  "xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]",
);

/** Menu column inside workspace */
export const tableOrdersMenuColumn = "flex min-h-0 min-w-0 flex-col overflow-hidden";

/** Ticket column inside workspace */
export const tableOrdersSlipColumn = "flex min-h-0 min-w-0 flex-col overflow-hidden";

export const tableOrdersScrollArea =
  "table-orders-scroll min-h-0 min-w-0 flex-1 basis-0 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]";
