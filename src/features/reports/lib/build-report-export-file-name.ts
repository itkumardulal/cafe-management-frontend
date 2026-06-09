function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildReportExportFileName(
  reportSlug: string,
  sectionSlug: string,
  periodLabel?: string,
): string {
  const parts = [reportSlug, sectionSlug, periodLabel ? slugifySegment(periodLabel) : undefined].filter(
    Boolean,
  );
  return `${parts.join("-")}.xlsx`;
}
