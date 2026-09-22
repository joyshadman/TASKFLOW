// src/components/Notes/NoteColors.jsx
// Compact round swatches used by the composer and the editor.
import React from "react";
import { Check } from "lucide-react";
import { NOTE_COLORS } from "./noteColorValues";

export const ColorSwatches = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    {NOTE_COLORS.map((c) => {
      const active = value === c.key;
      return (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(active ? null : c.key)}
          title={c.name}
          aria-label={`Note color: ${c.name}`}
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#BF5AF2]/60 ${
            active
              ? "border-[#BF5AF2] ring-2 ring-[#BF5AF2]/30"
              : c.key === "default"
              ? "border-[#D8B4FE]/30"
              : "border-white/15"
          }`}
          style={
            c.bg
              ? { backgroundColor: c.bg }
              : { background: "radial-gradient(circle, transparent 55%, rgba(216,180,254,0.3) 100%)" }
          }
        >
          {active && <Check size={13} className="text-white/90" />}
        </button>
      );
    })}
  </div>
);