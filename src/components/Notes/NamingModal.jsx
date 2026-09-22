import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

const NamingModal = ({ isOpen, onClose, onSubmit, type }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) setName(""); // Reset when opened
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
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
          className="relative w-full max-w-md bg-[#1C1726]/80 backdrop-blur-2xl border border-[#D8B4FE]/15 rounded-[2.5rem] p-8 shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white">
              New {type}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500">
              <X size={20} />
            </button>
          </div>

          <div className="relative group mb-8">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name && onSubmit(name)}
              placeholder={`Enter ${type.toLowerCase()} name...`}
              className="w-full bg-white/5 border border-[#D8B4FE]/15 rounded-2xl py-4 px-6 outline-none focus:border-[#BF5AF2]/50 transition-all text-lg font-medium text-white placeholder:text-gray-600"
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
              disabled={!name}
              onClick={() => onSubmit(name)}
              className="flex-1 py-4 bg-[#BF5AF2] rounded-2xl text-sm font-bold uppercase tracking-widest text-white hover:bg-[#BF5AF2] disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-[#BF5AF2]/20 flex items-center justify-center gap-2"
            >
              Create {type} <Check size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NamingModal;