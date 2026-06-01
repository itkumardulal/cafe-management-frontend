# Design Contract

**Status:** Locked for Phase 2 (frontend-only).  
**Source of truth:** [`app/globals.css`](../app/globals.css), [`src/lib/design-contract.ts`](../src/lib/design-contract.ts)

Do not change breakpoint values or semantic token names without updating this document and the TypeScript contract.

---

## Visual tokens

| Category | CSS variables | Notes |
|----------|---------------|-------|
| Brand | `--color-primary`, `--color-primary-hover`, `--color-primary-soft`, `--color-primary-foreground` | Orange cafe identity |
| Surfaces | `--color-background`, `--color-surface`, `--color-surface-muted` | Page vs card hierarchy |
| Text | `--color-foreground`, `--color-muted`, `--color-subtle` | Body, secondary, tertiary |
| Nav | `--color-nav-idle`, `--color-nav-idle-hover`, `--color-nav-active-text` | Sidebar/drawer |
| Status | `--color-success`, `--color-warning`, `--color-danger` | Badges, alerts |
| Borders | `--color-border`, `--color-input` | Cards, inputs |
| Cream scale | `--color-cream-50` … `--color-cream-200` | Warm neutrals |
| Radius | `--radius-sm` … `--radius-2xl` | 0.5rem – 1.5rem |
| Shadow | `--shadow-sm`, `--shadow-md`, `--shadow-lg` | Elevation |
| Motion | `--motion-quick` (150ms), `--motion-normal` (220ms), `--motion-panel` (280ms) | Transitions |
| Typography | `--font-size-xs` … `--font-size-2xl`, `--line-tight/normal/relaxed` | Rhythm |
| Touch | `--min-height-touch: 44px` | Minimum tap target |
| Z-index | `--z-dropdown`, `--z-sticky`, `--z-overlay`, `--z-modal` | Layering |

Dark mode overrides live under `html.dark` in `globals.css` with the same variable names.

---

## Responsive behavior matrix

| Tier | Viewport | Tailwind | List layout | Navigation | Forms / modals |
|------|----------|----------|-------------|------------|----------------|
| **Mobile** | 320–767px | default | **Card lists** (`ListCard`, `md:hidden`) | Drawer (`lg:hidden`) | Single column; modal sheet or fullscreen; sticky `FormFooter` |
| **Tablet** | 768–1023px | `md:` | **Data tables** | Drawer until `lg` | `sm:grid-cols-2` for paired fields |
| **Desktop** | 1024px+ | `lg:` | Data tables | Collapsible sidebar | Centered modal dialog |
| **Large** | 1440px+ | `xl:` / `min-[1440px]:` | Data tables | Sidebar | `page-shell` max-width 1400px |

### Rules (non-negotiable)

1. Table ↔ card switch at **`md` (768px)** on all list pages.
2. Sidebar drawer below **`lg` (1024px)**.
3. Dashboard metrics: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`.
4. Mobile inputs: **`text-base` (16px)** on focus to prevent iOS zoom (`Input` default).
5. Sticky bars / modal footers: use `.safe-bottom` / `.safe-top` for notch devices.
6. Primary actions: **full-width on mobile** (`Button fullWidth`, `FormFooter`, `PageHeader` action slot).
7. POS only: extra bottom padding + floating cart bar (`safe-bottom`, not global `main` padding).

### Utility classes

| Class | Purpose |
|-------|---------|
| `.page-shell` | Max-width 1400px centered container |
| `.page-content` | Responsive vertical gap (16 → 20 → 24px) |
| `.heading-display` | Responsive page title (clamp) |
| `.surface-card` | Standard card surface |
| `.touch-target` | min-height 44px |
| `.sr-only` | Screen-reader only |
| `.safe-bottom` / `.safe-top` | `env(safe-area-inset-*)` |
| `.gap-page` / `.p-card` | Responsive spacing |

### Motion

- Respect `prefers-reduced-motion: reduce` (global override in `globals.css`).
- Drawer/modal: spring or 240ms panel; prefer CSS on low-end mobile where possible.

---

## Breakpoint constants (TypeScript)

```ts
import { BREAKPOINT_MOBILE_MAX, MEDIA_MOBILE, TW } from "@/src/lib/design-contract";
import { useIsMobileViewport } from "@/src/hooks/use-breakpoint";
```

Use CSS hide/show (`hidden md:block`) for list table/card dual render. Use `useIsMobileViewport` only when behavior must differ in JS (e.g. toast position).
