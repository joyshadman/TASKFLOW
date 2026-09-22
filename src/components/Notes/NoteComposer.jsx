// src/components/Notes/NoteComposer.jsx
// Keep-style "Take a note…" card. Expanding reveals title + body + color/pin
// controls. Creating a note optimistically inserts it and opens the editor.
import React, { useState } from "react";
import { Pin, Plus } from "lucide-react";
import { ColorSwatches } from "./NoteColors";

const NoteComposer = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [color, setColor] = useState(null);

  const reset = () => {
    setTitle("");
    setBody("");
    setPinned(false);
    setColor(null);
    setOpen(false);
  };

  const submit = () => {
    if (!title.trim() && !body.trim()) return;
    onCreate({ title: title.trim(), content: body, pinned, color });
    reset();
  };

  return (
    <div className="mb-6 rounded-[1.8rem] border border-[#D8B4FE]/15 bg-[#1C1726]/60 p-4 backdrop-blur-xl transition-colors focus-within:border-[#BF5AF2]/40">
      {open && (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Title"
            className="w-full bg-transparent pb-3 text-lg font-bold tracking-tight outline-none placeholder:text-white/25"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Take a note…"
            rows={2}
            className="min-h-[64px] w-full resize-y bg-transparent text-sm leading-relaxed outline-none placeholder:text-white/25"
          />
        </>
      )}

      <div className="flex items-center gap-3">
        {open && (
          <>
            <ColorSwatches value={color} onChange={setColor} />
            <button
              type="button"
              title="Pin note"
              onClick={() => setPinned((v) => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                pinned ? "text-[#BF5AF2]" : "text-white/30 hover:text-white"
              }`}
            >
              <Pin size={16} className={pinned ? "fill-current" : ""} />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => {
            if (!open) setOpen(true);
            else submit();
          }}
          className={`ml-auto flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
            open
              ? "bg-[#BF5AF2] text-[#0E0C13] hover:brightness-110"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {open ? "Add note" : "Take a note…"}
          {!open && <Plus size={14} />}
        </button>
      </div>
    </div>
  );
};

export default NoteComposer;