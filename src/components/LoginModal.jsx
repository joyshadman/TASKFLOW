// src/components/LoginModal.jsx
// Modal that hosts the shared LoginCard (same sign-in UI as the /login page).
// Rendered above the Dock (z-[10000]) so it never conflicts with navigation.
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LoginCard } from "./LoginPage";

const LoginModal = ({ isOpen, onClose }) => {
  // Lock body scroll while the dialog is open.
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop blur — click to close */}
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
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md"
          >
            {/* Close button — floats above the card's top-right */}
            <button
              onClick={onClose}
              aria-label="Close login"
              className="absolute -top-3 -right-3 z-20 w-11 h-11 flex items-center justify-center bg-[#1C1726]/90 backdrop-blur-3xl border border-[#D8B4FE]/15 rounded-full text-white/50 hover:text-white hover:rotate-90 transition-all shadow-2xl"
            >
              <X size={18} />
            </button>
            <LoginCard onSuccess={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;