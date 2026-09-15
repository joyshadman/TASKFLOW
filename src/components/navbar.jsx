import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronDown, Menu, X, Home, Book, Info, Brain } from "lucide-react";

const Navbar = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: <Home size={18} /> },
    { name: "Mind Training", path: "/mind-training", icon: <Brain size={18} /> },
    { name: "Notes", path: "/notes", icon: <Book size={18} /> },
    { name: "About", path: "/About", icon: <Info size={18} /> },
  ];

  const isActive = (path) => location.pathname === path;

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isOpen]);

  return (
    <div className="fixed top-0 left-0 w-full z-[100] px-4 pt-6 flex justify-center pointer-events-none">
      
      {/* --- DESKTOP & MOBILE WRAPPER --- */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto flex items-center justify-between w-full max-w-5xl h-16 pl-6 pr-2 bg-white/[0.02] backdrop-blur-[30px] border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-[101]"
      >
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_15px_#f97316] group-hover:scale-125 transition-transform" />
          <span className="text-sm font-black uppercase tracking-[0.2em] text-white">
            Task<span className="text-orange-500">Flow</span>
          </span>
        </Link>

        {/* DESKTOP LINKS (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="relative px-6 py-2">
              {isActive(item.path) && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white/10 rounded-full border border-white/10 shadow-inner"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className={`relative z-10 text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${
                isActive(item.path) ? "text-white" : "text-white/40 hover:text-white"
              }`}>
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* RIGHT SECTION: USER & MOBILE TOGGLE */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 bg-white/5 rounded-full border border-white/10 pr-4 transition-all hover:bg-white/10"
              >
                <div className="relative w-8 h-8">
                  <img 
                    src={user.photoURL} 
                    alt="user" 
                    className="w-full h-full rounded-full object-cover border border-white/20" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                </div>
                <ChevronDown size={14} className={`text-white/30 transition-transform duration-500 ${showProfileMenu ? "rotate-180" : ""}`} />
              </motion.button>

              {/* DROPDOWN MENU */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-56 bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 shadow-2xl overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-white/5 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">Signed In As</p>
                      <p className="text-[12px] text-white/60 truncate font-medium">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { onSignOut(); setShowProfileMenu(false); }}
                      className="w-full flex items-center justify-between px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group"
                    >
                      <span className="text-xs font-black uppercase tracking-widest">Logout</span>
                      <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* MOBILE MENU TOGGLE */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden w-11 h-11 flex items-center justify-center text-white bg-white/5 rounded-full border border-white/10"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </motion.nav>

      {/* --- MOBILE FULLSCREEN MENU --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Blurry Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99] pointer-events-auto"
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-28 left-4 right-4 bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] p-4 flex flex-col gap-2 z-[100] pointer-events-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              {navItems.map((item, idx) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="relative overflow-hidden"
                >
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-center justify-between p-5 rounded-3xl transition-all ${
                      isActive(item.path) ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20" : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {item.icon}
                      <span className="text-lg font-black uppercase tracking-tighter">{item.name}</span>
                    </div>
                    {isActive(item.path) && <div className="w-2 h-2 bg-black rounded-full" />}
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;