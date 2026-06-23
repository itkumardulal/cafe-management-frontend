export type PrintMode = "thermal" | "qr" | "menu";

const MODE_CLASS: Record<PrintMode, string> = {
  thermal: "thermal-print-active",
  qr: "qr-print-active",
  menu: "menu-print-active",
};

export function activatePrintMode(mode: PrintMode) {
  if (typeof document === "undefined") return;
  deactivateAllPrintModes();
  document.body.classList.add(MODE_CLASS[mode]);
}

export function deactivatePrintMode(mode: PrintMode) {
  if (typeof document === "undefined") return;
  document.body.classList.remove(MODE_CLASS[mode]);
}

export function deactivateAllPrintModes() {
  if (typeof document === "undefined") return;
  Object.values(MODE_CLASS).forEach((cls) => document.body.classList.remove(cls));
}
