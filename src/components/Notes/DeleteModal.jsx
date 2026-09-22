import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";

const DeleteModal = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        {/* Apple-style backdrop blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />
        
        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-[#1C1726]/90 backdrop-blur-3xl border border-red-500/20 rounded-[2.5rem] p-8 shadow-[0_32px_64px_rgba(220,38,38,0.15)]"
        >
          <div className="flex flex-col items-center text-center">
            {/* Danger Icon with Glow */}
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={32} className="text-red-500" />
            </div>

            <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2">
              Confirm Deletion
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Are you sure you want to delete <span className="text-white font-bold">"{itemName}"</span>? This {itemType.toLowerCase()} will be permanently erased from your vault.
            </p>

            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={onConfirm}
                className="w-full py-4 bg-red-600 rounded-2xl text-sm font-black uppercase tracking-widest text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                Delete Permanently <Trash2 size={16} />
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-widest text-gray-500 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteModal;