// src/components/Termsploicy.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Eye, ArrowLeft, Terminal } from "lucide-react";

const TermsPolicyPage = () => {
    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen bg-[#0E0C13] text-white selection:bg-[#BF5AF2]/30 p-4 md:p-12 flex justify-center items-center relative overflow-hidden">
            
            {/* --- Dynamic Background Orbs --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#BF5AF2]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#BF5AF2]/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl bg-[#1C1726]/60 backdrop-blur-[50px] rounded-[3rem] p-8 md:p-16 shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-[#D8B4FE]/15 relative z-10 overflow-hidden"
            >
                {/* Decorative Internal Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#BF5AF2]/5 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <motion.div 
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#BF5AF2]/10 border border-[#BF5AF2]/20 text-[#BF5AF2] text-[10px] font-black uppercase tracking-[0.2em] mb-6"
                        >
                            <ShieldCheck size={14} /> Legal Documentation
                        </motion.div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">
                            Terms & <span className="text-[#BF5AF2]">Privacy.</span>
                        </h1>
                        <p className="text-white/30 text-sm font-medium">
                            Last Revised: February {new Date().getFullYear()}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        
                        {/* --- Terms of Use --- */}
                        <motion.section 
                            variants={sectionVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-white/5 rounded-xl border border-[#D8B4FE]/15 text-[#BF5AF2]">
                                    <Terminal size={20} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">Terms of Use</h2>
                            </div>
                            <p className="text-white/50 leading-relaxed mb-6 text-sm">
                                By accessing TaskFlow, you enter a legal agreement to operate within our ecosystem's defined boundaries.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Minimum age requirement: 13 years.",
                                    "User assumes full responsibility for credential security.",
                                    "Prohibition of unauthorized API access or reverse engineering.",
                                    "Right to modify service architecture without prior notice."
                                ].map((item, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm text-white/70">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#BF5AF2] shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.section>

                        {/* --- Privacy Policy --- */}
                        <motion.section 
                            variants={sectionVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-white/5 rounded-xl border border-[#D8B4FE]/15 text-[#A78BFA]">
                                    <Lock size={20} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">Data Privacy</h2>
                            </div>
                            <p className="text-white/50 leading-relaxed mb-6 text-sm">
                                We utilize high-level encryption to ensure your personal data remains strictly under your control.
                            </p>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                                        <Eye size={12} /> Collected Points
                                    </h3>
                                    <p className="text-xs text-white/60 leading-relaxed">
                                        Google Identity (Name, Email, Avatar), Cloud-synced tasks, and localized preference metadata.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                                        <ShieldCheck size={12} /> Our Promise
                                    </h3>
                                    <p className="text-xs text-white/60 leading-relaxed">
                                        Zero data trading. Zero third-party tracking. All tasks are encrypted via Firebase Security Rules.
                                    </p>
                                </div>
                            </div>
                        </motion.section>
                    </div>

                    {/* --- Footer Action --- */}
                    <div className="mt-16 pt-10 border-t border-[#D8B4FE]/10 flex flex-col items-center gap-8">
                        <p className="text-white/20 text-[11px] max-w-md text-center leading-relaxed">
                            Questions regarding these policies can be directed to the developer via the official connect channels found on the About page.
                        </p>
                        
                        <Link to="/">
                            <motion.button 
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,1)" }}
                                whileTap={{ scale: 0.95 }}
                                className="group flex items-center gap-3 px-10 py-4 bg-white text-black font-black rounded-full transition-all shadow-xl hover:shadow-white/10"
                            >
                                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                RETURN HOME
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TermsPolicyPage;