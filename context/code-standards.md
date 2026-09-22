# Code Standards

## General

- Keep modules small and single-purpose (feature folders: `MindTraining/`,
  `Notes/`).
- Fix root causes; do not layer workarounds (e.g. no `window.location.reload()`
  hacks, no blanket redirects to `/`).
- Do not mix unrelated concerns in one component or route.
- Do not bring back the old top navbar — the Dock is the primary navigation.
- Do not create duplicate login components or a second auth system.

## JavaScript / React

- JSX everywhere (`vite` + React 19). No TypeScript files in this project.
- Use functional components + hooks (`useState`, `useEffect`, `useRef`, `useMemo`).
- Reuse existing Firebase instances from `src/Config/firebaseConfig.js`:
  `app`, `db` (Realtime Database), `firestore` (Firestore), `auth`.
  Never call `initializeApp` again.
- Components receive the Firebase `user` object as a prop; never hardcode UIDs.
- Guard auth-dependent work with a resolved `user?.uid` before querying.

## Styling

- Use the glassmorphism tokens defined in `ui-context.md` — no unrelated colors.
- Follow the border-radius scale defined in `ui-context.md`.
- Use `framer-motion` (motion/animate/AnimatePresence) for animations.
  Import `motion` with the framer-motion package; eslint counts JSX usage via
  `react/jsx-uses-vars`.

## Modals

- Follow the `NamingModal`/`DeleteModal` pattern: fixed inset-0 overlay,
  `z-[10000]`+, blurred backdrop, glass card, close via X or backdrop.
- Login dialog: `src/components/LoginModal.jsx` hosts the shared `LoginCard`.

## API / Data

- All user content lives in Realtime Database under `users/{userId}/...`
  using `ref`/`onValue`/`set`/`update`/`remove` from `firebase/database`.
- The Firestore profile doc (`users/{uid}`) must use the Firestore `firestore`
  instance — never `doc(db, ...)` against the Realtime Database instance.
- Timestamps: `Date.now()` for user content; notes use ISO strings.

## Feedback

- Toasts: `react-hot-toast` (`toast.success` / `toast.error`). A single app-level
  `<Toaster position="top-center" />` exists in `App.jsx` — do not add another.
- Loading: `ClipLoader` from `react-spinners`. App shows one global loader while
  Firebase resolves auth.

## Routing

- Register pages as protected/public routes in `src/App.jsx`; add nav items to
  the Dock's `navItems` array in `src/components/Dock.jsx`.
- Protected routes must not redirect before the auth state has resolved.
- Keep the SPA fallback in `vercel.json` so sub-URL reloads work.

## File Organization

- `src/Config/` — Firebase initialization and shared instances
- `src/components/` — Global UI: `Dock.jsx`, `LoginPage.jsx`, `LoginModal.jsx`, pages
- `src/components/[Feature]/` — Feature subcomponents (Notes, MindTraining)
- `context/` — AI-codable documentation