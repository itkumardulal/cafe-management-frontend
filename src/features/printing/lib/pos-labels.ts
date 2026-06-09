export function serviceLabel(type: "DINE_IN" | "DELIVERY"): string {
  return type === "DELIVERY" ? "Delivery" : "Dine in";
}
