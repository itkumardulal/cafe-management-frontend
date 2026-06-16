import { Badge } from "@/src/components/ui/badge";
import { assetStatusLabel, assetStatusVariant } from "@/src/lib/asset-status";
import type { AssetStatus } from "@/src/lib/asset-types";

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge variant={assetStatusVariant(status)} size="sm">
      {assetStatusLabel(status)}
    </Badge>
  );
}
