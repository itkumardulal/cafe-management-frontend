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

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f4f0eb",
    logging: false,
    removeContainer: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const slug = data.cafe.slug || "menu";
  pdf.save(`${slug}-menu.pdf`);
}

export { formatSubtitle, formatPrice };
