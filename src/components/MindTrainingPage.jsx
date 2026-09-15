import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../Config/firebaseConfig";
import { ref, onValue, set, update, remove } from "firebase/database";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import {
  Brain, Plus, Trash2, Pencil, X, Check, Eye, Calendar, CloudOff, Sparkles
} from "lucide-react";

import Navbar from "./navbar";
import Watermark from "./Watermark";
import DeleteModal from "./Notes/DeleteModal";
import CustomQuestionModal from "./MindTraining/CustomQuestionModal";
import { DEFAULT_QUESTIONS } from "./MindTraining/defaultQuestions";
import { localDateKey, formatDisplayDate } from "./MindTraining/dateUtils";

const MindTrainingPage = ({ user, onSignOut }) => {
  const todayKey = localDateKey();

  const [entries, setEntries] = useState({});
  const [customQuestions, setCustomQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState("");
  const dirtyRef = useRef(false);

  const [historyModalDate, setHistoryModalDate] = useState(null);
  const [customModal, setCustomModal] = useState({ open: false, editingId: null, initialValue: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Data is stored per user in Firebase Realtime Database, mirroring the
  // existing todo/notes convention: users/{userId}/mindTraining/{date}
  useEffect(() => {
    if (!user?.uid) return;
    const unsubEntries = onValue(ref(db, `users/${user.uid}/mindTraining`), (snap) => {
      setEntries(snap.val() || {});
      setLoading(false);
    });
    const unsubQuestions = onValue(ref(db, `users/${user.uid}/mindTrainingQuestions`), (snap) => {
      setCustomQuestions(snap.val() || {});
    });
    return () => {
      unsubEntries();
      unsubQuestions();
    };
  }, [user?.uid]);

  const todayDoc = entries[todayKey] || null;

  // Hydrate today's answers from Firebase once data arrives. While the user
  // is actively editing (dirtyRef), live echoes from Firebase must not
  // clobber what they are typing.
  useEffect(() => {
    if (!todayDoc || dirtyRef.current) return;
    setAnswers(todayDoc.answers || {});
  }, [todayDoc]);

  const questionsForToday = useMemo(() => {
    const customList = Object.entries(customQuestions)
      .filter(([, q]) => q && q.enabled !== false)
      .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0))
      .map(([id, q]) => ({ id, question: q.question, isDefault: false }));
    return [...DEFAULT_QUESTIONS, ...customList];
  }, [customQuestions]);

  const answeredCount = questionsForToday.filter((q) => (answers[q.id]?.answer || "").trim()).length;
  const totalQuestions = questionsForToday.length;
  const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const historyDates = useMemo(
    () => Object.keys(entries).filter((d) => d !== todayKey).sort().reverse(),
    [entries, todayKey]
  );

  const handleAnswerChange = (qId, question, value) => {
    dirtyRef.current = true;
    setAnswers((prev) => ({ ...prev, [qId]: { questionId: qId, question, answer: value } }));
  };

  const handleSave = async () => {
    if (!user?.uid || saveStatus === "saving") return;
    setSaveStatus("saving");
    setSaveError("");
    try {
      const now = Date.now();
      const payload = {};
      questionsForToday.forEach((q) => {
        payload[q.id] = {
          questionId: q.id,
          question: q.question,
          answer: (answers[q.id]?.answer || "").trim(),
        };
      });
      // Merge with anything already stored for today so historical question
      // text is preserved even for questions no longer shown.
      const storedAnswers = { ...(todayDoc?.answers || {}), ...payload };
      await set(ref(db, `users/${user.uid}/mindTraining/${todayKey}`), {
        date: todayKey,
        createdAt: todayDoc?.createdAt || now,
        updatedAt: now,
        answers: storedAnswers,
      });
      setSaveStatus("saved");
      toast.success("Saved successfully");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      console.error("Mind training save error:", err);
      setSaveStatus("error");
      setSaveError("Unable to save your training. Please check your connection and try again.");
      toast.error("Unable to save your training.");
    }
  };

  const handleCustomQuestionSubmit = async (text) => {
    if (!user?.uid) return;
    try {
      const now = Date.now();
      if (customModal.editingId) {
        await update(ref(db, `users/${user.uid}/mindTrainingQuestions/${customModal.editingId}`), {
          question: text,
          updatedAt: now,
        });
        toast.success("Question updated");
      } else {
        await set(ref(db, `users/${user.uid}/mindTrainingQuestions/${now}`), {
          question: text,
          type: "custom",
          enabled: true,
          createdAt: now,
          updatedAt: now,
        });
        toast.success("Question added");
      }
      setCustomModal({ open: false, editingId: null, initialValue: "" });
      dirtyRef.current = true;
    } catch (err) {
      console.error("Mind training question error:", err);
      toast.error("Unable to update questions.");
    }
  };

  const handleToggleQuestion = async (id, enabled) => {
    if (!user?.uid) return;
    try {
      await update(ref(db, `users/${user.uid}/mindTrainingQuestions/${id}`), {
        enabled: !enabled,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error("Mind training question toggle error:", err);
      toast.error("Unable to update question.");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!user?.uid || !deleteTarget) return;
    try {
      await remove(ref(db, `users/${user.uid}/mindTrainingQuestions/${deleteTarget.id}`));
      toast.success("Question deleted");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Mind training question delete error:", err);
      toast.error("Unable to delete question.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050507]">
        <ClipLoader color="#f97316" size={50} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden bg-[#050507] selection:bg-orange-500/30">
      {/* BACKGROUND ORBS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <Navbar user={user} onSignOut={onSignOut} />

      <main className="max-w-2xl mx-auto p-4 relative z-10 pb-40">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-24 text-center"
        >
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/20 mb-6">
            <Brain className="text-white" size={30} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            Mind <span className="text-orange-500">Training</span>
          </h1>
          <p className="mt-4 text-white/40 font-medium max-w-md mx-auto leading-relaxed">
            Train your mind every day. Take a few minutes to reflect, be honest, and improve.
          </p>
        </motion.div>

        {/* TODAY HEADER */}
        <div className="mt-12 mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Today's Training</p>
          <p className="text-xl font-black mt-1">{formatDisplayDate(todayKey)}</p>
        </div>

        {/* PROGRESS */}
        <ProgressCard answered={answeredCount} total={totalQuestions} progress={progress} />

        {/* QUESTION CARDS */}
        <div className="space-y-4">
          {questionsForToday.map((q, idx) => (
            <QuestionCard
              key={q.id}
              index={idx}
              question={q.question}
              value={answers[q.id]?.answer || ""}
              onChange={(value) => handleAnswerChange(q.id, q.question, value)}
            />
          ))}
        </div>

        {/* SAVE */}
        <SaveBar status={saveStatus} error={saveError} onSave={handleSave} />

        {/* CUSTOM QUESTIONS */}
        <CustomQuestionsSection
          customQuestions={customQuestions}
          onAdd={() => setCustomModal({ open: true, editingId: null, initialValue: "" })}
          onEdit={(id, question) => setCustomModal({ open: true, editingId: id, initialValue: question })}
          onToggle={handleToggleQuestion}
          onDelete={(id, question) => setDeleteTarget({ id, question })}
        />

        {/* HISTORY */}
        <HistorySection dates={historyDates} entries={entries} onView={setHistoryModalDate} />
      </main>

      <Watermark />

      {/* MODALS */}
      <AnimatePresence>
        {historyModalDate && entries[historyModalDate] && (
          <HistoryModal
            date={historyModalDate}
            entry={entries[historyModalDate]}
            onClose={() => setHistoryModalDate(null)}
          />
        )}
      </AnimatePresence>

      <CustomQuestionModal
        isOpen={customModal.open}
        initialValue={customModal.initialValue}
        onClose={() => setCustomModal({ open: false, editingId: null, initialValue: "" })}
        onSubmit={handleCustomQuestionSubmit}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.question}
        itemType="Question"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteQuestion}
      />
    </div>
  );
};

// --- REMAINING SUB-COMPONENTS ---

const ProgressCard = ({ answered, total, progress }) => (
  <div className="mb-8 p-6 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem]">
    <div className="flex items-center justify-between mb-3">
      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
        <Sparkles size={12} className="text-orange-400" /> Today's Progress
      </span>
      <span className="text-xs font-black text-orange-400">
        {answered} / {total} answered
      </span>
    </div>
    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
      />
    </div>
    <p className="mt-2 text-right text-[10px] font-black uppercase tracking-widest text-white/20">
      {progress}%
    </p>
  </div>
);

const QuestionCard = ({ index, question, value, onChange }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="p-6 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem]"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 shrink-0 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs font-black">
        {index + 1}
      </div>
      <label className="text-sm font-semibold tracking-tight text-white/80 leading-snug">
        {question}
      </label>
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write a few honest lines..."
      rows={3}
      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 outline-none focus:border-orange-500/40 transition-all text-white placeholder:text-white/20 resize-y min-h-[96px]"
    />
  </motion.div>
);

const SaveBar = ({ status, error, onSave }) => (
  <div className="mt-8">
    <motion.button
      whileTap={{ scale: status === "saving" ? 1 : 0.98 }}
      onClick={onSave}
      disabled={status === "saving"}
      className={`w-full py-5 rounded-[2rem] font-black text-lg tracking-tight flex items-center justify-center gap-3 transition-all shadow-xl ${
        status === "saved"
          ? "bg-green-500 text-black shadow-green-500/20"
          : "bg-orange-600 text-black shadow-orange-600/20 hover:bg-orange-500"
      } ${status === "saving" ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {status === "saving" ? (
        <>
          <ClipLoader size={18} color="#0a0a0a" /> Saving...
        </>
      ) : status === "saved" ? (
        <>
          <Check size={20} /> Saved ✓
        </>
      ) : (
        <>Save Today's Training</>
      )}
    </motion.button>

    <AnimatePresence>
      {status === "saved" && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-3 text-center text-green-400 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
        >
          <Check size={14} /> Saved successfully
        </motion.p>
      )}
      {status === "error" && error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-3 text-center text-red-400 text-xs font-bold flex items-center justify-center gap-2 leading-relaxed"
        >
          <CloudOff size={14} className="shrink-0" /> {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const CustomQuestionsSection = ({ customQuestions, onAdd, onEdit, onToggle, onDelete }) => {
  const list = Object.entries(customQuestions).sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));

  return (
    <div className="mt-16">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-black tracking-tight">Custom Questions</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 bg-orange-500/5 px-5 py-3 rounded-full border border-orange-500/20 active:scale-90 transition-all backdrop-blur-md hover:bg-orange-500/10"
        >
          <Plus size={14} /> Add Custom Question
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-white/20 text-sm italic leading-relaxed">
          No custom questions yet. Add one to make your training truly yours.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map(([id, q]) => (
            <div
              key={id}
              className="p-5 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center gap-4"
            >
              <button
                onClick={() => onToggle(id, Boolean(q.enabled))}
                title={q.enabled ? "Enabled — click to disable" : "Disabled — click to enable"}
                className={`w-12 h-7 rounded-full border transition-all relative shrink-0 ${
                  q.enabled ? "bg-orange-500/30 border-orange-500/50" : "bg-white/5 border-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full transition-all ${
                    q.enabled ? "left-6 bg-orange-500 shadow-[0_0_10px_#f97316]" : "left-1 bg-white/30"
                  }`}
                />
              </button>
              <p
                className={`flex-1 min-w-0 text-sm font-semibold tracking-tight break-words ${
                  q.enabled ? "text-white/80" : "text-white/25 line-through"
                }`}
              >
                {q.question}
              </p>
              <button
                onClick={() => onEdit(id, q.question)}
                className="p-2.5 text-white/30 hover:text-orange-400 transition-colors"
                title="Edit question"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(id, q.question)}
                className="p-2.5 text-white/30 hover:text-red-500 transition-colors"
                title="Delete question"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HistorySection = ({ dates, entries, onView }) => (
  <div className="mt-16">
    <h2 className="text-xl font-black tracking-tight mb-6">Previous Training</h2>
    {dates.length === 0 ? (
      <p className="text-white/20 text-sm italic leading-relaxed">
        No previous entries yet. Your training history will appear here day by day.
      </p>
    ) : (
      <div className="space-y-3">
        {dates.map((d) => {
          const docAnswers = entries[d]?.answers || {};
          const count = Object.values(docAnswers).filter(
            (a) => a && (a.answer || "").trim()
          ).length;
          return (
            <button
              key={d}
              onClick={() => onView(d)}
              className="w-full p-5 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center justify-between gap-4 hover:border-white/20 hover:bg-white/[0.04] transition-all group text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <Calendar size={18} className="shrink-0 text-white/20 group-hover:text-orange-400 transition-colors" />
                <div className="min-w-0">
                  <p className="font-black tracking-tight truncate">{formatDisplayDate(d)}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">
                    {count} question{count === 1 ? "" : "s"} answered
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 shrink-0 text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/5 px-4 py-2 rounded-full border border-orange-500/20">
                <Eye size={12} /> View
              </span>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

const HistoryModal = ({ date, entry, onClose }) => {
  const list = Object.values(entry?.answers || {});

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-[#111]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_32px_64px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-1">
              Training Entry
            </p>
            <h3 className="text-xl font-black tracking-tight text-white">{formatDisplayDate(date)}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {list.length === 0 ? (
          <p className="text-white/30 italic">No answers recorded for this day.</p>
        ) : (
          <div className="space-y-6">
            {list.map((a) => (
              <div key={a.questionId}>
                <p className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-1.5">{a.question}</p>
                <p className="text-white/90 font-medium leading-relaxed whitespace-pre-wrap">
                  {a.answer ? a.answer : <span className="text-white/20 italic">No answer.</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MindTrainingPage;