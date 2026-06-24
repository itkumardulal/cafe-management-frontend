import type { PrintableMenuData } from "../types";

function formatSubtitle(item: PrintableMenuData["specials"][number]): string | null {
  const parts: string[] = [];
  if (item.unitQuantity && item.unitType) {
    parts.push(`${item.unitQuantity} ${item.unitType}`);
  }
  if (item.itemType?.trim()) {
    parts.push(item.itemType.trim());
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function formatPrice(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return `Rs ${n.toLocaleString("en-NP", { maximumFractionDigits: 0 })}`;
}

const SCALE = 2;

type Interval = { top: number; bottom: number };

/**
 * Collects vertical ranges (in canvas px) that must never be split across a
 * page break: each menu item, plus every section's title bound together with
 * its first item so a heading is never orphaned at the bottom of a page.
 * Because the sheet is laid out in two columns, a horizontal cut at a given y
 * must clear items in BOTH columns — every item is added independently so the
 * safe-cut search below honours whichever column has content at that y.
 */
function collectForbiddenIntervals(element: HTMLElement): Interval[] {
  const originTop = element.getBoundingClientRect().top;
  const toCanvas = (clientY: number) => (clientY - originTop) * SCALE;
  const intervals: Interval[] = [];

  const pushRange = (topClient: number, bottomClient: number) => {
    const top = toCanvas(topClient);
    const bottom = toCanvas(bottomClient);
    if (bottom > top) intervals.push({ top, bottom });
  };

  element.querySelectorAll<HTMLElement>(".menu-print-section").forEach((section) => {
    const title = section.querySelector<HTMLElement>(".menu-print-section-title");
    const firstItem = section.querySelector<HTMLElement>(".menu-print-item");
    if (title) {
      const titleRect = title.getBoundingClientRect();
      const anchorBottom = firstItem
        ? firstItem.getBoundingClientRect().bottom
        : titleRect.bottom;
      pushRange(titleRect.top, anchorBottom);
    }
  });

  element.querySelectorAll<HTMLElement>(".menu-print-item").forEach((item) => {
    const r = item.getBoundingClientRect();
    pushRange(r.top, r.bottom);
  });

  return intervals;
}

/** Returns the top of an interval that strictly contains y, or null if y is safe. */
function straddlingTop(y: number, intervals: Interval[]): number | null {
  let highestTop: number | null = null;
  for (const iv of intervals) {
    if (y > iv.top + 0.5 && y < iv.bottom - 0.5) {
      highestTop = highestTop === null ? iv.top : Math.min(highestTop, iv.top);
    }
  }
  return highestTop;
}

/** Finds the largest safe cut <= desiredEnd that doesn't split any item. */
function findSafeCut(
  desiredEnd: number,
  pageStart: number,
  intervals: Interval[],
): number {
  let cut = desiredEnd;
  let guard = 0;
  while (guard < 5000) {
    const top = straddlingTop(cut, intervals);
    if (top === null) break;
    cut = top;
    guard += 1;
  }
  // An item taller than a full page can't be honoured — force a hard cut.
  if (cut <= pageStart + 1) return desiredEnd;
  return cut;
}

export async function exportMenuToPdf(
  data: PrintableMenuData,
  element: HTMLElement,
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  // Clear any active text selection so html2canvas doesn't bake the
  // browser ::selection highlight (blue band) into the captured image.
  if (typeof window !== "undefined") {
    window.getSelection?.()?.removeAllRanges();
  }

  const intervals = collectForbiddenIntervals(element);

  const canvas = await html2canvas(element, {
    scale: SCALE,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    removeContainer: true,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();

  const pxPerMm = canvas.width / pageWidthMm;
  const pageHeightPx = pageHeightMm * pxPerMm;
  const totalPx = canvas.height;

  let pageStart = 0;
  let firstPage = true;

  while (pageStart < totalPx - 1) {
    const desiredEnd = Math.min(pageStart + pageHeightPx, totalPx);
    const pageEnd =
      desiredEnd >= totalPx
        ? totalPx
        : findSafeCut(desiredEnd, pageStart, intervals);

    const sliceHeight = Math.max(1, Math.round(pageEnd - pageStart));

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        pageStart,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );
    }

    const imgData = pageCanvas.toDataURL("image/png");
    const sliceHeightMm = sliceHeight / pxPerMm;
    if (!firstPage) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, sliceHeightMm);
    firstPage = false;

    pageStart = pageEnd;
  }

  const slug = data.cafe.slug || "menu";
  pdf.save(`${slug}-menu.pdf`);
}

export { formatSubtitle, formatPrice };
