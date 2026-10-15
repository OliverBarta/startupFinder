# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # production build to dist/
npm run preview   # serve the built dist/
npm run lint      # ESLint (react-hooks + react-refresh rules)
```

There is no test runner set up yet. Plain JavaScript + JSX (no TypeScript).

## Design source of truth

`design/*.dc.html` are the mockups, one per page (`Main` = Browse, `Saved`), written in a custom component format (`<x-dc>`, `<sc-for>`, `<sc-if>`, `{{bindings}}`, and a `DCLogic` class whose `renderVals()` holds the behaviour). They can't be run in this repo (they expect a `support.js` that isn't here); treat them as visual and behavioural specs. When UI is added or removed from the product, update the matching mockup too so they stay in sync.

## Architecture

- `src/App.jsx` sets up `react-router-dom`: it renders `Router` → app-wide providers → `Header` (the top bar, shared by every page) → `<main className="app-main">` → `Routes`. Because App owns `<main>`, pages must not render their own `<main>`.
- Pages live at the top of `src/`, each with its own CSS file: `Home.jsx` (`/`, Browse) and `Saved.jsx` (`/saved`). Each page renders its own `Footer`. The header uses `NavLink`, which sets `aria-current="page"` on the active nav link, and `Header.css` styles that.
- State shared between pages lives in a context provider in `src/hooks/` (provider and hook in the same file, wrapped in `App.jsx`). `useSaved` holds the saved startup IDs: Browse toggles them and Saved lists them. It starts empty and is in memory only, so it resets on reload. That's deliberate: saved startups will later be stored on the user's account in a database (behind log in), so don't add localStorage persistence in the meantime.
- `Home.jsx` owns the browse-only state (search query, sector/stage/size filters, hiring toggle, grid/list view). It does the filtering and builds the removable "active filter" tags. The components in `src/components/` are presentational: they get state and callbacks through props.
- `src/data/startups.js` holds sample startups plus the filter option lists (`SECTORS`, `STAGES`, `SIZES`). Placeholder data until there's a real backend. `FilterSidebar` imports the option lists directly.
- Not wired up yet (same as in the mockup): the Location input, the Sort dropdown, "Load more", and every link (`href="#"`).

## Styling conventions

- Plain CSS, one stylesheet per component, imported by that component (`Header.jsx` → `Header.css`). Page-level layout goes in the page's CSS (`Home.css`, `Saved.css`), `App.css` only holds the app shell, and styles shared across pages (like `.btn`) go in `index.css`.
- Class names are BEM-style (`card__head`, `results__list--grid`).
- Colours, fonts and the page gutter are custom properties on `:root` in `src/index.css`. Use them rather than hard-coded hex values. Fonts (Space Grotesk for display, IBM Plex Sans for body, IBM Plex Mono for labels) are loaded from Google Fonts in `index.html`.
- Toggle and selected states are styled from ARIA attributes (`[aria-pressed='true']`, `[aria-checked='true']`, `[aria-expanded='true']`) rather than modifier classes. Keep the attribute and the style in sync.
- Responsive breakpoints: 960px (two-column layout; below it the filter sidebar collapses behind a Show/Hide toggle), 720px (hero search bar stacks), 640px (phone gutter and two-row header).
- `.container` (max-width 1280px plus the gutter) is the shared page-width wrapper.
