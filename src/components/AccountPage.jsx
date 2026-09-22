// src/components/AccountPage.jsx
// Protected account page — shows the signed-in Firebase profile and
// provides a sign-out action. The Dock (global) handles navigation.
import React from "react";
import { motion } from "framer-motion";
import { CircleUser, LogOut, ShieldCheck, Mail, AtSign, Lock } from "lucide-react";

const AccountPage = ({ user, onSignOut }) => {
  return (
    <div className="relative min-h-screen text-white overflow-x-hidden bg-[#0E0C13] selection:bg-[#BF5AF2]/30">
      {/* BACKGROUND ORBS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#BF5AF2]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#BF5AF2]/10 blur-[120px]" />
      </div>

      <main className="mx-auto max-w-2xl p-4 pb-40 relative z-10">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 text-center"
        >
          <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-full border border-[#D8B4FE]/15 bg-white/5 shadow-[0_0_40px_rgba(191,90,242,0.15)]">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="user"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/30">
                <CircleUser size={48} />
              </div>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tighter">
            Hello, <span className="text-[#BF5AF2]">{user?.displayName?.split(" ")[0] || "there"}</span>
          </h1>
          <p className="mt-3 text-white/40 font-medium tracking-tight">Your TaskFlow account</p>
        </motion.div>

        {/* PROFILE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-12 rounded-[3rem] border border-[#D8B4FE]/15 bg-[#1C1726]/60 p-8 backdrop-blur-3xl"
        >
          <div className="space-y-2">
            <InfoRow icon={<AtSign size={16} />} label="Name" value={user?.displayName} />
            <InfoRow icon={<Mail size={16} />} label="Email" value={user?.email} />
            <InfoRow
              icon={<ShieldCheck size={16} />}
              label="Sign-in Method"
              value="Google Authentication"
            />
            <InfoRow
              icon={<Lock size={16} />}
              label="Data"
              value="Scoped to your UID in Firebase"
            />
          </div>
        </motion.div>

        {/* SECURITY NOTE */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-[2rem] border border-[#BF5AF2]/20 bg-[#BF5AF2]/[0.03] p-6 backdrop-blur-xl"
        >
          <p className="text-[11px] leading-relaxed text-white/50">
            <span className="font-black uppercase tracking-widest text-[#BF5AF2]">Note:</span>{" "}
            All your todos, notes, mind training, and preferences are stored securely under your
            Firebase account and never leave your session.
          </p>
        </motion.div>

        {/* SIGN OUT */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSignOut}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-[2rem] border border-red-500/20 bg-red-500/10 py-5 text-xs font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20"
        >
          <LogOut size={17} /> Sign Out
        </motion.button>
      </main>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-[#D8B4FE]/10 bg-[#1C1726]/60 p-4">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#BF5AF2]">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">{label}</p>
      <p className="truncate text-sm font-bold text-white/85">{value || "—"}</p>
    </div>
  </div>
);

export default AccountPage;