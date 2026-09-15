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
| Routing   | react-router-dom 7                      | Client-side route management            |
| Feedback  | react-hot-toast + react-spinners        | Notifications and loading indicators    |

## System Boundaries

- `src/Config/` — Firebase app initialization and exports
- `src/components/` — All UI components and pages
- `src/components/MindTraining/` — Mind Training feature constants, utils, and modal
- `src/components/Notes/` — Notes feature subcomponents and modals
- `context/` — Architecture documentation for AI coding agents

## Storage Model

- **Firebase Realtime Database** (`db` instance from `getDatabase(app)`):
  - `users/{userId}/todos` — Todo items with category, completion, timer
  - `users/{userId}/notes` — Rich-text notes with HTML content
  - `users/{userId}/folders` — Note folder hierarchy
  - `users/{userId}/location` — Saved geolocation for weather
  - `users/{userId}/mindTraining` — Daily reflection entries (keyed by YYYY-MM-DD)
  - `users/{userId}/mindTrainingQuestions` — Custom questions with enable/disable
- **Firebase Firestore** (`firestore` instance from `getFirestore(app)`):
  - `users/{userId}` — Login profile document (created on first sign-in)

## Auth and Access Model

- All users sign in via Google OAuth using `signInWithPopup`.
- `onAuthStateChanged` drives auth state in `App.jsx`.
- Every component receives the Firebase `user` object as a prop.
- All user data is scoped under `users/{user.uid}` — never shared.
- Protected routes redirect to `/login` if no authenticated user.

## Invariants

1. No second Firebase initialization — always import from `src/Config/firebaseConfig.js`.
2. User content stays in Realtime Database following the `users/{uid}/...` path convention.
3. No localStorage as a primary data store for user content.
4. No duplicate auth systems — the existing Google sign-in is the only auth method.
5. New pages render their own Navbar internally (Notes, About, and Mind Training pattern).