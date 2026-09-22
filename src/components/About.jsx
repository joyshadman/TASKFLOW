// src/components/About.jsx
// Product-focused About page. No personal author branding or social links —
// it describes TaskFlow, its features, and its privacy stance.
import React from "react";
import { FiLayers, FiZap, FiShield, FiCloud } from "react-icons/fi";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ABOUT_FEATURES = [
  {
    icon: FiLayers,
    color: "text-[#BF5AF2]",
    title: "Everything in One Place",
    body: "Todos with timers, rich-text notes, daily mind training, weather, and daily motivation — a single workspace for a focused day.",
  },
  {
    icon: FiShield,
    color: "text-[#A78BFA]",
    title: "Your Data, Yours Only",
    body: "Google sign-in scopes every record to your account. Nothing is shared, exported, or visible to anyone but you.",
  },
  {
    icon: FiZap,
    color: "text-[#BF5AF2]",
    title: "Fast & Fluid",
    body: "Optimistic updates, debounced saving, and spring physics keep every interaction instant — no typing lag, no jank.",
  },
  {
    icon: FiCloud,
    color: "text-[#A78BFA]",
    title: "Cloud Persistence",
    body: "Your notes, todos, and reflections sync in real time through Firebase, so you can close the tab and pick up where you left off.",
  },
];

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0E0C13] text-[#F5F3FF] selection:bg-[#BF5AF2]/30">
      {/* Dynamic Background Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-10%] top-[-10%] h-[55%] w-[55%] rounded-full bg-[#BF5AF2]/8 blur-[140px]" />
        <div className="absolute inset-x-0 top-1/2 mx-auto h-[350px] w-[700px] rounded-full bg-[#7C4DFF]/8 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[#BF5AF2]/8 blur-[140px]" />
      </div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-16"
      >
        {/* Hero */}
        <motion.section variants={itemVariants} className="mb-20 text-center">
          <h1 className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-6xl font-black tracking-tighter text-transparent md:text-8xl">
            Task<span className="text-[#BF5AF2]">Flow.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-white/50 md:text-xl">
            A focused, glassy workspace that unifies your tasks, notes, and
            daily rituals — built for clarity, speed, and calm.
          </p>
        </motion.section>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {ABOUT_FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="rounded-[2.5rem] border border-[#D8B4FE]/15 bg-[#1C1726]/60 p-10 backdrop-blur-xl"
            >
              <feature.icon className={`${feature.color} mb-6`} size={28} />
              <h3 className="mb-3 text-2xl font-bold tracking-tight text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{feature.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Tech stack strip */}
        <motion.section variants={itemVariants} className="mt-14">
          <div className="rounded-[2.5rem] border border-[#D8B4FE]/15 bg-[#1C1726]/60 p-10 backdrop-blur-xl">
            <h3 className="mb-6 text-2xl font-bold tracking-tight">Built With</h3>
            <div className="flex flex-wrap gap-3">
              {[
                "React 19",
                "Vite",
                "Tailwind CSS",
                "Firebase (Auth, Firestore)",
                "Firebase Realtime Database",
                "Framer Motion",
              ].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[#D8B4FE]/15 bg-white/5 px-4 py-2 text-sm font-bold text-white/70"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.section variants={itemVariants} className="mt-14 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/25">
            &copy; {new Date().getFullYear()} TaskFlow &bull;
            <Link to="/terms" className="ml-2 text-[#BF5AF2] transition-colors hover:text-[#BF5AF2]">
              Terms & Privacy
            </Link>
          </p>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default About;