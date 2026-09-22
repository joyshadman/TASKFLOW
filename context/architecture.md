# Architecture Context

## Stack

| Layer     | Technology                              | Role                                    |
| --------- | --------------------------------------- | --------------------------------------- |
| Framework | React 19 + Vite 7                       | SPA with dev server and build           |
| UI        | Tailwind CSS 4 + Framer Motion 12       | Styling, glassmorphism, animations      |
| Auth      | Firebase Auth (Google sign-in)          | Authentication via `signInWithPopup`    |
| Database  | Firebase Realtime Database              | All user content (todos, notes, etc.)   |
| Database  | Firebase Firestore                      | Login profile doc only                  |
| Icons     | lucide-react + react-icons (Fi)         | UI icons throughout                     |
| Routing   | react-router-dom 7                      | Client-side route management (`BrowserRouter`) |
| Feedback  | react-hot-toast + react-spinners        | Notifications and loading indicators    |

## System Boundaries

- `src/Config/` — Firebase app initialization and exports (`app`, `db`, `firestore`, `auth`)
- `src/components/` — All UI components and pages
- `src/components/Dock.jsx` — Global React Bits-style primary navigation
- `src/components/LoginPage.jsx` — Login UI (`LoginCard` shared by page + modal)
- `src/components/LoginModal.jsx` — Login dialog opened from the Dock
- `src/components/MindTraining/` — Mind Training feature constants, utils, and modal
- `src/components/Notes/` — Notes feature subcomponents and modals
- `context/` — Architecture documentation for AI coding agents

## Authentication

- Google OAuth via `signInWithPopup` in the shared `LoginCard` (used by both the
  `/login` page and the login modal).
- Firebase is initialized exactly once in `src/Config/firebaseConfig.js`. All
  modules import `auth`, `db`, `firestore`, `app` from there — never call
  `initializeApp`/`getAuth`/`getDatabase`/`getFirestore` again.
- `App.jsx` owns auth state. It attaches one `onAuthStateChanged` listener and
  keeps an `initializing` flag. **The whole app renders a loader until the first
  auth callback resolves** — this prevents auth flicker and premature
  protected-route redirects while Firebase restores the session (your logged-in
  state persists across reloads).
- A fresh login also creates the Firestore profile document at
  `users/{uid}` on the user's first sign-in (never against the Realtime
  Database instance).

## Routing

| Route           | Access                                  | Page                          |
| --------------- | --------------------------------------- | ----------------------------- |
| `/`             | Protected (Dashboard / Todos)           | `Btn`                         |
| `/mind-training`| Protected                               | `MindTrainingPage`            |
| `/notes`        | Protected                               | `Notes`                       |
| `/account`      | Protected                               | `AccountPage`                 |
| `/about`        | Protected                               | `About`                       |
| `/login`        | Public; redirects to `/` if signed in   | `LoginPage`                   |
| `/terms`        | Public                                  | `TermsPolicyPage`             |
| `*`             | Catch-all redirect to `/` or `/login`   | —                             |

- Protected routes redirect to `/login` only **after** auth has resolved — never
  while `initializing` is true.
- The app is a client-only SPA (`BrowserRouter`). `vercel.json` contains a
  rewrite fallback (`/(.*)` → `/index.html`) so every route — including direct
  sub-URL loads and browser refreshes — serves the app shell. The dev/preview
  server applies the same SPA fallback automatically.
- Logout uses `signOut(auth)`; the protected-route guards handle the redirect
  to `/login` after the auth state updates.

## Navigation

- **The React Bits-style Dock (`src/components/Dock.jsx`) is the application's
  primary navigation and is rendered globally from `App.jsx`.** The old top
  navbar has been removed and must not be brought back.
- The Dock shows Dashboard, Mind Training, Notes, About (+ Account when signed
  in), an active-route indicator, and magnifies icons on hover (scale-only
  spring inside fixed-size slots; slot centers pre-measured once, so there's
  no hover jitter and no per-frame layout reads).
- Unauthenticated: the Dock shows a **Log in** action that opens the
  `LoginModal` above the page and Dock.
- Authenticated: the Dock shows the user avatar with a popover (account link +
  logout).
- Mobile: the Dock remains bottom-centered and fully functional; it never
  replaces or conflicts with modals (`LoginModal` sits at `z-[10000]`, above the
  Dock at `z-[500]`).

## Storage Model

- **Firebase Realtime Database** (`db` instance from `getDatabase(app)`):
  - `users/{userId}/todos` — Todo items with category, completion, timer
  - `users/{userId}/notes` — Note objects (see schema below), keyed by `String(Date.now())`
  - `users/{userId}/folders` — Flat note folders `{ name, createdAt }`, keyed by id
  - `users/{userId}/location` — Saved geolocation for weather
  - `users/{userId}/mindTraining` — Daily reflection entries (keyed by YYYY-MM-DD)
  - `users/{userId}/mindTrainingQuestions` — Custom questions with enable/disable
- **Firebase Firestore** (`firestore` instance from `getFirestore(app)`):
  - `users/{userId}` — Login profile document (created on first sign-in)

