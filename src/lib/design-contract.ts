/**
 * Design contract — single source of truth for breakpoints and layout tiers.
 * See docs/DESIGN_CONTRACT.md for full token and responsive matrix documentation.
 */

/** Mobile: card lists, drawer nav, full-width CTAs */
export const BREAKPOINT_MOBILE_MAX = 767;

/** Tablet: data tables, 2-col forms */
export const BREAKPOINT_TABLET_MIN = 768;

/** Desktop: collapsible sidebar */
export const BREAKPOINT_DESKTOP_MIN = 1024;

/** Large desktop: max-width shell, 4-col dashboard */
export const BREAKPOINT_LARGE_MIN = 1440;

export const MEDIA_MOBILE = `(max-width: ${BREAKPOINT_MOBILE_MAX}px)` as const;
export const MEDIA_TABLET_UP = `(min-width: ${BREAKPOINT_TABLET_MIN}px)` as const;
export const MEDIA_DESKTOP_UP = `(min-width: ${BREAKPOINT_DESKTOP_MIN}px)` as const;
export const MEDIA_LARGE_UP = `(min-width: ${BREAKPOINT_LARGE_MIN}px)` as const;

/** Tailwind class prefixes aligned to this contract */
export const TW = {
  mobile: "",
  tablet: "md:",
  desktop: "lg:",
  large: "xl:",
} as const;

/** Z-index scale (also defined as CSS vars in globals.css) */
export const Z_INDEX = {
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50,
} as const;
