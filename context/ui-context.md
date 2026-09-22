# UI Context

## Theme — Smoky Violet & Velvet

Dark-only glassmorphism. No light mode. The palette is a smoky near-black
violet (`#0E0C13`) with layered translucent surfaces, hairline violet borders,
and a single electric-violet accent (`#BF5AF2`). Framer Motion drives
entrance/exit animations.

## Colors

The project uses Tailwind arbitrary values for tokens. Theme values are also
declared once as CSS custom properties in `src/index.css` (`:root`) — new
surfaces should reuse those tokens or the arbitrary-value equivalents below.
Accent is used **sparingly** (active nav, focus rings, selected states) —
avoid glow overuse.

| Role            | Token / Class                    | Value               |
| --------------- | -------------------------------- | ------------------- |
| Page background | `--bg-page` `bg-[#0E0C13]`       | `#0E0C13`           |
| Surface (card)  | `--bg-surface` `bg-[#1C1726]/60` | `rgba(28,23,38,0.58)` |
| Primary text    | `--text-primary` `#F5F3FF`       | `#F5F3FF`           |
| Muted text      | `--text-secondary` `#A78BFA`     | `#A78BFA`           |
| Accent          | `--accent` `text-[#BF5AF2]`      | `#BF5AF2`           |
| Accent glow     | `--accent-glow`                  | `rgba(191,90,242,0.5)` |
| Border          | `--border` `border-[#D8B4FE]/15` | `rgba(216,180,254,0.15)` |
| Error           | `text-red-400` / `border-red-500/20` | —               |
| Success         | `text-emerald-400`               | —                    |

Note color palette (`src/components/Notes/noteColorValues.js`): Default,
Violet `#31284F`, Plum `#3A2540`, Lavender `#3B3260`, Slate `#262434`, Mauve
`#40233B`.

## Typography

Google Fonts loaded in `index.html` (Roboto, Inter, Montserrat, Source Code
Pro, Playfair Display). Headings use `font-black tracking-tighter`; labels use
`text-[9px]–[10px] font-black uppercase tracking-[0.2em]–[0.3em]`.

## Border Radius

| Context           | Class                          |
| ----------------- | ------------------------------ |
| Inline / small UI | `rounded-full` / `rounded-2xl` |
| Cards / panels    | `rounded-[2rem]`–`[2.5rem]`    |
| Modals / overlays | `rounded-[2.5rem]`–`[3rem]`    |

## Motion & Reduced Motion

- `src/index.css` globally disables animations/transitions inside
  `@media (prefers-reduced-motion: reduce)`.
- The Dock reads `useReducedMotion()` (framer-motion) and disables
  magnification for reduced-motion users.

## Component Library

No generated UI library. Reusable patterns live directly in
`src/components/` and feature folders:

- `Dock.jsx` — global primary navigation (bottom-centered, **scale-only
  magnification inside fixed-size slots**, tooltips, active indicator,
  account popover, login modal entry).
- `LoginPage.jsx` — exports the shared `LoginCard` used by the `/login` page.
- `LoginModal.jsx` — dialog hosting `LoginCard`, opened from the Dock.
- `Notes/NamingModal.jsx` + `Notes/DeleteModal.jsx` — shared modal patterns.
- `Notes/NoteColors.jsx` (ColorSwatches), `Notes/NoteCard.jsx` (memoized card),
  `Notes/NoteComposer.jsx` (Keep-style take-a-note), `Notes/NoteEditor.jsx`
  (debounced autosave editor), `Notes/notes-utils.js` (stripHtml/textToHtml/
  formatWhen), `Notes/noteColorValues.js` (palette data).
- `utils/performance.js` — `debounce`, `throttle`, `useDebouncedValue`.

## Layout Patterns

- **Navigation**: The Dock is fixed bottom-center (`z-[500]`), rendered
  globally in `App.jsx`. Pages do not render their own navbar. Content uses
  generous bottom padding (`pb-32`/`pb-36`) so the Dock never covers it.
- **Pages**: centered column or dashboard grid with animated violet background
  orbs (`blur-[120px]`+, `bg-[#BF5AF2]/8`–`/10`) behind glass cards.
- **Modals**: centered fixed overlay (`z-[10000]`+) with blurred backdrop,
  glass card, X / backdrop click to close.
- **Login**: the same `LoginCard` renders both in the `/login` page and in the
  modal; the modal sits above the Dock (`z-[10000]` > `z-[500]`).
- **Notes editor**: a bottom-sheet on mobile / centered panel on desktop
  (`z-[10000]`), debounced 700ms autosave with a Saving…/Saved indicator.

## Icons

lucide-react (page/nav/notes icons) and react-icons `Fi` set (todo/generic
icons). lucide imports are per-icon named imports (tree-shakeable). Stroke-
based, sized `size={16}–{20}` for inline/buttons.

## Accessibility

- Focus-visible rings on cards/buttons (`focus-visible:ring-[#BF5AF2]/60`).
- Cards are keyboard-interactable (`role="button"`, Enter/Space).
- Icon buttons carry `aria-label`/`title`.
- High-contrast text (`--text-primary #F5F3FF` on `#0E0C13`).