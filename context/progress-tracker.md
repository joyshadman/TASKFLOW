# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete

## Current Goal

- "Smoky Violet & Velvet" theme + global UI polish + Dock jitter fix +
  watermark removal + full Keep-style Notes system + performance,
  with context docs updated.

## Completed

- **Theme — Smoky Violet & Velvet (`#0E0C13` / accent `#BF5AF2`):**
  - Mechanical retheme sweep across all `src/*.{js,jsx}` (orange/blue tokens →
    violet) via `retheme.mjs`; verified no `orange|f97316|249,115,22` remains.
  - `src/index.css` rewritten with `:root` tokens, lavender scrollbars,
    selection color, `.no-scrollbar`, and a global `prefers-reduced-motion`
    block; `index.html` gained a matching `theme-color` meta.
- **Dock jitter fixed (root cause):** magnification is now scale-only inside
  fixed-size slots using pre-measured static centers (measured once, re-measured
  on resize/item change, throttled 150ms). The old code read
  `getBoundingClientRect()` per pointer frame while icon widths were
  spring-animated (feedback loop) — removed. Reduced-motion disables it.
- **Watermarks / branding removed:** `Watermark.jsx` deleted (imports cleaned
  from LoginPage, AccountPage, MindTrainingPage, btn.jsx). `About.jsx` rewritten
  product-focused (no author bio/socials). Dead files removed:
  `Notes/SidebarItem.jsx`, `Notes/EditorToolbar.jsx`.
- **Notes — full Keep-style system:** one RTDB listener pair per user;
  views All/Pinned/Archived/Trash + counts; folders (flat, create via
  `NamingModal`); debounced (200ms) client-side search; CSS-column masonry;
  memoized `NoteCard`; `NoteComposer` (expand → title/body/color/pin/folder);
  `NoteEditor` with local title/body state + contentEditable, 700ms debounced
  autosave with Saving…/Saved/failed indicator, labels, colors, pin/archive/
  trash/restore/delete; optimistic mutations everywhere; trash purges only via
  `DeleteModal`; legacy notes render fine.
- **Performance:** `src/utils/performance.js` (`debounce`, `throttle`,
  `useDebouncedValue`); editor typing never re-renders the grid; single
  listener sets; no per-keystroke DB writes; global reduced-motion CSS.
- **Lint/build:** fixed noteColorValues case-collision (renamed `noteColors.js`
  → `noteColorValues.js` so `./NoteColors` can't resolve case-insensitively);
  fixed btn.jsx exhaustive-deps (useCallback-wrapped `playSound`/`stopSound`/
  `fetchWeather`). `npm run lint` → **0 errors, 0 warnings**. `npm run build`
  passes (pre-existing chunk-size warning only). Vite preview returned 200 for
  `/`, `/login`, `/notes`, `/account`, `/mind-training`, `/about`, `/terms`,
  `/privacy`, unknown paths.
- **Context docs updated:** ui-context (theme tokens, Dock mechanism, Notes UI,
  a11y), architecture (note schema, Notes feature, performance model,
  invariants), and this tracker.

## In Progress

- None.

## Next Up

- [To be determined]

## Open Questions

- None.

## Architecture Decisions

- **React Bits Dock is the primary navigation**: implemented in
  `src/components/Dock.jsx`. The old top navbar is removed.
- **Dock magnification is scale-only on static slot centers** — fixes the
  hover jitter without disabling the animation.
- **Keep-style Notes on the existing RTDB model**: task said "Firestore", but
  the established architecture stores user content in Realtime Database under
  `users/{uid}`; notes live at `users/{uid}/notes` with the new schema
  (content/content_enc/pinned/archived/inTrash/labels/folder/timestamps).
- **One shared `LoginCard`**: the sign-in UI + Google popup flow live in a
  single component rendered by both the `/login` page and `LoginModal`. The auth
  `onAuthStateChanged` listener is the single source of truth — components do
  not set auth state themselves.
- **Loader until auth resolves**: `App.jsx` keeps `initializing` true until the
  first auth callback, preventing flicker and premature redirects.
- **Debounced autosave (700ms) + local editor state**: no RTDB write per
  keystroke and no grid re-render while typing.
- **SPA fallback in vercel.json**: `/(.*)` → `/index.html` so BrowserRouter
  routes survive direct loads and refreshes on Vercel.
- **`npx` note**: there is no `typecheck` script — the project is JS (no
  TypeScript config); verification is `npm run lint` + `npm run build`.
- **Case-sensitive filenames matter on Windows dev**: two modules differing only
  by case in one folder (`noteColors.js` vs `NoteColors.jsx`) confuses the
  resolver; use distinct names.

## Session Notes

- `npm run lint` passes (0 errors, 0 warnings — the previous 2 btn.jsx warnings
  are gone). `npm run build` passes.
- Vite preview confirmed every route returns the SPA shell (HTTP 200).
- Branding sweep (rg/grep for `made by|joyshadman|joy shadman|reactbits|
  watermark`) returns nothing in `src`.