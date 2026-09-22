// src/components/Dock.jsx
// Primary navigation — a React Bits-style Dock rendered globally from App.jsx.
//
// Why this version does not shiver/jitter:
//   - Icon centers are pre-measured once (on mount / resize / item count
//     change) and stored in a ref. The magnification transform NEVER reads
//     layout during pointer movement, so there is no feedback loop between
//     the animated scale and the distance calculation.
//   - Magnification uses `scale` only (transform, GPU-composited). Icons live
//     in fixed-size slots, so hover never triggers layout reflow or pushes
//     neighboring items.
//   - Pointer movement only writes a framer-motion value (no React renders).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import {
  LayoutDashboard,
  Brain,
  Book,
  Info,
  CircleUser,
  LogIn,
  LogOut,
} from "lucide-react";
import LoginModal from "./LoginModal";
import { throttle } from "../utils/performance";

const DOCK_ICON_BASE = 44; // px plate, scaled for magnification

const Dock = ({ user, onSignOut }) => {
  const location = useLocation();
  const mouseX = useMotionValue(Infinity);
  const centersRef = useRef({});
  const navRef = useRef(null);
  const reduce = useReducedMotion();
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  const navItems = useMemo(
    () => [
      { key: "dashboard", label: "Dashboard", path: "/", icon: LayoutDashboard },
      { key: "mind-training", label: "Mind Training", path: "/mind-training", icon: Brain },
      { key: "notes", label: "Notes", path: "/notes", icon: Book },
      { key: "about", label: "About", path: "/about", icon: Info },
      ...(user
        ? [{ key: "account", label: "Account", path: "/account", icon: CircleUser }]
        : []),
    ],
    [user]
  );

  // Measure slot centers ONCE after mount, on resize, and when the item set
  // changes. Static centers keep the per-frame transform cheap and stable.
  useEffect(() => {
    if (reduce) return;
    const measure = () => {
      centersRef.current = {};
      navRef.current?.querySelectorAll("[data-dock-item]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        centersRef.current[el.dataset.dockItem] = rect.left + rect.width / 2;
      });
    };
    measure();
    const onResize = throttle(measure, 150);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [navItems, reduce]);

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    setProfileOpen(false);
    await onSignOut?.();
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[500] flex justify-center px-4">
        <motion.nav
          ref={navRef}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="pointer-events-auto flex items-end gap-1 rounded-[2rem] border border-[#D8B4FE]/15 bg-[#1C1726]/70 px-2 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-[24px]"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => (
            <DockIcon
              key={item.key}
              mouseX={mouseX}
              centersRef={centersRef}
              centerKey={item.key}
              to={item.path}
              tooltip={item.label}
              active={isActive(item.path)}
            >
              <item.icon size={20} strokeWidth={2} />
            </DockIcon>
          ))}

          <div className="mx-1 h-8 w-px shrink-0 bg-[#D8B4FE]/10" />

          {user ? (
            <>
              <DockIcon
                mouseX={mouseX}
                centersRef={centersRef}
                centerKey="account"
                tooltip="Account"
                circle
                onClick={() => setProfileOpen((v) => !v)}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="user"
                    referrerPolicy="no-referrer"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <CircleUser size={20} />
                )}
              </DockIcon>
            </>
          ) : (
            <DockIcon
              mouseX={mouseX}
              centersRef={centersRef}
              centerKey="login"
              tooltip="Log in"
              accent
              onClick={() => setLoginOpen(true)}
            >
              <LogIn size={20} />
            </DockIcon>
          )}
        </motion.nav>

        {/* Account popover (anchored above the dock, below modals) */}
        <AnimatePresence>
          {profileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-[490]"
              />
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="fixed bottom-28 left-1/2 z-[600] w-80 -translate-x-1/2 overflow-hidden rounded-[2rem] border border-[#D8B4FE]/15 bg-[#1C1726]/90 p-2 shadow-2xl backdrop-blur-[28px]"
              >
                <div className="px-5 py-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#BF5AF2]">
                    Signed In As
                  </p>
                  <p className="truncate text-[12px] font-medium text-white/70">
                    {user.displayName || user.email}
                  </p>
                  <p className="truncate text-[10px] text-white/35">{user.email}</p>
                </div>
                <Link
                  to="/account"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-xs font-black uppercase tracking-widest text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Account Settings <CircleUser size={15} />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left text-xs font-black uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Logout <LogOut size={15} />
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};

