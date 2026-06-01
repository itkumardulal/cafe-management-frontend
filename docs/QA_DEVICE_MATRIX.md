# QA Device Matrix

**Required before Phase 2 sign-off.**  
Reference: [DESIGN_CONTRACT.md](./DESIGN_CONTRACT.md)

Use browser DevTools device mode **and** at least one physical iOS + Android smoke test.

---

## Viewport checklist

| Width | Device examples | Required checks |
|-------|-----------------|-----------------|
| **320px** | iPhone SE | No horizontal scroll on list pages; cards readable; CTAs full-width; toast fits viewport |
| **375px** | iPhone 14 | iOS Safari: inputs do not zoom on focus (16px); safe-area on header, modal footer, POS cart bar |
| **768px** | iPad portrait | Tables visible; filter drawer hidden (inline filters); dashboard 2 columns |
| **1024px** | iPad landscape / laptop | Sidebar visible; mobile drawer hidden; modals centered |
| **1440px** | Desktop | `page-shell` max-width; dashboard 4 columns; comfortable table density |

---

## Module smoke tests (mobile 375px)

| Area | Pass criteria |
|------|---------------|
| Login / auth | Single column, full-width submit, password toggle ≥44px, OTP grid tappable |
| List pages (×9) | Cards below 768px; sort via mobile Select; filters in drawer where applicable |
| Purchase create | Fullscreen modal; split payment stacks; image upload full-width |
| Purchase / removal / POS view | Line items as stacked cards, not nested scroll table |
| Users edit | Permissions accordion groups |
| POS | Sticky cart bar; scroll to checkout; catalog images lazy-load |
| Cafe admins create | Fullscreen modal; FormFooter actions |

---

## Accessibility

- [ ] **Keyboard:** Tab through header → main → modals → drawer; Escape closes overlays
- [ ] **Focus visible:** All interactive elements show focus ring (globals `*:focus-visible`)
- [ ] **Skip link:** "Skip to content" lands on `#main-content`
- [ ] **Modal:** Focus trapped; restored on close; title announced
- [ ] **Forms:** Errors linked via `aria-describedby`; invalid fields have `aria-invalid`
- [ ] **Screen reader:** Page headings hierarchy (one `h1` per page via `PageHeader` / auth shell)

---

## Dark mode

Toggle `html.dark` (or app theme if wired):

- [ ] Card borders visible (`--color-border`)
- [ ] Muted/subtle text readable on surface backgrounds
- [ ] Primary buttons and nav active state sufficient contrast
- [ ] Modal overlay and sheet backgrounds distinct from page
- [ ] Input autofill styles match dark surface (globals.css)

---

## Performance (frontend)

- [ ] Menu item / POS catalog images use `loading="lazy"` where below fold
- [ ] Route `loading.tsx` shows skeletons (no blank flash) on slow 3G throttle
- [ ] No layout shift when modal footers appear (Field error min-height)

---

## Sign-off

| Role | Date | Viewports tested | Notes |
|------|------|------------------|-------|
| | | | |

**Build verification:** `npm run build` passes with zero TypeScript errors.
