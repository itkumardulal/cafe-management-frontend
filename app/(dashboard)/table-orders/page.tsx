"use client";

import axios from "axios";
import { Combine, RefreshCw, Split } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/src/components/shared/page-header";
import {
  TableFloorBoard,
  type FloorTable,
} from "@/src/components/table-orders/table-floor-board";
import { TableMenuPicker } from "@/src/components/table-orders/table-menu-picker";
import { TableOrderSlip } from "@/src/components/table-orders/table-order-slip";
import { TableOrdersEmptyWorkspace } from "@/src/components/table-orders/table-orders-empty-workspace";
import {
  tableOrdersFloorPanelJoined,
  tableOrdersMenuColumn,
  tableOrdersSlipColumn,
  tableOrdersWorkspacePanelJoined,
  tableOrdersWorkspaceSplit,
} from "@/src/components/table-orders/table-orders-layout";
import { TableOrdersPanel } from "@/src/components/table-orders/table-orders-panel";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { cn } from "@/src/lib/cn";
import { appToast } from "@/src/lib/toast";
import {
  isDeletedSessionUpdate,
  operationsApi,
  type TableOrderSessionDetail,
} from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchSellableCatalogThunk } from "@/src/store/slices/reference-data.slice";

type OrderLine = {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  maxQty: number;
};

const BOARD_POLL_MS = 12_000;

const vacantFloorTable = (table: FloorTable): FloorTable => ({
  ...table,
  status: "VACANT",
  sessionId: null,
  sessionTableNames: [],
  subtotal: null,
  lineCount: 0,
  lastItemName: null,
});

function markSessionClearedOnBoard(
  tables: FloorTable[],
  session: Pick<TableOrderSessionDetail, "id" | "tables">,
): FloorTable[] {
  const tableIds = new Set(session.tables.map((t) => t.tableId));
  return tables.map((t) => {
    if (tableIds.has(t.tableId) || t.sessionId === session.id) {
      return vacantFloorTable(t);
    }
    return t;
  });
}

function sessionToLines(session: TableOrderSessionDetail): OrderLine[] {
  return session.lines.map((l) => ({
    key: l.menuItemId,
    menuItemId: l.menuItemId,
    name: l.menuItemName,
    unitPrice: Number(l.unitPrice),
    qty: Number(l.quantity),
    maxQty: 999_999,
  }));
}

