# Repository rules

- Use `bun` instead of `npm`
- Using Vite 8 for this.

## Project overview

Chrome MV3 extension that overrides the new tab page with a customizable top sites grid. Built with React 19 + TypeScript + Vite + shadcn/ui (Base UI variant) + Tailwind CSS v4.

## Commands

- `bun dev` — start dev server (uses localStorage fallback since no Chrome APIs)
- `bun run build` — production build to `dist/`, copies `manifest.json` automatically
- `bun run lint` — Oxlint
- `bun run tsc` — Run type checker

## Loading the extension

1. `bun run build`
2. `chrome://extensions` → Developer Mode → Load Unpacked → select `dist/`
3. Open a new tab

## shadcn/ui — Base UI variant gotchas

This project uses shadcn's **Base UI** components (not Radix). Key differences:

- **No `asChild` prop.** Base UI components do NOT support `asChild`. Use the `render` prop instead to compose with other components:

  ```tsx
  // WRONG — will cause TypeScript errors:
  <DropdownMenuTrigger asChild>
    <Button>Click</Button>
  </DropdownMenuTrigger>

  // CORRECT — use render prop with a ReactElement:
  <DropdownMenuTrigger render={<Button />}>
    Click
  </DropdownMenuTrigger>
  ```

- The `render` prop accepts either a `ReactElement` or a function `(props, state) => ReactElement`.
- `TooltipTrigger` renders a `<button>` by default — no wrapping needed for simple cases.
- Dark mode uses `.dark` class on `<html>` (via ThemeProvider), NOT `prefers-color-scheme` media query.

## Architecture

### Data flow

- `chrome.topSites.get()` provides the browser's frecency-ranked sites (fresh each new tab)
- User customizations (pins, removals, edits, added sites) are stored in `chrome.storage.local` under key `topSitesCustomizations`
- `useTopSites` hook merges browser top sites with stored customizations on every load
- In dev mode (no Chrome APIs), falls back to `localStorage` with hardcoded sample sites

### Key files

- `src/App.tsx` — root component, wires up top sites grid + import button + theme toggle
- `src/hooks/useTopSites.ts` — all data logic: fetch, merge, pin, unpin, edit, add, remove, reorder
- `src/components/TopSites.tsx` — grid rendering, drag-and-drop, dropdown menus
- `src/components/SiteEditModal.tsx` — add/edit shortcut dialog (shadcn Dialog)
- `src/components/theme-provider.tsx` — dark/light/system theme context
- `src/components/mode-toggle.tsx` — theme toggle dropdown
- `src/lib/favicon.ts` — multi-source favicon URL resolution (Chrome API → DuckDuckGo → Google)
- `src/lib/grid.ts` — reads CSS grid column count from computed styles
- `src/index.css` — shadcn theme tokens + responsive grid breakpoints

### Responsive breakpoints (matching Firefox)

- 510px: 3 columns
- 610px: 4 columns
- 1122px: 6 columns
- 1122px+: 8 columns

### Vite config

`base: "./"` is required so built asset paths are relative (Chrome extensions can't resolve absolute `/assets/` paths).
