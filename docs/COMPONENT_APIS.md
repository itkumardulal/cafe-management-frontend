# Component API Reference

**Status:** Locked for Phase 2 shared components.  
**Rule:** New pages must use these APIs — do not duplicate markup patterns.

---

## UI primitives (`src/components/ui/`)

### `Button`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger"` | `"primary"` | Visual style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Height/padding |
| `loading` | `boolean` | — | Disables + shows spinner |
| `fullWidth` | `boolean` | — | `w-full` on mobile CTAs |
| `disabled` | `boolean` | — | Native disabled |
| `aria-*` | passthrough | — | Spread to `<button>` |

**A11y:** Focus-visible ring via global CSS; `loading` sets `aria-busy`.

### `Input` / `Select`

| Prop | Type | Notes |
|------|------|-------|
| `hasError` | `boolean` | Border/error styling |
| `fullWidth` | `boolean` | Default true |
| `size` | `"sm" \| "md" \| "lg"` | `md` uses `text-base` on mobile (iOS) |
| `aria-*` | passthrough | Use with `Field` for wiring |

### `Field`

| Prop | Type | A11y behavior |
|------|------|---------------|
| `id` | `string` | Links `<label htmlFor>` |
| `label` | `string` | Visible label |
| `error` | `string` | `role="alert"`, `aria-invalid` on control |
| `hint` | `string` | `aria-describedby` when no error |
| `required` | `boolean` | Visual asterisk |

Collapses the error slot to a small reserve when empty (`min-h-2.5`); expands on validation errors.

### `Modal`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controls visibility |
| `title` | `string` | — | `aria-labelledby` via `useId()` |
| `description` | `string` | — | Subtitle under title |
| `onClose` | `() => void` | — | Backdrop, X, Escape |
| `footer` | `ReactNode` | — | Sticky footer slot (use `FormFooter`) |
| `size` | `"md" \| "lg" \| "xl"` | `"md"` | Desktop max-width |
| `mobileVariant` | `"sheet" \| "fullscreen"` | `"sheet"` | Mobile presentation |

**A11y:** Focus trap, body scroll lock, Escape, unique title id.

### `Drawer`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | |
| `onClose` | `() => void` | — | Backdrop, Escape |
| `title` | `string` | `"Navigation drawer"` | `aria-label` |
| `side` | `"left" \| "bottom"` | `"left"` | Nav vs filter sheet |
| `children` | `ReactNode` | — | |

**A11y:** Focus trap, scroll lock, `role="dialog"`, `aria-modal`.

### `Dropdown`

| Prop | Type | A11y |
|------|------|------|
| `label` | `string` | Trigger text |
| `items` | `{ id, label, onClick }[]` | Menu actions |

Escape and click-outside dismiss when open.

### `Pagination`

Mobile: prev/next + "Page X of Y"; rows-per-page hidden below `sm`, shown `sm–md`.

---

## Shared patterns (`src/components/shared/`)

### `PageHeader`

`title`, `description?`, `action?` — stacked mobile, inline desktop; action full-width on mobile.

### `FormFooter`

Wrap modal form actions. Sticky on mobile inside scroll body; static in modal `footer` slot on desktop.

### `ListCard` / `ListCardStack`

`title`, `subtitle?`, `fields[]`, `badge?`, `leading?`, `actions?` — mobile list rows.  
`ListCardStack`: `space-y-2 md:hidden`.

### `FilterDrawer`

Mobile filter sheet with Apply/Reset; pair with `FilterDrawerDesktop` for inline desktop filters.

### `DetailLineItemsSection`

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Default "Line items" |
| `subtitle` | `string` | Context line |
| `headers` | `TableHeader[]` | Desktop table |
| `children` | `ReactNode` | Table rows |
| `mobileLineItems` | `ReactNode` | `LineItemCard` list; hides table below `md` |
| `headerAside` | `ReactNode` | e.g. totals badge |

### `LineItemCard` / `LineItemCardStack`

Single line-item card for view modals on mobile.

### `SplitPaymentSection`

Props: `grandTotal`, `billingType`, cash/bank strings + handlers, optional `bankProofSlot`.  
Mobile: stacked header, full-width billing toggle, single-column amount inputs.

### `ImageUploadField`

Props: `id`, `label`, `value`, `onChange`, `assetType`, `module?`, `entityId?`, `onUploadingChange?`.  
Mobile: full-width drop zone, 44px+ tap target, keyboard activatable drop area.

### `PermissionsPicker`

Props: `menus`, `value`, `onChange`.  
Mobile: `<details>` accordion per group; desktop: always-expanded sections.

### `ResponsiveToaster`

Sonner wrapper: `bottom-center` + safe-area offset on mobile; `top-center` on desktop.

---

## Hooks

| Hook | Query / behavior |
|------|------------------|
| `useIsMobileViewport()` | `max-width: 767px` |
| `useIsTabletViewport()` | `min-width: 768px` |
| `useIsDesktopViewport()` | `min-width: 1024px` |
| `useFocusTrap` | Modal/drawer focus cycle |
| `useBodyScrollLock` | Overlay open |

---

## Accessibility checklist (components)

- [ ] All form controls wrapped in `Field` with `id` + label
- [ ] Modals: `footer` + `FormFooter` for actions; no orphan sticky divs
- [ ] Icon-only buttons: `aria-label` (password toggles, row actions)
- [ ] Live regions: `role="alert"` / `aria-live="polite"` for errors and status
- [ ] Skip link in dashboard layout → `#main-content`

See [QA_DEVICE_MATRIX.md](./QA_DEVICE_MATRIX.md) for manual verification steps.
