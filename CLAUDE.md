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

Supabase credentials come from `.env.local` (git-ignored): `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, read in `src/lib/supabase.js`.

## Design source of truth

`design/*.dc.html` are the mockups, one per page (`Main` = Browse, `Saved`, `ForFounders`), written in a custom component format (`<x-dc>`, `<sc-for>`, `<sc-if>`, `{{bindings}}`, and a `DCLogic` class whose `renderVals()` holds the behaviour). They can't be run in this repo (they expect a `support.js` that isn't here); treat them as visual and behavioural specs. When UI is added or removed from the product, update the matching mockup too so they stay in sync.

## Architecture

- `src/App.jsx` sets up `react-router-dom`: it renders `Router` → app-wide providers → `Header` (the top bar, shared by every page) → `<main className="app-main">` → `Routes`. Because App owns `<main>`, pages must not render their own `<main>`.
- Pages live at the top of `src/`, each with its own CSS file: `Home.jsx` (`/`, Browse), `Saved.jsx` (`/saved`) and `ForFounders.jsx` (`/for-founders`, the listing form; signed-out visitors see a "Log in to post a startup" prompt instead) and `Login.jsx` (`/login`, log in / create account). Each page renders its own `Footer`. The "List your startup" header button and the footer's "Submit a startup" link go to `/for-founders#list`. React Router doesn't scroll to hashes, so `ForFounders` does that itself in an effect. The header uses `NavLink`, which sets `aria-current="page"` on the active nav link, and `Header.css` styles that.
- State shared between pages lives in context providers in `src/hooks/` (provider and hook in the same file, wrapped in `App.jsx`).
- `useAuth` wraps Supabase Auth (email + password). It exposes `session`, `user`, `loading` (true until the stored session is restored) and `signOut`. The header shows "Log in" or "Log out" based on `user`, and passes the current path as `state.from` so `/login` can send people back afterwards. If the Supabase project requires email confirmation, sign up shows a "Check your email" step and the confirmation link returns to `window.location.origin`. `useSaved` holds the signed-in user's saves from the Supabase `saved_listings` table (loaded with their `listings` rows embedded, newest first). It exposes `savedListings`, `savedIds` (a Set), `loading` and `toggleSaved(listing)`, which takes the whole listing so the Saved page can show it without refetching; the bookmark flips immediately and flips back if the insert/delete fails. Signed-out visitors have no saves: Browse hides the bookmark (`StartupCard` only renders it when given `onToggleSave`) and Saved shows a "Log in to save startups" prompt.
- `Home.jsx` loads all listings on mount and owns the browse-only state (search query, the hero's location text, sector/stage/size/location filters, hiring toggle, grid/list view). The hero location box matches any part of a listing's location; the sidebar's Location checklist is built from the distinct locations in the listings (compared case-insensitively) and shows the first six behind "Show all". It does the filtering and builds the removable "active filter" tags. The components in `src/components/` are presentational: they get state and callbacks through props.
- Listings come from the Supabase `listings` table. `src/lib/listings.js` maps between table rows and the shape `StartupCard` renders (`fromListingRow`, `toListingRow`); optional columns can be null, so the card skips empty fields. `src/data/startups.js` only holds the filter and form option lists (`SECTORS`, `STAGES`, `SIZES`, `LOGO_COLORS`), which `FilterSidebar` imports directly.
- `StartupDialog` is the "View" popup with every field of a listing (X at the top left). It's a native `<dialog>` opened with `showModal()`, so Esc, focus trapping and the backdrop come from the browser; a click on the backdrop also closes it. Home and Saved each keep a `viewing` startup and pass `onView` to `StartupCard`, whose name and "View" button open it. Website links are only made for http(s) addresses (https:// is added when missing).
- `StartupCard` takes a `preview` prop that renders a non-interactive copy. The For founders live preview uses it, so the preview always matches real listings.
- Sort by (`SORTS` in `src/data/startups.js`): "Recently added" keeps the newest-first order listings load in, "Name A–Z" sorts by name, and "Most saved" uses save totals from the `listing_save_counts()` Postgres function (`supabase/listing_save_counts.sql`, a security-definer function because `saved_listings` RLS hides other users' saves). `useSaved` loads those totals once (`saveCounts`, used for sorting, so cards don't jump around as you bookmark) and tracks this session's own saves/unsaves on top, so `saveCountOf(id)` gives the live number that signed-in users see under the card's bookmark (`StartupCard`'s `saveCount` prop). If the function is missing, "Most saved" falls back to newest first and cards show no count.
- Not wired up yet (same as in the mockups): "Load more", the remaining `href="#"` links (footer). The For founders form inserts into `listings` (`user_id` defaults to `auth.uid()` and RLS only lets signed-in users insert their own rows). Listings are public as soon as they're posted; there's no review step, so don't add copy that suggests one.

## Styling conventions

- Plain CSS, one stylesheet per component, imported by that component (`Header.jsx` → `Header.css`). Page-level layout goes in the page's CSS (`Home.css`, `Saved.css`, `ForFounders.css`, `Login.css`), `App.css` only holds the app shell, and styles shared across pages (`.btn`, `.pill`) go in `index.css`. A UI piece used on more than one page becomes a component (e.g. `Switch` for the on/off toggle rows, `Field` for labelled form inputs with the `.field__input` style).
- Class names are BEM-style (`card__head`, `results__list--grid`).
- Colours, fonts and the page gutter are custom properties on `:root` in `src/index.css`. Use them rather than hard-coded hex values. Fonts (Space Grotesk for display, IBM Plex Sans for body, IBM Plex Mono for labels) are loaded from Google Fonts in `index.html` with `display=swap`. `body` sets `line-height: 1.3` (Plex's own default line height) so text keeps the same height when the web fonts swap in. Don't set `line-height: normal` anywhere, or that element will jump once the fonts load.
- Toggle and selected states are styled from ARIA attributes (`[aria-pressed='true']`, `[aria-checked='true']`, `[aria-expanded='true']`) rather than modifier classes. Keep the attribute and the style in sync.
- Responsive breakpoints: 960px (two-column layout; below it the filter sidebar collapses behind a Show/Hide toggle), 720px (hero search bar stacks), 640px (phone gutter and two-row header).
- `.container` (max-width 1280px plus the gutter) is the shared page-width wrapper.
