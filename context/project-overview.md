# TaskFlow

## Overview

TaskFlow is a dark glassmorphism productivity application for personal task
management and self-improvement. Users create todos with category labels and
mission timers, take rich-text notes, and complete a daily "mind training"
reflection. Firebase provides cloud persistence and Google sign-in, with
per-user data scoped under each account.

## Goals

1. Fast, beautiful, distraction-free todo + timer workflow.
2. Persistent, per-user cloud data (todos, notes, mind training, weather) with
   a responsive login/auth experience.
3. Reliable navigation via a bottom React Bits-style Dock, with every route
   working on direct load and refresh.
4. Stable auth with zero flicker: the app waits for Firebase to resolve the
   session before rendering or redirecting.

## Core User Flow

1. User opens the app (or a sub-URL directly). Firebase restores the session.
2. Unauthenticated users reach `/login`; the Dock shows a **Log in** action that
   opens the login modal.
3. User continues with Google → Firebase auth updates → protected UI appears.
4. User manages todos (Home/Dashboard), writes notes, does Mind Training, and
   views Account — all persisted under `users/{uid}`.
5. Sign out via the Dock avatar popover; protected routes redirect to `/login`.

## Features

### Todos & Timers

- Todo list with categories, completion toggle, ongoing flag, and mission timers
  (with alarm + deep-focus mode).
- Motivation quotes and live weather (Firebase-stored location + search).

### Notes

- Rich-text editor with folders, autosave, and real-time sync.

### Mind Training

- Daily reflection questions, custom questions, progress tracking, and history.

### Authentication & Navigation

- Google sign-in (page + modal), persisted sessions, protected routes.
- React Bits-style Dock as the primary navigation with active-route indicators.

## Scope

### In Scope

- Single Firebase app (Auth, Realtime Database, Firestore profile doc).
- All existing pages + `/account`.
- SPA route fallback for direct loads and refreshes.

### Out of Scope

- Non-Google auth providers.
- localStorage as a primary data store.
- A second Firebase initialization.

## Success Criteria

1. A signed-in user can create, edit, and complete todos across reloads.
2. Clicking Login reliably opens login options and authenticates.
3. Every route (including direct sub-URL loads and refreshes) renders correctly
   for both authenticated and unauthenticated users.
4. Auth state never flickers: no transient logged-out UI while Firebase
   restores the session.
5. `npm run lint` passes and `npm run build` succeeds.