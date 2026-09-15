// src/components/LoginPage.jsx
import React from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { app, db } from "../Config/firebaseConfig.js";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Watermark from "./Watermark.jsx";

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);
      const result = await signInWithPopup(augth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date(),
        });
      }

      setUser(user);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050507] flex items-center justify-center p-6 overflow-hidden">
      
      {/* --- DYNAMIC GLASSY BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Animated Top Orb */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, 50, 0] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full"
        />
        {/* Animated Bottom Orb */}
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -30, 0] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-5%] right-[5%] w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full"
        />
        {/* Subtle Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050507]/20 to-[#050507]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* --- THE GLASS CARD --- */}
        <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[3rem] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
          
          {/* Internal Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="relative z-10 text-center">
            {/* Logo Section */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-orange-500/20">
                <Shield className="text-white" size={32} />
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white mb-2">
                Task <span className="text-orange-500">Flow</span>
              </h1>
              <p className="text-white/40 font-medium tracking-tight">The future of productivity.</p>
            </motion.div>

            {/* Security Features Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-3 mb-10"
            >
              {[
                { icon: <Lock size={12}/>, label: "Encrypted" },
                { icon: <Mail size={12}/>, label: "Verified" }
              ].map((badge, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/50">
                  {badge.icon} {badge.label}
                </span>
              ))}
            </motion.div>

            {/* Google Button */}
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={signInWithGoogle}
              className="w-full group/btn flex items-center justify-between gap-3 cursor-pointer py-5 px-6 text-black font-bold rounded-[1.5rem] bg-white transition-all shadow-xl hover:shadow-white/10"
            >
              <div className="flex items-center gap-3">
                <img
                  className="w-6 h-6"
                  src="https://www.svgrepo.com/show/355037/google.svg"
                  alt="Google"
                />
                <span className="text-lg">Continue with Google</span>
              </div>
              <ChevronRight size={20} className="opacity-30 group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>

            {/* Secondary Options */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.6 }}
               className="mt-10"
            >
              <p className="text-sm text-white/20 font-medium mb-6">More login methods coming soon</p>
              
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

              <div className="text-[11px] leading-relaxed text-white/30 px-4">
                By entering, you agree to our{" "}
                <Link to="/terms" className="text-orange-500 font-bold hover:text-orange-400 transition-colors">
                  Terms of Service
                </Link>{" "}
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- SUBTLE BOTTOM SHADOW/GLOW --- */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-orange-500/20 blur-2xl rounded-full" />
      </motion.div>
      
      <Watermark />
    </div>
  );
};

export default LoginPage;