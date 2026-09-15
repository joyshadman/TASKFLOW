# Mind Training — Feature Documentation

## Feature

Mind Training is a personal daily reflection/training area where users answer
structured questions, save them to their cloud database, and review historical
entries. Each day has one entry. Five default questions appear automatically;
users can add, edit, toggle, and delete custom questions that are also
persisted.

## Firebase

Mind Training reuses the single Firebase app created in
`src/Config/firebaseConfig.js`. No new Firebase initialization is introduced.

| What           | How                                   |
| -------------- | ------------------------------------- |
| App instance   | `app` from `firebaseConfig.js`        |
| Database       | Realtime Database (`db` instance)     |
| Authentication | `firebase/auth` — `getAuth(app)`      |

All Mind Training data is stored in Firebase Realtime Database following the
existing user-data convention used by Todos, Notes, Folders, and Location:
`users/{userId}/...`.

## Authentication

The currently authenticated Firebase user is passed as the `user` prop to
`MindTrainingPage` from `App.jsx`. The user's `uid` is used as the
user-scoping key. If unauthenticated, the user is redirected to `/login` via
the route guard in `App.jsx`.

## Firestore / Realtime Database Structure

All data lives under the existing Realtime Database tree:

```
users
  └── {userId}
      ├── todos/           (existing)
      ├── notes/           (existing)
      ├── folders/         (existing)
      ├── location/        (existing)
      ├── mindTraining/
      │   └── {YYYY-MM-DD}
      └── mindTrainingQuestions/
          └── {questionId}
```

### Daily Entry Document

Path: `users/{userId}/mindTraining/{dateKey}`

```ts
{
  date: string;          // "YYYY-MM-DD" — local calendar date
  createdAt: number;     // Date.now() at creation
  updatedAt: number;     // Date.now() at last save
  answers: {
    [questionId]: {
      questionId: string;
      question: string;  // Snapshot of question text at time of save
      answer: string;    // User's trimmed response
    }
  }
}
```

### Custom Questions Document

Path: `users/{userId}/mindTrainingQuestions/{questionId}`

```ts
{
  question: string;      // The question text
  type: "custom";        // Identifies custom (not default) questions
  enabled: boolean;      // Shown in today's training when true
  createdAt: number;     // Date.now() at creation
  updatedAt: number;     // Date.now() at last edit
}
```

## Daily Entries

- **Date key**: Local calendar date in `YYYY-MM-DD` format, generated via
  `localDateKey()` in `src/components/MindTraining/dateUtils.js`.
- **One per day**: Each date key maps to exactly one document.
- **Load on mount**: `onValue` on `users/{uid}/mindTraining` loads all
  entries. Today's entry is read from the snapshot by key.
- **Create / Update**: `set(ref(db, path), {...})` is used to create or
  fully overwrite today's document. This is idempotent and prevents
  duplicate entries for the same day.
- **Merge on save**: Existing answers for questions no longer displayed are
  preserved via a merge (`{ ...existing.answers, ...newAnswers }`).

## Historical Integrity

When a daily entry is saved, both the `questionId` and the current `question`
text are stored in the `answers` object. This means:

- If a custom question is later renamed, old entries still display the
  original question text.
- If a custom question is deleted, old entries retain both the question and
  answer.
- The History modal reads directly from stored entry documents, never from
  the live question definitions.

## Custom Questions

**Add**: Opens `CustomQuestionModal` (Add mode). New document is created
with `set(ref(db, path), {...})` using `Date.now()` as the key.

**Edit**: Opens `CustomQuestionModal` (Edit mode). The document is updated
with `update(ref(db, path), { question, updatedAt })`.

**Delete**: Opens `DeleteModal` (reused from Notes feature). Confirmed by
user, then `remove(ref(db, path))` is called.

**Toggle (enable/disable)**: A pill toggle next to each custom question.
Calls `update(ref(db, path), { enabled, updatedAt })`.

Default questions cannot be deleted or renamed; they are always the first
five items in the list.

## Security

All Mind Training data is scoped under `users/{userId}` using the
authenticated user's Firebase `uid`. The `MindTrainingPage` component only
subscribes to `users/{user.uid}/...` paths. No shared or public collections
are used.

Firebase Realtime Database security rules (managed in the Firebase console)
should enforce:
- `read`: `auth.uid !== null && auth.uid === $userId`
- `write`: `auth.uid !== null && auth.uid === $userId`

This mirrors the existing security model for todos, notes, and folders.

## UI

### Route

- Path: `/mind-training`
- Protected route in `App.jsx`, redirects to `/login` if unauthenticated.
- `MindTrainingPage` renders its own `Navbar` (same as Notes and About).

### Navigation

- Added to `src/components/navbar.jsx` in the `navItems` array.
- `Brain` icon from `lucide-react`.
- Appears in both desktop pill nav and mobile fullscreen menu.

### Page Structure

```
Navbar (renders inside MindTrainingPage)
  ↓
Hero: Brain icon + "Mind Training" + subtitle
  ↓
Today's Training header (formatted date)
  ↓
ProgressCard: answered/total + animated progress bar + percent
  ↓
QuestionCard × N (default + enabled custom, in order)
  ↓
SaveBar: "Save Today's Training" → Saving... → Saved ✓
  ↓
CustomQuestionsSection: list + toggle + edit/delete + Add button
  ↓
HistorySection: previous entries newest-first, each with View button
  ↓
Modals: HistoryModal, CustomQuestionModal, DeleteModal
```

### Design Tokens Used

Follows existing glassmorphism theme:

- `bg-[#050507]` page background
- `bg-white/[0.03]` / `bg-white/[0.02]` card surfaces
- `border-white/10` / `border-orange-500/30` borders
- `backdrop-blur-3xl` / `backdrop-blur-2xl` glass effects
- `rounded-[2rem]` / `rounded-[2.5rem]` border radii
- `text-orange-500` / `bg-orange-600` accent colors
- `font-black uppercase tracking-[...]` for labels
- `framer-motion` for entrance animations
- `ClipLoader` from `react-spinners` for loading states
- `react-hot-toast` for success/error notifications
- `lucide-react` icons (Brain, Plus, Trash2, Pencil, etc.)

### Responsive

- `max-w-2xl mx-auto` centered content
- Full-width on mobile, comfortable textareas with `min-h-[96px]`
- Large tap targets for custom question toggles, edit/delete buttons
- History entries are full-width buttons

## Data Flow

```
MindTrainingPage
  ↓
Firebase Auth (user.uid)
  ↓
onValue listeners (real-time sync)
  ↓
users/{userId}/mindTraining/{date}   → today's + history entries
users/{userId}/mindTrainingQuestions  → custom question definitions
  ↓
React state → UI rendering → handleSave → set(ref(...))
  ↓
Firebase echoes back via onValue → state reconciled
```

## File Organization

```
src/components/
  MindTrainingPage.jsx          — Main page + internal sub-components
  MindTraining/
    defaultQuestions.js         — DEFAULT_QUESTIONS constant (5 questions)
    dateUtils.js                — localDateKey(), formatDisplayDate()
    CustomQuestionModal.jsx     — Add/edit custom question dialog
```

No new Firebase config, auth, or storage initialization was introduced.
The feature fully reuses the existing Firebase infrastructure.