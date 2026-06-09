export type PaperProfile = {
  id: string;
  widthMm: number;
  printableWidthMm: number;
  maxChars: number;
  cssWidth: string;
  paddingMm: number;
};

export const PAPER_80MM: PaperProfile = {
  id: "80mm",
  widthMm: 80,
  printableWidthMm: 72,
  maxChars: 42,
  cssWidth: "80mm",
  paddingMm: 3,
};

/** Stub for future 58mm support — not wired to UI yet. */
export const PAPER_58MM: PaperProfile = {
  id: "58mm",
  widthMm: 58,
  printableWidthMm: 48,
  maxChars: 32,
  cssWidth: "58mm",
  paddingMm: 2,
};

export const DEFAULT_PAPER_PROFILE = PAPER_80MM;
