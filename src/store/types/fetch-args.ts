export type FetchForceArg = { force?: boolean } | void;

export type CafeOverviewArg = string | { cafeId: string; force?: boolean };

export function resolveOverviewCafeId(arg: CafeOverviewArg): string {
  return typeof arg === "string" ? arg : arg.cafeId;
}

export function isOverviewForce(arg: CafeOverviewArg): boolean {
  return typeof arg === "object" && Boolean(arg.force);
}