export default function TableOrdersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const catalog = useAppSelector((state) => state.referenceData.sellableCatalog);
  const sellableCatalogStatus = useAppSelector((state) => state.referenceData.sellableCatalogStatus);
  const catalogLoading = sellableCatalogStatus === "loading" && catalog.length === 0;
  const [board, setBoard] = useState<FloorTable[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [menuSearch, setMenuSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [session, setSession] = useState<TableOrderSessionDetail | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cancellingBilling, setCancellingBilling] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSelected, setMergeSelected] = useState<string[]>([]);
  const [unmergeOpen, setUnmergeOpen] = useState(false);
  const [unmergeTargetId, setUnmergeTargetId] = useState<string | null>(null);
  const [unmerging, setUnmerging] = useState(false);
  const [lastAddedKey, setLastAddedKey] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBoard = useCallback(async (silent = false, force = false) => {
    if (!silent) setBoardLoading(true);
    try {
      const data = await operationsApi.tableOrders.board({ force });
      setBoard(data.items);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load tables"));
    } finally {
      if (!silent) setBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sellableCatalogStatus === "idle") {
      void dispatch(fetchSellableCatalogThunk());
    }
  }, [dispatch, sellableCatalogStatus]);

  useEffect(() => {
    void loadBoard();
    const id = setInterval(() => void loadBoard(true), BOARD_POLL_MS);
    return () => clearInterval(id);
  }, [loadBoard]);

  const selectedTableIds = useMemo(
    () => session?.tables.map((t) => t.tableId) ?? [],
    [session],
  );

  const orderSubtotal = useMemo(() => {
    let t = 0;
    for (const l of orderLines) {
      t += Math.round(l.qty * l.unitPrice * 100) / 100;
    }
    return Math.round(t * 100) / 100;
  }, [orderLines]);

  const displayBoard = useMemo(() => {
    if (!session || session.status !== "OPEN") return board;

    const activeTableIds = new Set(session.tables.map((t) => t.tableId));

    return board.map((t) => {
      if (!activeTableIds.has(t.tableId)) return t;

      if (orderLines.length === 0) {
        return {
          ...t,
          status: "VACANT" as const,
          lineCount: 0,
          subtotal: null,
          lastItemName: null,
        };
      }

      return {
        ...t,
        status: "IN_PROGRESS" as const,
        lineCount: orderLines.length,
        subtotal: String(orderSubtotal),
        lastItemName: orderLines[orderLines.length - 1]?.name ?? null,
      };
    });
  }, [board, session, orderLines, orderSubtotal]);

  const boardSummary = useMemo(() => {
    const serving = displayBoard.filter((t) => t.status === "IN_PROGRESS").length;
    const billing = displayBoard.filter((t) => t.status === "IN_BILLING").length;
    const vacant = displayBoard.filter((t) => t.status === "VACANT").length;
    return { serving, billing, vacant, total: displayBoard.length };
  }, [displayBoard]);

  const openSession = useCallback(async (detail: TableOrderSessionDetail) => {
    setSession(detail);
    const lines = sessionToLines(detail);
    setOrderLines(lines);
    setLastAddedKey(lines.length > 0 ? lines[lines.length - 1]!.key : null);
    setMenuSearch("");
    setCategoryFilter("");
  }, []);

  const resolveSession = useCallback(async (sessionId: string) => {
    try {
      return await operationsApi.tableOrders.getSession(sessionId);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }, []);

  const handleTableClick = async (item: FloorTable) => {
    try {
      if (item.status === "IN_BILLING") {
        if (item.sessionId) router.push(`/pos?sessionId=${item.sessionId}`);
        return;
      }

      if (item.status === "VACANT") {
        if (item.sessionId) {
          const detail = await resolveSession(item.sessionId);
          if (detail) {
            await openSession(detail);
            return;
          }
          setBoard((prev) =>
            prev.map((t) => (t.tableId === item.tableId ? vacantFloorTable(t) : t)),
          );
        }
        const created = await operationsApi.tableOrders.createSession({
          tableId: item.tableId,
        });
        await openSession(created);
        await loadBoard(true, true);
        return;
      }

      if (item.sessionId) {
        const detail = await resolveSession(item.sessionId);
        if (detail) {
          await openSession(detail);
          return;
        }
        setBoard((prev) =>
          prev.map((t) => (t.tableId === item.tableId ? vacantFloorTable(t) : t)),
        );
        const created = await operationsApi.tableOrders.createSession({
          tableId: item.tableId,
        });
        await openSession(created);
        await loadBoard(true, true);
      }
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to open table order"));
    }
  };

  const persistLines = useCallback(
    async (lines: OrderLine[], currentSession: TableOrderSessionDetail) => {
      if (currentSession.status !== "OPEN") return;
      setSaving(true);
      try {
        const updated = await operationsApi.tableOrders.updateLines(currentSession.id, {
          version: currentSession.version,
          lines: lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.qty,
            unitPrice: l.unitPrice,
          })),
        });
        if (isDeletedSessionUpdate(updated)) {
          setBoard((prev) => markSessionClearedOnBoard(prev, currentSession));
          setSession(null);
          setOrderLines([]);
          setLastAddedKey(null);
          await loadBoard(true, true);
          appToast.success("Order cleared — table is vacant");
          return;
        }
        setSession(updated);
        setOrderLines(sessionToLines(updated));
        await loadBoard(true, true);
      } catch (error) {
        appToast.error(getApiErrorMessage(error, "Failed to save order"));
        const fresh = await operationsApi.tableOrders.getSession(currentSession.id);
        setSession(fresh);
        setOrderLines(sessionToLines(fresh));
      } finally {
        setSaving(false);
      }
    },
    [loadBoard],
  );

  const scheduleSave = useCallback(
    (lines: OrderLine[], currentSession: TableOrderSessionDetail) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (lines.length === 0) {
        void persistLines(lines, currentSession);
        return;
      }
      saveTimer.current = setTimeout(() => {
        void persistLines(lines, currentSession);
      }, 600);
    },
    [persistLines],
  );

  const addItem = (item: (typeof catalog)[number]) => {
    if (!session || session.status !== "OPEN") return;
    const maxQty = item.trackStock ? Number(item.quantityOnHand ?? 0) : 999_999;
    const price = Number(item.sellPricePerUnit);
    const next = (() => {
      const existing = orderLines.find((l) => l.menuItemId === item.id);
      if (existing) {
        const qty = Math.min(existing.qty + 1, maxQty);
        return orderLines.map((l) =>
          l.menuItemId === item.id ? { ...l, qty } : l,
        );
      }
      return [
        ...orderLines,
        {
          key: item.id,
          menuItemId: item.id,
          name: item.name,
          unitPrice: price,
          qty: 1,
          maxQty,
        },
      ];
    })();
    setOrderLines(next);
    setLastAddedKey(item.id);
    scheduleSave(next, session);
  };

  const updateLineQty = (key: string, qty: number) => {
    if (!session || session.status !== "OPEN") return;
    const next = orderLines.map((l) => (l.key === key ? { ...l, qty } : l));
    setOrderLines(next);
    scheduleSave(next, session);
  };

  const removeLine = (key: string) => {
    if (!session || session.status !== "OPEN") return;
    const next = orderLines.filter((l) => l.key !== key);
    setOrderLines(next);
    setLastAddedKey((prev) => {
      if (prev !== key) return prev;
      return next.length > 0 ? next[next.length - 1]!.key : null;
    });
    scheduleSave(next, session);
  };

  const cartQtyByItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of orderLines) map.set(l.menuItemId, l.qty);
    return map;
  }, [orderLines]);

  const vacantForMerge = useMemo(() => {
    if (!session) return [];
    const linkedIds = new Set(session.tables.map((t) => t.tableId));
    return displayBoard.filter(
      (b) => b.status === "VACANT" && !linkedIds.has(b.tableId),
    );
  }, [displayBoard, session]);

  const secondaryTables = useMemo(
    () => session?.tables.filter((t) => !t.isPrimary) ?? [],
    [session],
  );

  const primaryTableName = useMemo(() => {
    if (!session) return "";
    const primary = session.tables.find((t) => t.isPrimary);
    return primary?.tableName ?? session.tableNames[0] ?? "";
  }, [session]);

  const handleMerge = async () => {
    if (!session || mergeSelected.length === 0) return;
    try {
      const updated = await operationsApi.tableOrders.merge(session.id, {
        tableIds: mergeSelected,
        version: session.version,
      });
      await openSession(updated);
      setMergeOpen(false);
      setMergeSelected([]);
      await loadBoard(true, true);
      appToast.success("Tables merged into one order");
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to merge tables"));
    }
  };

  const handleUnmerge = async (tableId: string) => {
    if (!session) return;
    setUnmerging(true);
    try {
      const updated = await operationsApi.tableOrders.unmerge(session.id, {
        tableId,
        version: session.version,
      });
      await openSession(updated);
      setUnmergeOpen(false);
      setUnmergeTargetId(null);
      await loadBoard(true, true);
      appToast.success("Table separated from this order");
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to unmerge table"));
    } finally {
      setUnmerging(false);
    }
  };

  const handleCancelBilling = async () => {
    if (!session || session.status !== "IN_BILLING") return;
    setCancellingBilling(true);
    try {
      const updated = await operationsApi.tableOrders.cancelBilling(session.id);
      await openSession(updated);
      await loadBoard(true, true);
      appToast.success("Billing cancelled — you can edit the order again");
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to cancel billing"));
    } finally {
      setCancellingBilling(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!session) return;
    if (orderLines.length === 0) {
      appToast.error("Add at least one item before generating the bill");
      return;
    }
    setGenerating(true);
    try {
      let current = session;
      if (current.status === "OPEN") {
        const saved = await operationsApi.tableOrders.updateLines(current.id, {
          version: current.version,
          lines: orderLines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.qty,
            unitPrice: l.unitPrice,
          })),
        });
        if (isDeletedSessionUpdate(saved)) {
          setBoard((prev) => markSessionClearedOnBoard(prev, current));
          setSession(null);
          setOrderLines([]);
          setLastAddedKey(null);
          await loadBoard(true, true);
          appToast.error("Add at least one item before generating the bill");
          return;
        }
        current = saved;
      }
      await operationsApi.tableOrders.generateBill(current.id);
      router.push(`/pos?sessionId=${current.id}`);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to generate bill"));
    } finally {
      setGenerating(false);
    }
  };

  const closeWorkspace = () => {
    setSession(null);
    setOrderLines([]);
    setLastAddedKey(null);
  };

  return (
    <section className="page-shell flex min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 space-y-2 pb-3">
      <PageHeader
        title="Table service"
        description="Manage dine-in orders by table. Floor status updates every few seconds."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void loadBoard(false, true)}
              disabled={boardLoading}
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", boardLoading && "animate-spin")} />
              Refresh
            </Button>
            <Link href="/tables">
              <Button type="button" size="sm" variant="secondary">
                Manage tables
              </Button>
            </Link>
          </div>
        }
      />

      {board.length > 0 ? (
        <p className="text-xs text-[var(--color-muted)]">
          {boardSummary.total} tables · {boardSummary.vacant} vacant · {boardSummary.serving}{" "}
          serving · {boardSummary.billing} at checkout
        </p>
      ) : null}
      </div>

      {/* Same viewport contract as /pos — each column scrolls on its own */}
      <div
        className={cn(
          "flex h-[calc(100dvh-7.25rem)] min-h-0 shrink-0 flex-col overflow-hidden lg:h-[calc(100dvh-7.5rem)]",
          session
            ? "max-lg:gap-0 lg:grid lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:items-stretch lg:gap-0"
            : "gap-3 lg:grid lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:gap-4",
        )}
      >
        <TableOrdersPanel
          label="Service floor"
          title="Floor plan"
          description="Tap a table to open or resume"
          className={cn(
            "min-h-0 overflow-hidden",
            session && tableOrdersFloorPanelJoined,
          )}
          bodyClassName="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden"
          action={
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => void loadBoard(false, true)}
              disabled={boardLoading}
              aria-label="Refresh floor plan"
            >
              <RefreshCw className={cn("h-4 w-4", boardLoading && "animate-spin")} />
            </Button>
          }
        >
          <TableFloorBoard
            tables={displayBoard}
            loading={boardLoading}
            selectedTableIds={selectedTableIds}
            onSelectTable={(t) => void handleTableClick(t)}
          />
        </TableOrdersPanel>

        {!session ? (
          <TableOrdersPanel
            label="Order workspace"
            title="Waiting for selection"
            description="Select a table from the floor plan"
            className="min-h-0 overflow-hidden max-lg:min-h-[280px]"
            bodyClassName="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden"
          >
            <TableOrdersEmptyWorkspace />
          </TableOrdersPanel>
        ) : (
          <TableOrdersPanel
            label="Order workspace"
            title="Menu & order ticket"
            description={`${session.tableNames.join(", ")} · add dishes then generate bill`}
            className={cn("min-h-0 overflow-hidden", tableOrdersWorkspacePanelJoined)}
            bodyClassName="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden"
          >
            <div className={tableOrdersWorkspaceSplit}>
              <div className={tableOrdersMenuColumn}>
                <TableMenuPicker
                  catalog={catalog}
                  loading={catalogLoading}
                  search={menuSearch}
                  onSearchChange={setMenuSearch}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  qtyByItemId={cartQtyByItemId}
                  disabled={session.status !== "OPEN"}
                  onAddItem={addItem}
                />
              </div>
              <div className={tableOrdersSlipColumn}>
                <TableOrderSlip
                  tableNames={session.tableNames}
                  status={session.status}
                  saving={saving}
                  lines={orderLines}
                  lastAddedKey={lastAddedKey}
                  subtotal={orderSubtotal}
                  editable={session.status === "OPEN"}
                  generating={generating}
                  mergeDisabled={vacantForMerge.length === 0}
                  unmergeDisabled={secondaryTables.length === 0}
                  onMerge={() => setMergeOpen(true)}
                  onUnmerge={() => setUnmergeOpen(true)}
                  onClose={closeWorkspace}
                  onUpdateQty={updateLineQty}
                  onRemove={removeLine}
                  onGenerateBill={() => void handleGenerateBill()}
                  onCancelBilling={
                    session.status === "IN_BILLING"
                      ? () => void handleCancelBilling()
                      : undefined
                  }
                  cancellingBilling={cancellingBilling}
                  onGoToPos={
                    session.status === "IN_BILLING"
                      ? () => router.push(`/pos?sessionId=${session.id}`)
                      : undefined
                  }
                />
              </div>
            </div>
          </TableOrdersPanel>
        )}
      </div>

      <Modal
        open={mergeOpen}
        onClose={() => {
          setMergeOpen(false);
          setMergeSelected([]);
        }}
        title="Merge tables"
        description="Attach vacant tables to this order for one shared bill."
      >
        {vacantForMerge.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No vacant tables available to merge.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {vacantForMerge.map((t) => {
              const selected = mergeSelected.includes(t.tableId);
              return (
                <button
                  key={t.tableId}
                  type="button"
                  onClick={() =>
                    setMergeSelected((prev) =>
                      selected
                        ? prev.filter((id) => id !== t.tableId)
                        : [...prev, t.tableId],
                    )
                  }
                  className={cn(
                    "rounded-xl border px-3 py-4 text-center font-mono text-sm font-semibold transition-colors",
                    selected
                      ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] text-[var(--color-foreground)] ring-1 ring-[var(--color-primary)]/30"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-cream-100)]",
                  )}
                >
                  {t.tableName}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMergeOpen(false);
              setMergeSelected([]);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleMerge()}
            disabled={mergeSelected.length === 0}
          >
            Merge {mergeSelected.length > 0 ? `(${mergeSelected.length})` : ""}
          </Button>
        </div>
      </Modal>

      <Modal
        open={unmergeOpen}
        onClose={() => {
          if (unmerging) return;
          setUnmergeOpen(false);
          setUnmergeTargetId(null);
        }}
        title="Unmerge table"
        description={
          primaryTableName
            ? `Detach a table from this order. All items remain on ${primaryTableName}. Available only before Generate Bill.`
            : "Detach a merged table before billing."
        }
      >
        {secondaryTables.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No merged tables to separate.</p>
        ) : (
          <div className="space-y-2">
            {secondaryTables.map((t) => {
              const selected = unmergeTargetId === t.tableId;
              return (
                <button
                  key={t.tableId}
                  type="button"
                  disabled={unmerging}
                  onClick={() => setUnmergeTargetId(t.tableId)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                    selected
                      ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-cream-100)]",
                  )}
                >
                  <span className="font-mono text-sm font-semibold">{t.tableName}</span>
                  <span className="text-xs text-[var(--color-muted)]">Merged</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={unmerging}
            onClick={() => {
              setUnmergeOpen(false);
              setUnmergeTargetId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!unmergeTargetId || unmerging}
            onClick={() => unmergeTargetId && void handleUnmerge(unmergeTargetId)}
          >
            {unmerging ? "Separating…" : "Unmerge table"}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
