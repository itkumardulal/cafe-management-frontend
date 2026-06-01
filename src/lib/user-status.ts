export type UserStatus = "INVITED" | "ACTIVE" | "INACTIVE" | "LOCKED";

export const userStatusLabel = (status?: UserStatus, isActive?: boolean): string => {
  if (status === "INVITED") return "Invited";
  if (status === "LOCKED") return "Locked";
  if (status === "INACTIVE" || isActive === false) return "Inactive";
  if (status === "ACTIVE" || isActive) return "Active";
  return "Active";
};

export const userStatusBadgeVariant = (
  status?: UserStatus,
  isActive?: boolean,
): "success" | "warning" | "default" => {
  if (status === "ACTIVE" || (isActive && status !== "INVITED" && status !== "LOCKED")) {
    return "success";
  }
  if (status === "INVITED" || status === "LOCKED" || !isActive) {
    return "warning";
  }
  return "default";
};
