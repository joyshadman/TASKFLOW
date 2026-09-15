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

## Auth

- Google sign-in via `firebase/auth` (`signInWithPopup`).
- Components receive the Firebase `user` object as a prop from `App.jsx`.
- Protected routes redirect to `/login` if unauthenticated.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — Production build
- `npm run lint` — ESLint

## Conventions

- **New pages**: Create under `src/components/`, register a protected route
  in `src/App.jsx`, pass `user` and `onSignOut` as props.
- **Navigation**: Add items to the `navItems` array in
  `src/components/navbar.jsx` with a `lucide-react` icon.
- **Route pattern**: Pages that render their own Navbar (Notes, About,
  Mind Training) handle it internally rather than in `App.jsx`.
- **Subcomponents**: Groups of related components live in their own folder
  (e.g. `src/components/MindTraining/`, `src/components/Notes/`).
- **Design**: Dark glassmorphism — `bg-[#050507]`, orange accent
  (`#f97316` / `orange-500`), `bg-white/[0.02]`, `border-white/10`,
  `rounded-[2rem]`–`[3rem]`, `backdrop-blur`. Use `framer-motion` for
  entrance/exit animations.
- **Modals**: Follow the `NamingModal` pattern (fixed overlay, glass card,
  `AnimatePresence`). Reuse `DeleteModal` from Notes for confirmations.
- **Toast notifications**: Use `react-hot-toast` (`toast.success` /
  `toast.error`).
- **Loading states**: Use `ClipLoader` from `react-spinners`.
- **Timestamps**: Use `Date.now()` for user content (matches todo pattern).