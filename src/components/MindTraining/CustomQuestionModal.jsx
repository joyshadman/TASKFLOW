import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

// Dialog used to both add a new custom question and edit an existing one.
// When `initialValue` is provided the dialog is in "edit" mode.
const CustomQuestionModal = ({ isOpen, initialValue, onClose, onSubmit }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isOpen) setValue(initialValue || "");
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-[#111]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white">
              {initialValue ? "Edit Question" : "Add Custom Question"}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500">
              <X size={20} />
            </button>
          </div>

          <div className="relative group mb-8">
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && value.trim() && onSubmit(value.trim())}
              placeholder="What did I learn today?"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-orange-500/50 transition-all text-lg font-medium text-white placeholder:text-gray-600"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest text-gray-400 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              disabled={!value.trim()}
              onClick={() => onSubmit(value.trim())}
              className="flex-1 py-4 bg-orange-600 rounded-2xl text-sm font-bold uppercase tracking-widest text-white hover:bg-orange-500 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
            >
              {initialValue ? "Save Question" : "Add Question"} <Check size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CustomQuestionModal;