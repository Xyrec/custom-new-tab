# Repository rules

- Use `bun` instead of `npm`
- Using Vite 8 for this.
- Repo is a clone of Firefox' new tab page.

## Project overview

Chrome MV3 extension that overrides the new tab page with a Firefox-style customizable top sites grid. Built with React 19 + TypeScript + Vite.

## Commands

- `bun dev` — start dev server (uses localStorage fallback since no Chrome APIs)
- `bun run build` — production build to `dist/`, copies `manifest.json` automatically
- `bun run lint` — Oxlint
- Type-check: `./node_modules/.bin/tsc --noEmit`

## Loading the extension

1. `bun run build`
2. `chrome://extensions` → Developer Mode → Load Unpacked → select `dist/`
3. Open a new tab

## Architecture

### Data flow

- `chrome.topSites.get()` provides the browser's frecency-ranked sites (fresh each new tab)
- User customizations (pins, removals, edits, added sites) are stored in `chrome.storage.local` under key `topSitesCustomizations`
- Row count setting stored under key `topSitesRows`
- `useTopSites` hook merges browser top sites with stored customizations on every load
- In dev mode (no Chrome APIs), falls back to `localStorage` with hardcoded sample sites

### Key files

- `src/App.tsx` — root component, wires up top sites + settings panel
- `src/hooks/useTopSites.ts` — all data logic: fetch, merge, pin, unpin, edit, add, remove, reorder
- `src/components/TopSites.tsx` — grid rendering, drag-and-drop, context menus
- `src/components/SiteEditModal.tsx` — add/edit shortcut modal
- `src/components/SettingsPanel.tsx` — slide-in panel for row count
- `src/components/Icons.tsx` — SVG icon components
- `src/lib/favicon.ts` — favicon URL resolution, letter-fallback color generation
- `src/index.css` — all styles, using Firefox's exact design tokens and breakpoints

### Design system

CSS custom properties in `index.css` match Firefox's newtab design tokens:

- Colors: `--newtab-background-color`, `--newtab-text-primary-color`, `--newtab-primary-action-background`, etc.
- Spacing: `--space-xxsmall` (4px) through `--space-xxlarge` (32px)
- Border radius: `--border-radius-small` (4px) through `--border-radius-large` (16px)
- Light/dark mode via `@media (prefers-color-scheme: dark)`

### Responsive breakpoints (matching Firefox)

- 510px: 3 columns
- 610px: 4 columns
- 1122px: 6 columns
- 1122px+: 8 columns

### Vite config

`base: "./"` is required so built asset paths are relative (Chrome extensions can't resolve absolute `/assets/` paths).
