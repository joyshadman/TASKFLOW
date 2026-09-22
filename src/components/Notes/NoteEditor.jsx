// src/components/Notes/NoteEditor.jsx
// Keep-style note editor with debounced auto-save.
//
// - Title and body are LOCAL state so typing never re-renders the Notes grid.
// - Every typed change schedules a single debounced Firestore/RTBD write
//   (700ms) — no write per keystroke.
// - A subtle Saving… / Saved / Save failed indicator sits in the header.
// - Immediate metadata actions (pin/archive/trash/restore/color/labels) go
//   through the parent's optimistic updaters.
// - Closes flush any pending save before unmounting (safe navigation away).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ref, update } from "firebase/database";
import { db } from "../../Config/firebaseConfig";
import toast from "react-hot-toast";
import {
  X,
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  RotateCcw,
  Tag,
  Check,
} from "lucide-react";
import { colorFor } from "./noteColorValues";
import { ColorSwatches } from "./NoteColors";
import { formatWhen } from "./notes-utils";

const AUTOSAVE_MS = 700;

const SaveStatus = ({ status }) => {
  if (status === "saving")
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/45">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#BF5AF2]" />
        Saving…
      </span>
    );
  if (status === "error")
    return (
      <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
        Save failed
      </span>
    );
  if (status === "saved")
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
        <Check size={11} /> Saved
      </span>
    );
  return <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Note</span>;
};

