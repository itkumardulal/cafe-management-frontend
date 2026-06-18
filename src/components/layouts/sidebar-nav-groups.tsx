"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import {
  buildGroupedMenus,
  SIDEBAR_GROUP_ICONS,
  type MenuGroup,
} from "@/src/features/users/lib/permissions.config";
import { getMenuIcon } from "@/src/lib/menu-icons";
import { cn } from "@/src/lib/cn";
import type { MenuItem } from "@/src/types/auth";

type SidebarNavGroupsProps = {
  menus: MenuItem[];
  pathname: string;
  collapsed?: boolean;
  stockAlertCount?: number;
};

type GroupedMenus = ReturnType<typeof buildGroupedMenus<MenuItem>>;

function getActiveGroupId(groups: GroupedMenus, pathname: string) {
  return groups.find((group) => group.menus.some((menu) => menu.route === pathname))?.id ?? null;
}

function navLinkClass(active: boolean, tree = false) {
  return cn(
    "sidebar-nav-link touch-target",
    active && "sidebar-nav-link-active",
    active && tree && "sidebar-nav-link-tree-active",
  );
}

function getGroupIcon(group: MenuGroup<MenuItem>) {
  const key = SIDEBAR_GROUP_ICONS[group.id];
  if (key) {
    return getMenuIcon(key);
  }
  return getMenuIcon(group.menus[0]?.icon);
}

function groupHasActiveRoute(group: MenuGroup<MenuItem>, pathname: string) {
  return group.menus.some((menu) => menu.route === pathname);
}

type FlyoutAnchor = {
  top: number;
  left: number;
};

