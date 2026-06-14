"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getMenuIcon } from "@/src/lib/menu-icons";
import { cn } from "@/src/lib/cn";
import { buildGroupedMenus } from "@/src/features/users/lib/permissions.config";
import type { MenuItem } from "@/src/types/auth";

type SidebarNavGroupsProps = {
  menus: MenuItem[];
  pathname: string;
  collapsed?: boolean;
  stockAlertCount?: number;
};

function getActiveGroupId(groups: ReturnType<typeof buildGroupedMenus<MenuItem>>, pathname: string) {
  return groups.find((group) => group.menus.some((menu) => menu.route === pathname))?.id ?? null;
}

function navLinkClass(active: boolean, tree = false) {
  return cn(
    "sidebar-nav-link touch-target",
    active && "sidebar-nav-link-active",
    active && tree && "sidebar-nav-link-tree-active",
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
      <div className="space-y-1">
        {menus.map((menu) => {
          const active = pathname === menu.route;
          const Icon = getMenuIcon(menu.icon);
          return (
            <Link
              key={menu.id}
              href={menu.route}
              className={cn(
                navLinkClass(active),
                "min-h-11 justify-center px-3 py-2.5",
                active && "ring-1 ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]",
              )}
              title={menu.name}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={16} className="sidebar-nav-icon shrink-0 opacity-70" aria-hidden />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => {
        const isExpanded = expandedGroups.has(group.id);
        const groupHasActiveRoute = group.menus.some((menu) => menu.route === pathname);

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
                groupHasActiveRoute && "sidebar-nav-group-active",
              )}
              aria-expanded={isExpanded}
              aria-controls={`nav-group-${group.id}`}
            >
              <ChevronDown
                size={14}
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  isExpanded ? "rotate-0" : "-rotate-90",
                  groupHasActiveRoute ? "text-[var(--color-primary)]" : "text-muted",
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
                className={cn("sidebar-nav-tree space-y-0.5", groupHasActiveRoute && "sidebar-nav-tree-active")}
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
