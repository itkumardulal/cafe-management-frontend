"use client";

import { useMemo, Fragment } from "react";
import { cn } from "@/src/lib/cn";
import type { AssignableMenu } from "@/src/store/types/user.types";
import {
  buildGroupedMenus,
  DASHBOARD_PERMISSION_CODE,
  normalizePermissionCodes,
} from "@/src/features/users/lib/permissions.config";

type PermissionsPickerProps = {
  menus: AssignableMenu[];
  value: string[];
  onChange: (codes: string[]) => void;
  className?: string;
  description?: string;
};

export function PermissionsPicker({
  menus,
  value,
  onChange,
  className,
  description = "Choose which sections appear in the sidebar for this role. Dashboard is optional — select at least one area.",
}: PermissionsPickerProps) {
  const selected = useMemo(() => normalizePermissionCodes(value), [value]);
  const groups = useMemo(() => buildGroupedMenus(menus), [menus]);

  const toggleCode = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((item) => item !== code));
      return;
    }
    onChange([...selected, code]);
  };

  const setGroupSelection = (groupCodes: string[], enabled: boolean) => {
    if (enabled) {
      onChange(normalizePermissionCodes([...selected, ...groupCodes]));
      return;
    }
    onChange(selected.filter((code) => !groupCodes.includes(code)));
  };

  const isGroupFullySelected = (groupCodes: string[]) =>
    groupCodes.every((code) => selected.includes(code));

  const isGroupPartiallySelected = (groupCodes: string[]) =>
    groupCodes.some((code) => selected.includes(code)) && !isGroupFullySelected(groupCodes);

  if (menus.length === 0) {
    return <p className="text-sm text-muted">Loading permissions…</p>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">App access</p>
        <p className="text-xs text-muted">{description}</p>
      </div>

      <div className="space-y-3 md:space-y-4">
        {groups.map((group) => {
          const groupCodes = group.menus.map((menu) => menu.code);
          const allSelected = isGroupFullySelected(groupCodes);
          const someSelected = isGroupPartiallySelected(groupCodes);

          const groupHeader = (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{group.label}</h4>
                {group.description ? (
                  <p className="text-xs text-muted">{group.description}</p>
                ) : null}
              </div>
              {groupCodes.length > 1 ? (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="font-medium text-[var(--color-foreground)] underline-offset-2 hover:underline"
                    onClick={() => setGroupSelection(groupCodes, true)}
                  >
                    Select all
                  </button>
                  <span className="text-[var(--color-border)]" aria-hidden>
                    |
                  </span>
                  <button
                    type="button"
                    className="font-medium text-[var(--color-muted)] underline-offset-2 hover:underline"
                    onClick={() => setGroupSelection(groupCodes, false)}
                    disabled={!someSelected && !allSelected}
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>
          );

          const groupItems = (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {group.menus.map((menu) => {
                const checked = selected.includes(menu.code);

                return (
                  <label
                    key={menu.code}
                    className={cn(
                      "touch-target flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors",
                      checked
                        ? "border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-nav-idle)]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCode(menu.code)}
                      className="h-4 w-4 rounded border-[var(--color-input)]"
                    />
                    <span className="text-[var(--color-foreground)]">{menu.name}</span>
                    {menu.code === DASHBOARD_PERMISSION_CODE ? (
                      <span className="ml-auto text-[11px] text-muted">Optional</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          );

          return (
            <Fragment key={group.id}>
              <section
                key={`${group.id}-desktop`}
                className="hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 p-3 md:block"
              >
                <div className="mb-2.5">{groupHeader}</div>
                {groupItems}
              </section>
              <section
                key={`${group.id}-mobile`}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 md:hidden"
              >
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 [&::-webkit-details-marker]:hidden">
                    {groupHeader}
                    <span className="shrink-0 text-xs text-[var(--color-muted)]">
                      {groupCodes.filter((code) => selected.includes(code)).length}/{groupCodes.length}
                    </span>
                  </summary>
                  <div className="border-t border-[var(--color-border)] px-3 pb-3 pt-2">
                    {groupItems}
                  </div>
                </details>
              </section>
            </Fragment>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        {selected.length} of {menus.length} areas selected
      </p>
    </div>
  );
}
