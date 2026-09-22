// src/components/Notes/NoteCard.jsx
// Keep-style note card. Memoized: it only re-renders when its own note object
// (or callbacks) change, so typing in the editor never re-renders every card.
import React, { useMemo } from "react";
import {
  Pin,
  Archive,
  Trash2,
  ArchiveRestore,
  RotateCcw,
} from "lucide-react";
import { colorFor } from "./noteColorValues";
import { stripHtml, formatWhen } from "./notes-utils";

const IconBtn = ({ children, title, onClick, danger, active }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
      danger
        ? "hover:bg-red-500/15 hover:text-red-400"
        : active
        ? "text-[#BF5AF2] hover:bg-white/10"
        : "hover:bg-white/10 hover:text-white"
    }`}
  >
    {children}
  </button>
);

const NoteCard = React.memo(
  ({ note, view, onOpen, onTogglePin, onSetArchived, onTrash, onRestore, onDelete }) => {
    const preview = useMemo(
      () => (note.content || note.content_enc ? stripHtml(note.content || note.content_enc) : ""),
      [note.content, note.content_enc]
    );
    const bg = colorFor(note.color);
    const pinned = !!note.pinned;
    const labels = Array.isArray(note.labels) ? note.labels : [];

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(note.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(note.id);
          }
        }}
        className="group mb-4 break-inside-avoid cursor-pointer rounded-[1.6rem] border border-[#D8B4FE]/15 p-5 text-left outline-none transition-colors hover:border-[#BF5AF2]/40 focus-visible:ring-2 focus-visible:ring-[#BF5AF2]/60"
        style={
          bg
            ? { backgroundColor: bg, boxShadow: "inset 0 0 0 1px rgba(216,180,254,0.08)" }
            : { backgroundColor: "rgba(28,23,38,0.6)" }
        }
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-white">
            {note.title || "Untitled"}
          </h3>
          {pinned && view !== "trash" && (
            <Pin size={14} className="mt-0.5 shrink-0 text-[#BF5AF2]" />
          )}
        </div>

        {preview && (
          <p className="mt-2 line-clamp-5 text-sm leading-relaxed text-white/65">{preview}</p>
        )}

        {labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {labels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-[#D8B4FE]/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-[#A78BFA]"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            {formatWhen(note.updatedAt || note.createdAt)}
          </span>

          <div className="flex items-center gap-0.5 text-white/30 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
            {view === "trash" ? (
              <>
                <IconBtn title="Restore" onClick={() => onRestore(note.id)}>
                  <RotateCcw size={15} />
                </IconBtn>
                <IconBtn title="Delete permanently" danger onClick={() => onDelete(note.id)}>
                  <Trash2 size={15} />
                </IconBtn>
              </>
            ) : view === "archived" ? (
              <>
                <IconBtn title="Unarchive" onClick={() => onSetArchived(note.id, false)}>
                  <ArchiveRestore size={15} />
                </IconBtn>
                <IconBtn title="Delete" onClick={() => onTrash(note.id)}>
                  <Trash2 size={15} />
                </IconBtn>
              </>
            ) : (
              <>
                <IconBtn
                  title={pinned ? "Unpin" : "Pin"}
                  active={pinned}
                  onClick={() => onTogglePin(note.id)}
                >
                  <Pin size={15} className={pinned ? "fill-current" : ""} />
                </IconBtn>
                <IconBtn title="Archive" onClick={() => onSetArchived(note.id, true)}>
                  <Archive size={15} />
                </IconBtn>
                <IconBtn title="Delete" onClick={() => onTrash(note.id)}>
                  <Trash2 size={15} />
                </IconBtn>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default NoteCard;