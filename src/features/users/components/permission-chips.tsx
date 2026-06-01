import { Badge } from "@/src/components/ui/badge";
import type { StaffMenuAccess } from "@/src/store/types/user.types";
import { REQUIRED_PERMISSION_CODE } from "@/src/features/users/lib/permissions.config";

type PermissionChipsProps = {
  menuAccess?: StaffMenuAccess[];
  maxVisible?: number;
};

export function PermissionChips({ menuAccess, maxVisible = 4 }: PermissionChipsProps) {
  if (!menuAccess?.length) {
    return <span className="text-xs text-muted">—</span>;
  }

  const sorted = [...menuAccess].sort((a, b) => {
    if (a.menu.code === REQUIRED_PERMISSION_CODE) return -1;
    if (b.menu.code === REQUIRED_PERMISSION_CODE) return 1;
    return a.menu.name.localeCompare(b.menu.name);
  });

  const visible = sorted.slice(0, maxVisible);
  const hiddenCount = sorted.length - visible.length;
  const hiddenNames = sorted.slice(maxVisible).map((item) => item.menu.name).join(", ");

  return (
    <div className="flex flex-wrap items-center gap-1" title={sorted.map((item) => item.menu.name).join(", ")}>
      {visible.map((item) => (
        <Badge key={item.menu.code} size="sm" variant="default">
          {item.menu.name}
        </Badge>
      ))}
      {hiddenCount > 0 ? (
        <Badge size="sm" variant="default" title={hiddenNames}>
          +{hiddenCount}
        </Badge>
      ) : null}
    </div>
  );
}