// --- Magnifying Dock Icon ---
// Magnification is a pure `scale` spring driven by the pointer distance from
// this icon's *fixed* slot center. No layout reads, no width animation, no
// sibling reflow — the icon just scales in place.
const DockIcon = ({
  mouseX,
  centersRef,
  centerKey,
  to,
  tooltip,
  active,
  circle,
  accent,
  onClick,
  children,
}) => {
  const reduce = useReducedMotion();

  const distance = useTransform(mouseX, (val) => {
    const center = centersRef.current?.[centerKey];
    return center == null ? Number.MAX_SAFE_INTEGER : val - center;
  });

  const scaleSync = useTransform(
    distance,
    [-60, 0, 60],
    [1, reduce ? 1 : 1.5, 1],
    { clamp: true }
  );
  const scale = useSpring(scaleSync, {
    stiffness: reduce ? 500 : 340,
    damping: reduce ? 40 : 26,
    mass: 0.4,
    restDelta: 0.001,
  });
  const y = useTransform(scale, (s) => (reduce ? 0 : -(s - 1) * 10));

  const inner = (
    <span
      className={`flex h-full w-full items-center justify-center border-transparent transition-colors duration-200 ${
        circle ? "rounded-full" : "rounded-2xl"
      } ${
        accent
          ? "bg-[#BF5AF2]/20 border-[#BF5AF2]/40 text-[#BF5AF2] shadow-[0_0_20px_rgba(191,90,242,0.25)] hover:bg-[#BF5AF2] hover:text-[#0E0C13]"
          : active
          ? "bg-[#BF5AF2] text-[#0E0C13] shadow-[0_0_20px_rgba(191,90,242,0.4)]"
          : "bg-white/[0.04] border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </span>
  );

  const innerEl = to ? (
    <Link
      to={to}
      aria-label={tooltip}
      aria-current={active ? "page" : undefined}
      className="block h-full w-full cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#BF5AF2]/60"
    >
      {inner}
    </Link>
  ) : (
    <button
      onClick={onClick}
      aria-label={tooltip}
      className="block h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#BF5AF2]/60 rounded-2xl"
    >
      {inner}
    </button>
  );

  return (
    <div
      data-dock-item={centerKey}
      className="group relative flex h-[52px] w-[50px] shrink-0 items-center justify-center"
    >
      <motion.div
        style={{ scale, y, transformOrigin: "center bottom" }}
        className="will-change-transform"
      >
        <div
          className={`flex items-center justify-center ${circle ? "p-0" : "p-1"} ${
            reduce ? "" : "group-hover:z-10"
          }`}
          style={{ width: DOCK_ICON_BASE, height: DOCK_ICON_BASE }}
        >
          {innerEl}
        </div>
      </motion.div>

      {/* Tooltip */}
      <span
        className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#D8B4FE]/15 bg-[#0E0C13]/90 px-3 py-1 text-[9px] font-black uppercase tracking-widest opacity-0 backdrop-blur-xl transition-opacity duration-200 group-hover:opacity-100 ${
          active || accent ? "text-[#BF5AF2]" : "text-white/90"
        }`}
      >
        {tooltip}
      </span>

      {/* Active dot */}
      {active && (
        <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#BF5AF2] shadow-[0_0_8px_#BF5AF2]" />
      )}
    </div>
  );
};

export default Dock;