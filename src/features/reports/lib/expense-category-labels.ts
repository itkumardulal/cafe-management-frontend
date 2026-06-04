export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  NONE: "Uncategorized",
  RENT: "Rent",
  STAFF_SALARY: "Staff salary",
  STAFF1_SALARY: "Staff 1 salary",
  STAFF2_SALARY: "Staff 2 salary",
  STAFF3_SALARY: "Staff 3 salary",
  INTERNET: "Internet",
  ELECTRICITY: "Electricity",
  WATER: "Water",
  TRANSPORTATION_DELIVERY: "Transportation / delivery",
  MARKETING_PROMOTION: "Marketing / promotion",
  RAW_MATERIALS_INGREDIENTS: "Raw materials / ingredients",
  PACKAGING: "Packaging",
  LPG_COOKING_GAS: "Gas / LPG",
  MAINTENANCE_REPAIRS: "Maintenance / repairs",
  CLEANING_SUPPLIES: "Cleaning supplies",
  POS_SOFTWARE_WALLET_CHARGES: "POS / software charges",
  LICENSES_TAXES_MUNICIPALITY_FEES: "Licenses / taxes / fees",
  SECURITY_CCTV: "Security / CCTV",
  STAFF_MEALS_TEA: "Staff meals / tea",
  FESTIVAL_BONUS_OVERTIME: "Festival bonus / overtime",
  BANK_CHARGES: "Bank charges",
  MISCELLANEOUS: "Miscellaneous",
};

export function getExpenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABELS[category] ?? category;
}