function CollapsedSidebarNav({
  groups,
  pathname,
  stockAlertCount,
}: {
  groups: GroupedMenus;
  pathname: string;
  stockAlertCount: number;
}) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [flyoutAnchor, setFlyoutAnchor] = useState<FlyoutAnchor | null>(null);
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeGroupId = useMemo(() => getActiveGroupId(groups, pathname), [groups, pathname]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updateFlyoutPosition = useCallback((groupId: string) => {
    const trigger = triggerRefs.current.get(groupId);
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    setFlyoutAnchor({
      top: rect.top,
      left: rect.right + 8,
    });
  }, []);

  const openFlyout = useCallback(
    (groupId: string) => {
      clearCloseTimer();
      setOpenGroupId(groupId);
      requestAnimationFrame(() => updateFlyoutPosition(groupId));
    },
    [clearCloseTimer, updateFlyoutPosition],
  );

  const scheduleCloseFlyout = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenGroupId(null);
      setFlyoutAnchor(null);
    }, 120);
  }, [clearCloseTimer]);

  const closeFlyout = useCallback(() => {
    clearCloseTimer();
    setOpenGroupId(null);
    setFlyoutAnchor(null);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!openGroupId) {
      return;
    }
    const handleReposition = () => updateFlyoutPosition(openGroupId);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [openGroupId, updateFlyoutPosition]);

  useEffect(() => {
    closeFlyout();
  }, [pathname, closeFlyout]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!openGroupId) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeFlyout();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeFlyout, openGroupId]);

  const openGroup = openGroupId
    ? groups.find((group) => group.id === openGroupId) ?? null
    : null;

  const flyout =
    openGroup && flyoutAnchor && typeof document !== "undefined"
      ? createPortal(
          <div
            className="sidebar-nav-flyout fixed z-[200] w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2 shadow-[var(--shadow-lg)]"
            style={{ top: flyoutAnchor.top, left: flyoutAnchor.left }}
            role="menu"
            aria-label={openGroup.label}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleCloseFlyout}
          >
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {openGroup.label}
            </p>
            <div className="space-y-0.5 px-1.5">
              {openGroup.menus.map((menu) => {
                const active = pathname === menu.route;
                const Icon = getMenuIcon(menu.icon);
                return (
                  <Link
                    key={menu.id}
                    href={menu.route}
                    className={cn(navLinkClass(active), "w-full")}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    onClick={closeFlyout}
                  >
                    <Icon size={15} className="sidebar-nav-icon shrink-0 opacity-70" aria-hidden />
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="truncate">{menu.name}</span>
                      {menu.route === "/inventory" && stockAlertCount > 0 ? (
                        <span className="shrink-0 rounded-full bg-[var(--color-danger)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {stockAlertCount > 99 ? "99+" : stockAlertCount}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="space-y-1">
        {groups.map((group) => {
          const isActive = groupHasActiveRoute(group, pathname);
          const Icon = getGroupIcon(group);

          if (group.menus.length === 1) {
            const menu = group.menus[0]!;
            const active = pathname === menu.route;
            const MenuIcon = getMenuIcon(menu.icon);
            return (
              <Link
                key={group.id}
                href={menu.route}
                className={cn(
                  navLinkClass(active),
                  "min-h-11 justify-center px-3 py-2.5",
                  active && "ring-1 ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]",
                  isActive && activeGroupId === group.id && "sidebar-nav-group-active",
                )}
                title={menu.name}
                aria-current={active ? "page" : undefined}
              >
                <MenuIcon size={16} className="sidebar-nav-icon shrink-0 opacity-70" aria-hidden />
                <span className="sr-only">{menu.name}</span>
              </Link>
            );
          }

          const isOpen = openGroupId === group.id;

          return (
            <button
              key={group.id}
              ref={(node) => {
                if (node) {
                  triggerRefs.current.set(group.id, node);
                } else {
                  triggerRefs.current.delete(group.id);
                }
              }}
              type="button"
              className={cn(
                "sidebar-nav-link touch-target min-h-11 w-full justify-center px-3 py-2.5",
                isActive && "sidebar-nav-link-active",
                isActive &&
                  "ring-1 ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]",
                isOpen && !isActive && "bg-[var(--color-cream-100)] text-[var(--color-nav-idle-hover)]",
              )}
              title={group.label}
              aria-label={group.label}
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onMouseEnter={() => openFlyout(group.id)}
              onMouseLeave={scheduleCloseFlyout}
              onFocus={() => openFlyout(group.id)}
              onBlur={scheduleCloseFlyout}
              onClick={() => {
                if (isOpen) {
                  closeFlyout();
                } else {
                  openFlyout(group.id);
                }
              }}
            >
              <Icon size={16} className="sidebar-nav-icon shrink-0 opacity-70" aria-hidden />
              <span className="sr-only">{group.label}</span>
            </button>
          );
        })}
      </div>
      {flyout}
    </>
  );
}

export function SidebarNavGroups({
  menus,
  pathname,
  collapsed = false,
  stockAlertCount = 0,
}: SidebarNavGroupsProps) {
  const groups = useMemo(() => buildGroupedMenus(menus), [menus]);
  const activeGroupId = useMemo(() => getActiveGroupId(groups, pathname), [groups, pathname]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (activeGroupId) {
      initial.add(activeGroupId);
    }
    return initial;
  });

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    setExpandedGroups((prev) => {
      if (prev.has(activeGroupId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(activeGroupId);
      return next;
    });
  }, [activeGroupId]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <CollapsedSidebarNav
        groups={groups}
        pathname={pathname}
        stockAlertCount={stockAlertCount}
      />
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => {
        const isExpanded = expandedGroups.has(group.id);
        const groupActive = groupHasActiveRoute(group, pathname);

        return (
          <div key={group.id} className="space-y-0.5">
            {groupIndex > 0 ? (
              <div className="mb-2 border-t border-[var(--color-border)]/60" aria-hidden />
            ) : null}

            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                "text-[var(--color-nav-idle)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)]",
                groupActive && "sidebar-nav-group-active",
              )}
              aria-expanded={isExpanded}
              aria-controls={`nav-group-${group.id}`}
            >
              <ChevronDown
                size={14}
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  isExpanded ? "rotate-0" : "-rotate-90",
                  groupActive ? "text-[var(--color-primary)]" : "text-muted",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-wider">
                {group.label}
              </span>
            </button>

            {isExpanded ? (
              <div
                id={`nav-group-${group.id}`}
                className={cn(
                  "sidebar-nav-tree space-y-0.5",
                  groupActive && "sidebar-nav-tree-active",
                )}
              >
                {group.menus.map((menu) => {
                  const active = pathname === menu.route;
                  const Icon = getMenuIcon(menu.icon);

                  return (
                    <Link
                      key={menu.id}
                      href={menu.route}
                      className={navLinkClass(active, true)}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={15} className="sidebar-nav-icon shrink-0 opacity-70" aria-hidden />
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate">{menu.name}</span>
                        {menu.route === "/inventory" && stockAlertCount > 0 ? (
                          <span className="shrink-0 rounded-full bg-[var(--color-danger)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {stockAlertCount > 99 ? "99+" : stockAlertCount}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
