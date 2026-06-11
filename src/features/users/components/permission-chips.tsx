import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/cn";
import type { StaffMenuAccess } from "@/src/store/types/user.types";
import { DASHBOARD_PERMISSION_CODE } from "@/src/features/users/lib/permissions.config";

type PermissionChipsProps = {
  menuAccess?: StaffMenuAccess[];
  maxVisible?: number;
  className?: string;
};

export function PermissionChips({
  menuAccess,
  maxVisible = 4,
  className,
}: PermissionChipsProps) {
  if (!menuAccess?.length) {
    return <span className="text-xs text-muted">—</span>;
  }

  const sorted = [...menuAccess].sort((a, b) => {
    if (a.menu.code === DASHBOARD_PERMISSION_CODE) return -1;
    if (b.menu.code === DASHBOARD_PERMISSION_CODE) return 1;
    return a.menu.name.localeCompare(b.menu.name);
  });

  const visible = sorted.slice(0, maxVisible);
  const hiddenCount = sorted.length - visible.length;
  const hiddenNames = sorted.slice(maxVisible).map((item) => item.menu.name).join(", ");
  const allNames = sorted.map((item) => item.menu.name).join(", ");

  return (
    <div
      className={cn(
        "flex max-w-full flex-wrap items-center justify-start gap-1.5 text-left",
        className,
      )}
      title={allNames}
    >
      {visible.map((item) => (
        <Badge
          key={item.menu.code}
          size="sm"
          variant="default"
          className="max-w-full whitespace-nowrap"
        >
          {item.menu.name}
        </Badge>
      ))}
      {hiddenCount > 0 ? (
        <Badge size="sm" variant="default" title={hiddenNames} className="shrink-0">
          +{hiddenCount}
        </Badge>
      ) : null}
    </div>
  );
}
