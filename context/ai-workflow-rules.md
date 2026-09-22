# AI Workflow Rules

## Approach

Work against the context files. `architecture.md` defines the system
boundaries, invariants, and stability rules; `ui-context.md` defines the visual
language; `code-standards.md` defines the coding conventions. Implement against
these specs — do not infer or invent behavior from scratch.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.

## When to Split Work

Split an implementation step if it combines:

- UI changes and background/state changes
- Multiple unrelated routes
- Behavior not clearly defined in the context files

If a change cannot be verified end to end quickly, the scope is too broad —
split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before
  implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md`
  before continuing.

## Protected Areas

- `src/Config/firebaseConfig.js` — single Firebase initialization; always
  import from here, never re-initialize.
- Any third-party library internals.
- Firestore/Realtime Database security rules must never be weakened.

## Stability Rules (always)

- Wait for Firebase auth state to resolve before protected-route redirects or
  user-scoped Firebase queries — never redirect while the auth listener is still
  initializing.
- Do not initialize Firebase more than once.
- React Bits Dock is the application's primary navigation.
- Reuse the existing Google sign-in system and the shared `LoginCard`.
- Use the Firestore `firestore` instance for the Firestore profile doc.
- Support direct sub-URL loads/refreshes via the SPA fallback; never use
  `window.location.reload()` as a fix.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries
- Storage model decisions
- Code conventions or standards
- Feature scope
- Navigation (`Dock.jsx` items, routes in `App.jsx`)

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work.
4. `npm run lint` passes and `npm run build` passes.