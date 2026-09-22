# AGENTS.md

## Project

TaskFlow — React 19 + Vite + Tailwind 4 glassmorphism productivity app.
Core features: todos with timers, rich-text notes, mind training (daily
reflection), weather, and motivation quotes. Firebase-powered cloud
persistence.

## Firebase architecture (do not duplicate)

- Single app created in `src/Config/firebaseConfig.js`.
  Exports: `app`, `db` (Realtime Database), `firestore`, `auth`.
- Never call `initializeApp` again; always import from the config module.
- User content is stored in Firebase **Realtime Database** under
  `users/{userId}/...` using `ref`/`onValue`/`set`/`update`/`remove`
  from `firebase/database`.
- Firestore is used only for the login profile document (created on first
  sign-in).

## Critical rules

- **Mind Training data is persisted through the existing Firebase Realtime
  Database architecture and must remain user-scoped. Do not introduce
  localStorage or a separate Firebase initialization for Mind Training.**
- Follow the established user-data pattern: path `users/{userId}/...`,
  Realtime Database operations, timestamps as `Date.now()`.
- All user content stays scoped under the signed-in user's `uid`.
- Never weaken Firestore or Realtime Database security.
- Wait for Firebase auth state to resolve before protected-route redirects or
  user-scoped Firebase queries (App renders a loader until it does).
- Do not initialize Firebase more than once — always import the shared
  instances from `src/Config/firebaseConfig.js`.
- The React Bits Dock (`src/components/Dock.jsx`) is the application's primary
  navigation. Do not bring the old top navbar back.
- Use the Firestore `firestore` instance for the Firestore profile doc — never
  `doc(db, ...)` against the Realtime Database instance.
- No visible personal branding or watermarks anywhere. `About.jsx` is
  product-focused (no author bio/social links). Do not re-add a watermark.
- All new feature code must reuse `src/utils/performance.js`
  (`debounce`/`throttle`/`useDebouncedValue`) for anything debounced or
  throttled — do not hand-roll inline timers.

## Auth

- Google sign-in via `firebase/auth` (`signInWithPopup`).
- Components receive the Firebase `user` object as a prop from `App.jsx`.
- Protected routes redirect to `/login` if unauthenticated.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — Production build
- `npm run lint` — ESLint

## Notes (Keep-style)

- Lives at `users/{uid}/notes` (RTDB), keyed by `String(Date.now())`. Schema:
  `title`, `content` (HTML) + `content_enc` (legacy mirror), `color` (`null` or
  a key from `Notes/noteColorValues.js`), `pinned`, `archived`, `inTrash`,
  `labels` (string[]), `folder` (flat folder id), `createdAt`, `updatedAt`.
- `src/components/Notes.jsx` owns one `onValue` listener pair (notes + folders)
  per user. All mutations are optimistic (local state first, then RTDB, toast
  on failure). Trash purges only via `DeleteModal`; folders create via
  `NamingModal`.
- The editor keeps title/body in local state; autosave is debounced 700ms;
  search is debounced 200ms. Never write to RTDB per keystroke and never let
  keystroke state re-render the whole grid.
- `Notes.jsx` uses an instance named `Notes` (page) + `Notes/` folder
  (`NoteCard`, `NoteComposer`, `NoteEditor`, `NamingModal`, `DeleteModal`,
  `NoteColors`, `notes-utils`). Keep that structure.

## Conventions

- **New pages**: Create under `src/components/`, register a route in
  `src/App.jsx` (protected routes get a `user` prop).
- **Navigation**: Add items to the `navItems` array in
  `src/components/Dock.jsx` with a `lucide-react` icon. The Dock is rendered
  globally in `App.jsx`; pages do not render their own navbar.
- **Login UI**: Reuse the shared `LoginCard` from `src/components/LoginPage.jsx`
  (page + `LoginModal`). Do not create duplicate login components.
- **Subcomponents**: Groups of related components live in their own folder
  (e.g. `src/components/MindTraining/`, `src/components/Notes/`). Pure data /
  helper modules that are not components go in lower-kebab files
  (e.g. `Notes/notes-utils.js`, `Notes/noteColorValues.js`) — avoid two files
  differing only by case in one folder (Windows resolver collisions).
- **Design**: Dark "Smoky Violet & Velvet" glassmorphism — page `#0E0C13`
  (`bg-[#0E0C13]`), accent `#BF5AF2` (used sparingly), surfaces
  `bg-[#1C1726]/60`, borders `border-[#D8B4FE]/15`, muted text `#A78BFA`,
  `rounded-[2rem]`–`[3rem]`, `backdrop-blur`. Use `framer-motion` for
  entrance/exit animations. Honor `prefers-reduced-motion` (global CSS block +
  `useReducedMotion` where custom animation runs continuously, e.g. Dock).
- **Modals**: Follow the `NamingModal` pattern (fixed overlay, glass card,
  `AnimatePresence`). Reuse `DeleteModal` from Notes for confirmations.
- **Toast notifications**: Use `react-hot-toast` (`toast.success` /
  `toast.error`).
- **Loading states**: Use `ClipLoader` from `react-spinners`.
- **Timestamps**: Use `Date.now()` for user content (matches todo pattern).