### Note schema (`users/{uid}/notes/{id}`)

| Field         | Type      | Notes                                              |
| ------------- | --------- | -------------------------------------------------- |
| `title`       | string    | Defaults to "Untitled" on save                      |
| `content`     | string    | HTML body (editable element innerHTML)             |
| `content_enc` | string    | Legacy HTML mirror (kept in sync with `content`)   |
| `color`       | string?   | Key into `noteColorValues.js` palette or `null`    |
| `pinned`      | boolean   | Pinned notes rise to the top                       |
| `archived`    | boolean   | Excluded from the default view                     |
| `inTrash`     | boolean   | Trashed notes are hidden; require confirm to purge |
| `labels`      | string[]  | Free-form labels                                    |
| `folder`      | string?   | Folder id, or `null`/absent                        |
| `createdAt`   | timestamp | `Date.now()`                                       |
| `updatedAt`   | timestamp | Bumped on every patch and every autosave            |

All note mutations are **optimistic**: `Notes.jsx` updates local state first,
mirrors to RTDB via `update`/`set`/`remove`, and surfaces a toast on failure.
Legacy notes (without the new fields) render fine — all new fields default
handled in code.

> ⚠️ Do not call Firestore functions (`doc`/`getDoc`/`setDoc`) with the
> Realtime Database `db` instance — they require the Firestore `firestore`
> instance (this was a past login bug).

## Auth and Access Model

- All users sign in via Google OAuth using `signInWithPopup`.
- `onAuthStateChanged` drives auth state in `App.jsx`; every component receives
  the Firebase `user` object as a prop.
- All user data is scoped under `users/{user.uid}` — never shared.
- Auth-dependent data loads (todos, notes, mind training, weather) only after a
  resolved `user.uid` is available, so no query ever uses an undefined user id.

## Notes Feature (Keep-style)

`src/components/Notes.jsx` + `src/components/Notes/`:

- **One RTDB listener pair per user** (`notes` + `folders`) registered in a
  single effect and torn down on unmount — no duplicate listeners or leaks.
- Views: Pinned / All / Archived / Trash (counts in the sidebar + mobile chips),
  folders, and instant client-side search (debounced 200ms via
  `useDebouncedValue`).
- Grid uses CSS columns (masonry); cards are `React.memo` and derive their
  preview with `stripHtml` memoized on `content`/`content_enc`, so typing in
  the editor causes **zero grid re-renders**.
- The editor (`NoteEditor.jsx`) keeps title/body in **local state** and a
  contentEditable ref; edits schedule a single 700ms-debounced RTDB write
  (saving status shows Saving…/Saved/failed). Escape/Cmd-Enter handle close
  and force-save; a dirty-guard flushes before unmounting.
- Trash permanently purges only after `DeleteModal` confirmation; folders are
  flat (name + id) — create is optimistic via `NamingModal`, there is no
  tree/rename/delete.

## Performance Model

- `src/utils/performance.js`: `debounce`, `throttle`, `useDebouncedValue`.
- Notes autosave debounced (700ms), search debounced (200ms) — never write or
  filter per keystroke.
- Editor state is local to the editor; the grid consumes immutable note objects
  and stable `useCallback` updaters (backed by `notesRef`), so typing never
  re-renders the list.
- Dock magnification is **scale-only** on fixed-size slots using pre-measured
  static slot centers (`getBoundingClientRect` once on mount/resize, throttled
  at 150ms) — no layout reads per pointer frame, so the Dock has no jitter and
  doesn't force layout reflow (previous bug: per-frame `getBoundingClientRect`
  while icon widths were spring-animated created a feedback loop).
- `useReducedMotion` + a global reduced-motion CSS block disable decorative
  animation for prefers-reduced-motion users.

## Invariants

1. No second Firebase initialization — always import from `src/Config/firebaseConfig.js`.
2. User content stays in Realtime Database following the `users/{uid}/...` path convention.
3. No localStorage as a primary data store for user content.
4. No duplicate auth systems — the existing Google sign-in is the only auth method.
5. Pages render without an internal navbar — the global Dock is the only navigation.
6. Wait for Firebase auth state to resolve before protected-route redirects or
   user-scoped Firestore/Firebase queries.
7. Do not initialize Firebase more than once.
8. React Bits Dock is the application's primary navigation.
9. No visible personal branding or watermarks — About is product-focused.

## Important Stability Rules

```text
Wait for Firebase auth state to resolve before protected-route redirects or
user-scoped Firebase queries. The app renders a loader until onAuthStateChanged
fires for the first time.

Do not initialize Firebase more than once — always import the shared instances
from src/Config/firebaseConfig.js.

React Bits Dock is the application's primary navigation; the old top navbar is
removed and must not be reintroduced.

Use the Firestore `firestore` instance for the Firestore profile doc — never
`doc(db, ...)` with the Realtime Database instance.

Never redirect off the protected page before the auth listener has resolved the
session (prevents flicker and premature /login bounces).

Direct sub-URL loads and refreshes are supported by the SPA rewrite fallback in
vercel.json + BrowserRouter; do not work around reloads with
window.location.reload() or blanket redirects to `/`.
```