const MetaButton = ({ title, active, danger, onClick, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
      danger
        ? "text-red-400 hover:bg-red-500/10"
        : active
        ? "bg-[#BF5AF2]/10 text-[#BF5AF2]"
        : "text-white/40 hover:bg-white/10 hover:text-white"
    }`}
  >
    {children}
  </button>
);

const NoteEditor = ({
  user,
  note,
  onClose,
  onTogglePin,
  onSetArchived,
  onTrash,
  onRestore,
  onDeletePermanent,
  onSetColor,
  onSetLabels,
}) => {
  const bodyRef = useRef(null);
  const titleRef = useRef(note?.title || "");
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef(null);
  const resetTimerRef = useRef(null);
  const loadedIdRef = useRef(null);

  const [title, setTitle] = useState(note?.title || "");
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [labelInput, setLabelInput] = useState("");

  const labels = Array.isArray(note?.labels) ? note.labels : [];

  // Hydrate when switching to a different note. Guarded by loadedIdRef so RTDB
  // echoes during active editing never clobber what the user is typing.
  useEffect(() => {
    if (loadedIdRef.current === note?.id) return;
    loadedIdRef.current = note?.id;
    setTitle(note?.title || "");
    titleRef.current = note?.title || "";
    dirtyRef.current = false;
    setStatus("idle");
    if (bodyRef.current) {
      bodyRef.current.innerHTML = note?.content || note?.content_enc || "";
    }
  }, [note]);

  // Write the full current draft to the database.
  const flushSave = useCallback(async () => {
    if (!user?.uid || !note?.id) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setStatus("saving");
    try {
      const html = bodyRef.current?.innerHTML || "";
      await update(ref(db, `users/${user.uid}/notes/${note.id}`), {
        title: titleRef.current.trim() || "Untitled",
        content: html,
        content_enc: html,
        updatedAt: Date.now(),
      });
      dirtyRef.current = false;
      setStatus("saved");
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setStatus("idle");
        resetTimerRef.current = null;
      }, 1800);
    } catch (err) {
      console.error("Note autosave failed:", err);
      setStatus("error");
      toast.error("Couldn't save your note. Check your connection.");
    }
  }, [user?.uid, note?.id]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      flushSave();
    }, AUTOSAVE_MS);
  }, [flushSave]);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    titleRef.current = value;
    scheduleSave();
  };

  const handleClose = useCallback(async () => {
    if (dirtyRef.current) {
      try {
        await flushSave();
      } catch {
        /* error surfaced by flushSave */
      }
    }
    onClose();
  }, [flushSave, onClose]);

  // Escape closes (with a flush). Cmd/Ctrl+Enter saves immediately.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        dirtyRef.current = true;
        flushSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, flushSave]);

  // Clear the pending debounce timer if the editor unmounts abruptly.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const addLabel = () => {
    const value = labelInput.trim();
    if (!value || labels.includes(value)) {
      setLabelInput("");
      return;
    }
    onSetLabels(note.id, [...labels, value]);
    setLabelInput("");
  };

  const removeLabel = (value) =>
    onSetLabels(note.id, labels.filter((l) => l !== value));

  const bg = colorFor(note.color);
  const inTrash = !!note.inTrash;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ y: 60, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex h-[88vh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-[#D8B4FE]/15 shadow-2xl sm:h-auto sm:max-h-[85vh] sm:w-[600px] sm:rounded-[2rem]"
        style={{
          backgroundColor: bg || "rgba(28, 23, 38, 0.96)",
          backdropFilter: "blur(28px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D8B4FE]/10 px-5 py-3">
          <SaveStatus status={status} />
          <div className="flex items-center gap-2">
            {note?.updatedAt ? (
              <span className="hidden text-[10px] font-bold uppercase tracking-widest text-white/25 md:block">
                {formatWhen(note.updatedAt)}
              </span>
            ) : null}
            <button
              onClick={handleClose}
              aria-label="Close editor"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Color
            </span>
            <ColorSwatches
              value={note.color || null}
              onChange={(c) => onSetColor(note.id, c)}
            />
          </div>

          <input
            value={title}
            onChange={handleTitleChange}
            placeholder="Title"
            className="w-full bg-transparent pb-3 text-2xl font-bold tracking-tight text-white outline-none placeholder:text-white/20"
          />

          <div
            ref={bodyRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onInput={scheduleSave}
            className="min-h-[180px] w-full whitespace-pre-wrap break-words text-[15px] leading-relaxed text-white/80 outline-none"
          />

          {/* Labels */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
              <Tag size={12} /> Labels
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {labels.map((label) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-[#D8B4FE]/15 bg-white/5 px-3 py-1 text-xs font-semibold text-[#A78BFA]"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    aria-label={`Remove label ${label}`}
                    className="text-white/40 transition-colors hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addLabel();
                  }
                }}
                onBlur={addLabel}
                placeholder="Add a label…"
                className="w-32 bg-transparent text-xs font-semibold outline-none placeholder:text-white/25"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 border-t border-[#D8B4FE]/10 px-4 py-2">
          <div className="flex items-center gap-1">
            {!inTrash && (
              <MetaButton
                title={note.pinned ? "Unpin" : "Pin"}
                active={!!note.pinned}
                onClick={() => onTogglePin(note.id)}
              >
                <Pin size={17} className={note.pinned ? "fill-current" : ""} />
              </MetaButton>
            )}
            {!inTrash && (
              <MetaButton
                title={note.archived ? "Unarchive" : "Archive"}
                active={!!note.archived}
                onClick={() => {
                  onSetArchived(note.id, !note.archived);
                  handleClose();
                }}
              >
                {note.archived ? <ArchiveRestore size={17} /> : <Archive size={17} />}
              </MetaButton>
            )}
          </div>

          <div className="flex items-center gap-1">
            {inTrash ? (
              <>
                <MetaButton
                  title="Restore"
                  onClick={() => {
                    onRestore(note.id);
                    handleClose();
                  }}
                >
                  <RotateCcw size={17} />
                </MetaButton>
                <MetaButton title="Delete permanently" danger onClick={() => onDeletePermanent(note.id)}>
                  <Trash2 size={17} />
                </MetaButton>
              </>
            ) : (
              <MetaButton
                title="Move to trash"
                danger
                onClick={() => {
                  onTrash(note.id);
                  handleClose();
                }}
              >
                <Trash2 size={17} />
              </MetaButton>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NoteEditor;