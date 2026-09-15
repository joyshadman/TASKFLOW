# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete

## Current Goal

- Mind Training feature — fully implemented with Firebase Realtime Database persistence, custom questions, history, and progress tracking.

## Completed

- Mind Training feature:
  - Daily training page with 5 default reflection questions
  - Firebase Realtime Database persistence at `users/{uid}/mindTraining/{date}`
  - One entry per day, create-or-update via `set()`
  - Local calendar date keys (`YYYY-MM-DD`, UTC-safe)
  - Answer merging to preserve historical question text
  - Progress card with animated bar and count
  - Save states: idle → saving → saved → idle, with error handling
  - History section (newest-first) with view modal
  - Custom questions: add, edit, delete, enable/disable toggle
  - Custom questions persisted at `users/{uid}/mindTrainingQuestions/{id}`
  - Custom question modal (reuses NamingModal glass design)
  - Delete confirmation modal (reuses Notes/DeleteModal)
  - Navigation: Brain icon added to navbar (desktop + mobile)
  - Route: `/mind-training` (protected, requires auth)
  - Full responsive design (desktop + mobile, no horizontal scroll)
  - Reuses existing Firebase config, auth, design system, and conventions
  - context/mind-training.md created with full implementation docs
  - context/architecture.md filled in with actual project stack
  - AGENTS.md created with project conventions

## In Progress

- None.

## Next Up

- [To be determined]

## Open Questions

- None.

## Architecture Decisions

- **Realtime Database over Firestore for Mind Training**: The established
  user-data convention in this project is Firebase Realtime Database.
  Todos, notes, folders, and location all live under `users/{uid}/...` in
  RDB using `ref`/`onValue`/`set`/`update`/`remove`. Firestore was
  initialized for the login profile doc only. Following the existing
  pattern avoids introducing a second storage style.
- **`Date.now()` timestamps**: Matches the convention used in todos
  (`createdAt: Date.now()`) and notes (`updatedAt: new Date().toISOString()`).
  RDB entries use `Date.now()` for consistency with the todo pattern.
- **Answers as object map keyed by questionId**: Matches the existing RDB
  pattern (objects keyed by child ID) and enables targeted updates.
- **Merge on save for today's entry**: `{ ...existing.answers, ...newAnswers }`
  ensures disabled/deleted questions' answers are preserved in historical
  entries.
- **`onValue` on full `mindTraining` subtree**: Consistent with how notes
  and todos load data. Per-user subtree is small (daily entries).

## Session Notes

- Build passes; lint has only pre-existing `motion` unused-var false positives.
- Existing pages (Home, Notes, About) are untouched.