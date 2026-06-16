import type { AssetStatus } from "@/src/lib/asset-types";

export function assetStatusLabel(status: AssetStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "UNDER_MAINTENANCE":
      return "Under maintenance";
    case "DAMAGED":
      return "Damaged";
    case "DISPOSED":
      return "Disposed";
    default:
      return status;
  }
}

export function assetStatusVariant(
  status: AssetStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "UNDER_MAINTENANCE":
      return "warning";
    case "DAMAGED":
      return "danger";
    case "DISPOSED":
      return "default";
    default:
      return "default";
  }
}
