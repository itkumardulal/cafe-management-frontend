export const PROFIT_VS_EXPENSE_SECTION_IDS = {
  expenseCategories: "pve-expense-categories",
  profitableItems: "pve-profitable-items",
  discountTransactions: "pve-discount-transactions",
} as const;

export type ProfitVsExpenseDetailSectionLinks = {
  expenseCategories?: string;
  profitableItems?: string;
  discountTransactions?: string;
};

export function scrollToReportSection(sectionId: string) {
  const target = document.getElementById(sectionId);
  if (!target) {
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}
