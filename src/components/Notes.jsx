// src/components/Notes.jsx
// Keep-style Notes system built on the existing Firebase Realtime Database
// convention (users/{uid}/notes, users/{uid}/folders).
//
// Views: Pinned / All Notes / Archived / Trash + folders + instant client-side
// search (debounced). All mutations are optimistic (UI updates immediately,
// then syncs to the DB; failures surface a toast). Normal delete moves a note
// to Trash — permanent deletion requires a confirmation modal.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ref, set, update, remove, onValue } from "firebase/database";
import { db } from "../Config/firebaseConfig";
import toast from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import {
  Pin,
  StickyNote,
  Archive,
  Trash2,
  Folder,
  FolderPlus,
  Search,
  Inbox,
  X,
} from "lucide-react";
import { useDebouncedValue } from "../utils/performance";
import NoteCard from "./Notes/NoteCard";
import NoteComposer from "./Notes/NoteComposer";
import NoteEditor from "./Notes/NoteEditor";
import NamingModal from "./Notes/NamingModal";
import DeleteModal from "./Notes/DeleteModal";
import { stripHtml, textToHtml } from "./Notes/notes-utils";

const Notes = ({ user }) => {
  const [notes, setNotes] = useState({});
  const [folders, setFolders] = useState({});
  const [ready, setReady] = useState(false);

  const [view, setView] = useState("all"); // all | pinned | archived | trash
  const [folderFilter, setFolderFilter] = useState(null);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search, 200);

  const [activeId, setActiveId] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [folderModal, setFolderModal] = useState(false);

  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Single set of RTDB listeners — created once per user, cleaned up on
  // unmount (no duplicate listeners, no leaks).
  useEffect(() => {
    if (!user?.uid) return;
    const offNotes = onValue(ref(db, `users/${user.uid}/notes`), (snap) => {
      setNotes(snap.val() || {});
      setReady(true);
    });
    const offFolders = onValue(ref(db, `users/${user.uid}/folders`), (snap) =>
      setFolders(snap.val() || {})
    );
    return () => {
      offNotes();
      offFolders();
    };
  }, [user?.uid]);

  // If the active note vanished (deleted elsewhere), close the editor.
  useEffect(() => {
    if (activeId && !notes[activeId]) setActiveId(null);
  }, [activeId, notes]);

  const patchNote = useCallback(
    (id, patch) => {
      if (!user?.uid) return;
      const merged = { ...patch, updatedAt: Date.now() };
      setNotes((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...merged } } : prev));
      update(ref(db, `users/${user.uid}/notes/${id}`), merged).catch((err) => {
        console.error("Note update failed:", err);
        toast.error("Couldn't save your change.");
      });
    },
    [user?.uid]
  );

  const togglePin = useCallback(
    (id) => {
      const cur = notesRef.current[id];
      if (cur) patchNote(id, { pinned: !cur.pinned });
    },
    [patchNote]
  );

  const setArchived = useCallback(
    (id, archived) => patchNote(id, { archived }),
    [patchNote]
  );

  const trashNote = useCallback(
    (id) => patchNote(id, { inTrash: true, archived: false, pinned: false }),
    [patchNote]
  );

  const restoreNote = useCallback(
    (id) => patchNote(id, { inTrash: false, archived: false }),
    [patchNote]
  );

  const setColor = useCallback(
    (id, color) => patchNote(id, { color }),
    [patchNote]
  );

  const setLabels = useCallback(
    (id, labels) => patchNote(id, { labels }),
    [patchNote]
  );

  const permanentDelete = useCallback(
    (id) => {
      if (!user?.uid) return;
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      remove(ref(db, `users/${user.uid}/notes/${id}`)).catch((err) => {
        console.error("Note permanent delete failed:", err);
        toast.error("Couldn't delete the note.");
      });
    },
    [user?.uid]
  );

  const createNote = useCallback(
    async ({ title = "", content = "", pinned = false, color = null } = {}) => {
      if (!user?.uid) return null;
      const id = String(Date.now());
      const now = Date.now();
      const bodyHtml = textToHtml(content);
      const note = {
        title: title.trim() || "Untitled",
        content: bodyHtml,
        content_enc: bodyHtml,
        color,
        pinned,
        archived: false,
        inTrash: false,
        labels: [],
        folder: folderFilter,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => ({ ...prev, [id]: note }));
      try {
        await set(ref(db, `users/${user.uid}/notes/${id}`), note);
      } catch (err) {
        console.error("Note create failed:", err);
        toast.error("Couldn't create the note.");
      }
      setActiveId(id);
      return id;
    },
    [user?.uid, folderFilter]
  );

  const createFolder = useCallback(
    async (name) => {
      if (!user?.uid || !name.trim()) return;
      const id = String(Date.now());
      const folder = { name: name.trim(), createdAt: Date.now() };
      setFolders((prev) => ({ ...prev, [id]: folder }));
      try {
        await set(ref(db, `users/${user.uid}/folders/${id}`), folder);
      } catch (err) {
        console.error("Folder create failed:", err);
        toast.error("Couldn't create the folder.");
      }
    },
    [user?.uid]
  );

  // --- Derived lists ---
  const allNotes = useMemo(
    () => Object.entries(notes).map(([id, n]) => ({ id, ...(n || {}) })),
    [notes]
  );

  const counts = useMemo(
    () => ({
      all: allNotes.filter((n) => !n.archived && !n.inTrash).length,
      pinned: allNotes.filter((n) => n.pinned && !n.archived && !n.inTrash).length,
      archived: allNotes.filter((n) => n.archived && !n.inTrash).length,
      trash: allNotes.filter((n) => n.inTrash).length,
    }),
    [allNotes]
  );

  const filtered = useMemo(() => {
    let list = allNotes;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          !n.inTrash &&
          ((n.title || "").toLowerCase().includes(q) ||
            stripHtml(n.content || n.content_enc || "").toLowerCase().includes(q) ||
            (Array.isArray(n.labels) &&
              n.labels.some((l) => l.toLowerCase().includes(q))))
      );
    } else {
      switch (view) {
        case "pinned":
          list = list.filter((n) => n.pinned && !n.archived && !n.inTrash);
          break;
        case "archived":
          list = list.filter((n) => n.archived && !n.inTrash);
          break;
        case "trash":
          list = list.filter((n) => n.inTrash);
          break;
        default:
          list = list.filter((n) => !n.archived && !n.inTrash);
      }
    }
    if (folderFilter) list = list.filter((n) => n.folder === folderFilter);
    return [...list].sort(
      (a, b) =>
        (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updatedAt || 0) - (a.updatedAt || 0)
    );
  }, [allNotes, view, query, folderFilter]);

  const showSections = !query && view === "all" && !folderFilter;
  const pinnedNotes = showSections ? filtered.filter((n) => n.pinned) : [];
  const otherNotes = showSections ? filtered.filter((n) => !n.pinned) : filtered;

  const activeNote = activeId ? notes[activeId] : null;

  const folderList = useMemo(
    () => Object.entries(folders).sort((a, b) => (a[1].name || "").localeCompare(b[1].name || "")),
    [folders]
  );

  const clearSearch = () => setSearch("");

  // --- Dialogs ---
  const confirmDelete = delTarget ? (
    <DeleteModal
      isOpen
      itemName="this note"
      itemType="Note"
      onClose={() => setDelTarget(null)}
      onConfirm={() => {
        permanentDelete(delTarget);
        setDelTarget(null);
      }}
    />
  ) : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0E0C13] text-[#F5F3FF]">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[60%] w-[60%] rounded-full bg-[#BF5AF2]/8 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[#7C4DFF]/8 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-36 pt-6 md:px-6">
        <div className="flex gap-6">
          {/* Sidebar (desktop) */}
          <aside className="sticky top-6 hidden h-fit w-56 shrink-0 flex-col gap-6 lg:flex">
            <div className="flex flex-col gap-1">
              {[
                { key: "all", label: "All Notes", icon: StickyNote, count: counts.all },
                { key: "pinned", label: "Pinned", icon: Pin, count: counts.pinned },
                { key: "archived", label: "Archived", icon: Archive, count: counts.archived },
                { key: "trash", label: "Trash", icon: Trash2, count: counts.trash },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    setFolderFilter(null);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    view === item.key && !folderFilter
                      ? "border-[#BF5AF2]/25 bg-[#BF5AF2]/15 text-[#BF5AF2]"
                      : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon size={16} />
                  <span className="flex-1">{item.label}</span>
                  <span
                    className={`text-[10px] font-black ${
                      view === item.key && !folderFilter ? "text-[#BF5AF2]/70" : "text-white/25"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Folders */}
            <div>
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                  Folders
                </span>
                <button
                  onClick={() => setFolderModal(true)}
                  aria-label="New folder"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-[#BF5AF2]"
                >
                  <FolderPlus size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setFolderFilter(null)}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                    !folderFilter && view === "all"
                      ? "border-[#BF5AF2]/25 bg-[#BF5AF2]/15 text-[#BF5AF2]"
                      : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Folder size={16} className="text-white/35" />
                  <span className="flex-1">All folders</span>
                </button>
                {folderList.map(([id, folder]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setFolderFilter(id);
                      setView("all");
                    }}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      folderFilter === id
                        ? "border-[#BF5AF2]/25 bg-[#BF5AF2]/15 text-[#BF5AF2]"
                        : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Folder size={16} className="text-white/35" />
                    <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0 flex-1">
            {/* Header */}
            <header className="mb-6">
              <h1 className="text-3xl font-black tracking-tighter md:text-4xl">
                Notes
              </h1>
            </header>

            {/* Search */}
            <div className="relative mb-4">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes…"
                className="w-full rounded-full border border-[#D8B4FE]/15 bg-[#1C1726]/60 py-3 pl-11 pr-10 text-sm outline-none backdrop-blur-xl transition-colors placeholder:text-white/25 focus:border-[#BF5AF2]/40"
              />
              {search && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile view chips */}
            <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 lg:hidden">
              {[
                { key: "all", label: "All", icon: StickyNote, count: counts.all },
                { key: "pinned", label: "Pinned", icon: Pin, count: counts.pinned },
                { key: "archived", label: "Archived", icon: Archive, count: counts.archived },
                { key: "trash", label: "Trash", icon: Trash2, count: counts.trash },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    setFolderFilter(null);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${
                    view === item.key && !folderFilter
                      ? "border-[#BF5AF2]/25 bg-[#BF5AF2]/15 text-[#BF5AF2]"
                      : "border-[#D8B4FE]/15 bg-[#1C1726]/60 text-white/60"
                  }`}
                >
                  <item.icon size={13} /> {item.label}
                  <span className="text-[9px]">{item.count}</span>
                </button>
              ))}
            </div>

            {/* Composer (hidden in trash view) */}
            {view !== "trash" && <NoteComposer onCreate={createNote} />}

            {/* Grid */}
            {!ready ? (
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="mb-4 break-inside-avoid animate-pulse rounded-[1.6rem] border border-[#D8B4FE]/10 bg-[#1C1726]/40 p-5"
                    style={{ height: 140 + ((i * 37) % 90) }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-[#D8B4FE]/10 bg-[#1C1726]/40 px-6 py-20 text-center">
                <Inbox size={40} className="mb-4 text-[#BF5AF2]/40" />
                <p className="text-sm font-semibold text-white/60">
                  {query
                    ? "No notes match your search."
                    : view === "trash"
                    ? "Trash is empty."
                    : view === "archived"
                    ? "No archived notes."
                    : view === "pinned"
                    ? "No pinned notes."
                    : folderFilter
                    ? "No notes in this folder yet."
                    : "No notes yet. Write your first note above."}
                </p>
              </div>
            ) : (
              <>
                {showSections && pinnedNotes.length > 0 && (
                  <>
                    <SectionLabel>Pinned</SectionLabel>
                    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                      {pinnedNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          view={view}
                          onOpen={setActiveId}
                          onTogglePin={togglePin}
                          onSetArchived={setArchived}
                          onTrash={trashNote}
                          onRestore={restoreNote}
                          onDelete={setDelTarget}
                        />
                      ))}
                    </div>
                  </>
                )}
                {showSections && pinnedNotes.length > 0 && (
                  <SectionLabel>Others</SectionLabel>
                )}
                <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      view={view}
                      onOpen={setActiveId}
                      onTogglePin={togglePin}
                      onSetArchived={setArchived}
                      onTrash={trashNote}
                      onRestore={restoreNote}
                      onDelete={setDelTarget}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <NamingModal
        isOpen={folderModal}
        type="Folder"
        onClose={() => setFolderModal(false)}
        onSubmit={(name) => {
          createFolder(name);
          setFolderModal(false);
        }}
      />

      {confirmDelete}

      <AnimatePresence>
        {activeNote && (
          <NoteEditor
            key={activeNote.id}
            user={user}
            note={activeNote}
            onClose={() => setActiveId(null)}
            onTogglePin={togglePin}
            onSetArchived={setArchived}
            onTrash={trashNote}
            onRestore={restoreNote}
            onDeletePermanent={setDelTarget}
            onSetColor={setColor}
            onSetLabels={setLabels}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <p className="mb-3 mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
    {children}
  </p>
);

export default Notes;