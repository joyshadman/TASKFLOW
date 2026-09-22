// src/components/Btn.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { db } from "../Config/firebaseConfig";
import { ref, set, onValue, remove, update, get } from "firebase/database";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import { 
  FiTrash2, FiEdit3, FiClock, FiXCircle, FiPlus, FiRepeat, 
  FiActivity, FiAward, FiZap, FiTarget, FiVolumeX, 
  FiSun, FiCloud, FiCloudRain, FiCloudSnow, FiWind, FiMapPin, FiSearch
} from "react-icons/fi";
import { Quote } from "lucide-react"; 

import ambSound from "../assets/amb.mp3";
import clickSoundFile from "../assets/click.mp3";
import errorSoundFile from "../assets/error.mp3";

const CATEGORIES = {
  Work: "text-[#A78BFA] bg-blue-400/10 border-[#A78BFA]/20 shadow-[0_0_15px_-5px_rgba(96,165,250,0.3)]",
  Personal: "text-purple-400 bg-purple-400/10 border-purple-400/20 shadow-[0_0_15px_-5px_rgba(192,132,252,0.3)]",
  Urgent: "text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_15px_-5px_rgba(248,113,113,0.4)]",
  General: "text-gray-400 bg-gray-400/10 border-gray-400/20 shadow-none"
};

const Btn = ({ user }) => {
  const [toDo, setToDo] = useState("");
  const [category, setCategory] = useState("General");
  const [todoList, setTodoList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(null);
  const [timerModal, setTimerModal] = useState({ open: false, id: null, input: "" });
  const [remaining, setRemaining] = useState({});
  const [isSorting, setIsSorting] = useState(false);
  const [ringingId, setRingingId] = useState(null);
  const todoListRef = useRef([]);
  const ringingRef = useRef(null);
  // If a timer is already expired when we first observe it after mounting Home,
  // we mute it for that specific timerEnd value to avoid "random" buzzes on navigation.
  const mutedOverdueTimerEndsRef = useRef({});
  const lastSeenTimerEndRef = useRef({});
  const hasRungTimerEndRef = useRef({});
  
  // Motivation & Weather State
  const [quote, setQuote] = useState({ text: "Success is not final...", author: "Winston Churchill" });
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const alarmRef = useRef(null);
  const clickRef = useRef(null);
  const errorRef = useRef(null);
  const refs = useMemo(() => ({ alarm: alarmRef, click: clickRef, error: errorRef }), []);

  const playSound = useCallback(
    (type) => {
      const s = refs[type].current;
      if (s) { s.pause(); s.currentTime = 0; s.play().catch(() => {}); }
    },
    [refs]
  );

  const stopSound = useCallback(
    (type) => {
      const s = refs[type].current;
      if (s) { s.pause(); s.currentTime = 0; }
    },
    [refs]
  );

  const userPath = useMemo(() => user?.uid ? `users/${user.uid}/todos` : null, [user?.uid]);
  const locationPath = useMemo(() => user?.uid ? `users/${user.uid}/location` : null, [user?.uid]);

  // --- CORE WEATHER LOGIC ---
  const fetchWeather = useCallback(
    async (lat, lon, cityLabel = "Current", shouldSave = true) => {
      setWeatherLoading(true);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        setWeather({ ...data.current_weather, city: cityLabel });

        // Save to Firebase so it persists across sessions
        if (shouldSave && locationPath) {
          set(ref(db, locationPath), { lat, lon, cityLabel });
        }
      } catch {
        console.log("Weather error");
      } finally {
        setWeatherLoading(false);
      }
    },
    [locationPath]
  );

  // Initial Location Setup: Priority: Firebase > Geolocation > Fallback
  useEffect(() => {
    const initLocation = async () => {
      if (!locationPath) return;

      const snapshot = await get(ref(db, locationPath));
      if (snapshot.exists()) {
        const data = snapshot.val();
        fetchWeather(data.lat, data.lon, data.cityLabel, false);
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, "Local"),
          () => fetchWeather(40.7128, -74.0060, "New York")
        );
      }
    };
    initLocation();
  }, [locationPath, fetchWeather]);

  // Fetch Motivation
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://zenquotes.io/api/random"));
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.contents);
          setQuote({ text: parsed[0].q, author: parsed[0].a });
        }
      } catch {
        console.log("Quote fallback used");
      }
    };
    fetchQuote();
  }, []);

  // Sync Todo List
  useEffect(() => {
    if (!userPath) return;
    const itemsRef = ref(db, userPath);
    return onValue(itemsRef, (snap) => {
      const data = snap.val() || {};
      setTodoList(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      setLoading(false);
    });
  }, [userPath]);

  // Keep the latest todo list in a ref so the ticker interval doesn't need
  // to be recreated whenever React state updates.
  useEffect(() => {
    todoListRef.current = todoList;
  }, [todoList]);

  // Timer Ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      const now = Date.now();
      const list = todoListRef.current || [];
      const updatedRemaining = {};

      // Only ring a single timer at a time.
      let alarmToRing = null;

      for (const item of list) {
        if (!item.timerEnd) continue;

        const diff = Math.max(0, Math.floor((item.timerEnd - now) / 1000));
        updatedRemaining[item.id] = diff;

        // If timerEnd changed since we last observed it for this id,
        // reset internal state for the new timer.
        const lastSeenTimerEnd = lastSeenTimerEndRef.current[item.id];
        if (lastSeenTimerEnd !== item.timerEnd) {
          lastSeenTimerEndRef.current[item.id] = item.timerEnd;
          hasRungTimerEndRef.current[item.id] = null;
          // Mute if it's already expired at the moment we first observe it after mounting.
          mutedOverdueTimerEndsRef.current[item.id] = diff <= 0 ? item.timerEnd : null;
        }

        const isDue = diff <= 0;
        const isMuted = mutedOverdueTimerEndsRef.current[item.id] === item.timerEnd;
        const hasAlreadyRung = hasRungTimerEndRef.current[item.id] === item.timerEnd;

        if (isDue && !item.completed && ringingRef.current == null && !isMuted && !hasAlreadyRung) {
          alarmToRing = item;
          hasRungTimerEndRef.current[item.id] = item.timerEnd;
          ringingRef.current = item.id;
          break;
        }
      }

      setRemaining(updatedRemaining);
      if (alarmToRing) {
        setRingingId(alarmToRing.id);
        playSound("alarm");
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, [playSound]);

  const sortedList = useMemo(() => {
    return [...todoList].sort((a, b) => {
      const aRem = remaining[a.id] || 0;
      const bRem = remaining[b.id] || 0;
      if (aRem > 0 && bRem <= 0) return -1;
      if (bRem > 0 && aRem <= 0) return 1;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const aUrgent = a.category === "Urgent" ? 1 : 0;
      const bUrgent = b.category === "Urgent" ? 1 : 0;
      if (aUrgent !== bUrgent) return bUrgent - aUrgent;
      return b.createdAt - a.createdAt;
    });
  }, [todoList, remaining]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toDo.trim() || !userPath) return playSound("error");
    try {
      const now = Date.now();
      if (editId) {
        await update(ref(db, `${userPath}/${editId}`), { TodoName: toDo, category });
        setEditId(null);
      } else {
        await set(ref(db, `${userPath}/${now}`), { 
          TodoName: toDo, category, completed: false, createdAt: now, timerEnd: null 
        });
      }
      setToDo("");
    } catch {
      playSound("error");
    }
  };

  const handleStopAlarm = async (id) => {
    // Stop immediately to avoid "re-trigger" on the next ticker tick.
    stopSound("alarm");
    ringingRef.current = null;
    setRingingId(null);
    playSound("click");

    if (id) {
      const stoppedTimerEnd = lastSeenTimerEndRef.current[id];
      if (stoppedTimerEnd != null) {
        // Prevent re-trigger if Firebase (or local state reconciliation) lags,
        // even for the brief window before `timerEnd: null` propagates.
        mutedOverdueTimerEndsRef.current[id] = stoppedTimerEnd;
        hasRungTimerEndRef.current[id] = stoppedTimerEnd;
      }

      // Optimistically clear timerEnd locally so the interval can't re-trigger
      // before Firebase finishes the update.
      setTodoList((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, timerEnd: null } : t));
        todoListRef.current = next;
        return next;
      });
    }

    if (id && userPath) {
      await update(ref(db, `${userPath}/${id}`), { timerEnd: null });
    }
  };

  const handleToggleOngoing = (item) => {
    if (!userPath) return;
    playSound("click");
    const next = !item.ongoing;
    // Optimistic local update so the UI reflects the change instantly.
    setTodoList((prev) => prev.map((t) => (t.id === item.id ? { ...t, ongoing: next } : t)));
    // Persist immediately to Firebase Realtime Database.
    update(ref(db, `${userPath}/${item.id}`), { ongoing: next });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0E0C13]"><ClipLoader color="#BF5AF2" size={50} /></div>;

  const stats = {
    total: todoList.length,
    completed: todoList.filter(t => t.completed).length,
    percent: todoList.length === 0 ? 0 : Math.round((todoList.filter(t => t.completed).length / todoList.length) * 100)
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden bg-[#0E0C13]">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#BF5AF2]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#BF5AF2]/10 blur-[120px]" />
      </div>

      <main className="max-w-2xl mx-auto p-4 relative z-10 pb-32">
        <AnimatePresence>
          {focusMode && (
            <FocusOverlay 
              item={todoList.find(t => t.id === focusMode)} 
              remaining={remaining[focusMode] || 0} 
              setFocusMode={setFocusMode} 
              stopAlarm={() => handleStopAlarm(focusMode)} 
              isRinging={ringingId === focusMode}
            />
          )}
        </AnimatePresence>

        {!focusMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-8 bg-[#1C1726]/60 border border-[#D8B4FE]/10 rounded-[2.5rem] backdrop-blur-3xl text-center relative group">
              <Quote className="absolute top-4 left-4 text-[#BF5AF2]/20 group-hover:text-[#BF5AF2]/40 transition-colors" size={32} />
              <p className="text-lg font-medium italic text-white/80 leading-relaxed mb-4">"{quote.text}"</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#BF5AF2]">— {quote.author}</p>
            </motion.div>

            <WeatherCard weather={weather} loading={weatherLoading} onManualSearch={fetchWeather} />

            <div className="mt-12 flex flex-col items-center">
              <ProgressRing percent={stats.percent} />
            </div>
            
            <motion.form layout className="mt-12 mb-6 p-2 bg-[#1C1726]/60 backdrop-blur-2xl border border-[#D8B4FE]/15 rounded-[2.5rem] shadow-2xl" onSubmit={handleSubmit}>
              <div className="flex items-center gap-2 p-1">
                <input value={toDo} onChange={(e) => setToDo(e.target.value)} placeholder="What's the mission?" className="flex-1 bg-transparent p-4 outline-none text-lg font-medium" />
                <button type="submit" className="w-12 h-12 flex items-center justify-center bg-[#BF5AF2] rounded-full text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#BF5AF2]/20"><FiPlus size={24} /></button>
              </div>
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                {Object.keys(CATEGORIES).map(cat => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${category === cat ? "bg-white/10 text-white border-[#D8B4FE]/25" : "border-transparent text-gray-500"}`}>{cat}</button>
                ))}
              </div>
            </motion.form>

            <div className="flex justify-end mb-4 pr-2">
              <button onClick={() => { setIsSorting(true); playSound("click"); setTimeout(() => setIsSorting(false), 1000); }} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#BF5AF2] bg-[#BF5AF2]/5 px-5 py-2.5 rounded-full border border-[#BF5AF2]/20 active:scale-90 transition-all backdrop-blur-md">
                <FiZap className={isSorting ? "animate-spin" : ""} /> Magic Sort
              </button>
            </div>

            <div className="space-y-4 mb-16">
              <AnimatePresence mode="popLayout">
                {sortedList.map((item) => (
                  <SwipeableTask key={item.id} item={item} userPath={userPath} remaining={remaining[item.id] || 0} setTimerModal={setTimerModal} setToDo={setToDo} setEditId={setEditId} setCategory={setCategory} setFocusMode={setFocusMode} playSound={playSound} onToggleOngoing={handleToggleOngoing} />
                ))}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <BentoCard icon={<FiTarget />} label="Accuracy" val={stats.percent + "%"} color="text-[#BF5AF2]" />
              <BentoCard icon={<FiActivity />} label="Status" val="Secure" color="text-[#A78BFA]" />
              <div className="col-span-2 p-6 bg-[#1C1726]/60 backdrop-blur-3xl border border-[#D8B4FE]/15 rounded-[2rem] flex flex-col justify-between">
                <FiAward className="text-purple-400" size={20} />
                <p className="text-xs text-white/40 mt-4 font-medium leading-relaxed">End-to-End Security: <span className="text-white">Active</span>. Data is locked to your UID.</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Timer Modal */}
      <AnimatePresence>
        {timerModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/60">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-[#1C1726]/60 backdrop-blur-3xl border border-[#D8B4FE]/15 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Set Timer</h3>
                <button onClick={() => setTimerModal({ open: false })} className="p-2 text-white/30 hover:text-white transition-colors"><FiXCircle size={28}/></button>
              </div>
              <input type="number" placeholder="00" className="w-full bg-white/5 border border-[#D8B4FE]/15 rounded-[2rem] p-8 mb-8 text-center text-6xl font-black outline-none focus:border-[#BF5AF2]/50" onChange={(e) => setTimerModal({...timerModal, input: e.target.value})} autoFocus />
              <button onClick={async () => {
                const mins = parseInt(timerModal.input);
                if (mins && userPath) {
                  await update(ref(db, `${userPath}/${timerModal.id}`), { timerEnd: Date.now() + mins * 60000 });
                  setTimerModal({ open: false, id: null, input: "" });
                }
              }} className="w-full py-5 bg-[#BF5AF2] rounded-[1.5rem] font-black text-black text-lg shadow-lg shadow-[#BF5AF2]/20">SET MISSION TIMER</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={refs.alarm} src={ambSound} loop />
      <audio ref={refs.click} src={clickSoundFile} />
      <audio ref={refs.error} src={errorSoundFile} />
    </div>
  );
};

// --- WEATHER UI COMPONENT ---
const WeatherCard = ({ weather, loading, onManualSearch }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [cityInput, setCityInput] = useState("");

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        onManualSearch(data[0].lat, data[0].lon, data[0].display_name.split(',')[0], true);
        setIsSearching(false);
        setCityInput("");
      } else {
        toast.error("City not found");
      }
    } catch {
      toast.error("Search failed");
    }
  };

  const getWeatherIcon = (code) => {
    if (code <= 3) return <FiSun className="text-yellow-400" />;
    if (code <= 48) return <FiCloud className="text-gray-400" />;
    if (code <= 67) return <FiCloudRain className="text-[#A78BFA]" />;
    if (code <= 77) return <FiCloudSnow className="text-white" />;
    return <FiWind className="text-gray-300" />;
  };

  return (
    <div className="mt-6 flex flex-col items-center h-16">
      <AnimatePresence mode="wait">
        {!isSearching ? (
          <motion.div 
            key="display" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setIsSearching(true)}
            className="flex items-center justify-center gap-6 py-4 bg-[#1C1726]/60 border border-[#D8B4FE]/10 rounded-[2rem] backdrop-blur-xl group hover:border-[#BF5AF2]/30 transition-all cursor-pointer px-8 w-fit"
          >
            {loading ? <ClipLoader size={14} color="#BF5AF2" /> : (
              <>
                <div className="text-2xl">{getWeatherIcon(weather?.weathercode)}</div>
                <div className="flex flex-col items-start">
                  <span className="text-xl font-black">{Math.round(weather?.temperature || 0)}°C</span>
                  <span className="text-[8px] font-black uppercase text-[#BF5AF2] tracking-widest">{weather?.city || "Environment"}</span>
                </div>
                <div className="h-6 w-[1px] bg-white/10" />
                <div className="flex flex-col items-start pr-2">
                  <span className="text-sm font-bold">{weather?.windspeed || 0} <span className="text-[10px] opacity-40">km/h</span></span>
                  <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">Wind</span>
                </div>
                <FiMapPin className="text-white/10 group-hover:text-[#BF5AF2] transition-colors" size={14} />
              </>
            )}
          </motion.div>
        ) : (
          <motion.form 
            key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            onSubmit={handleManualSearch}
            className="flex items-center gap-2 bg-[#1C1726]/60 p-2 rounded-full border border-[#D8B4FE]/15 backdrop-blur-3xl"
          >
            <input autoFocus value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="Search city..." className="bg-transparent px-4 py-2 outline-none text-sm font-bold w-36" />
            <button type="submit" className="p-2 bg-[#BF5AF2] text-black rounded-full hover:scale-105 active:scale-95 transition-all"><FiSearch size={16} /></button>
            <button type="button" onClick={() => setIsSearching(false)} className="p-2 text-white/30 hover:text-white"><FiXCircle size={16} /></button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- REMAINING SUB-COMPONENTS ---
const ProgressRing = ({ percent = 0 }) => {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
        <motion.circle cx="64" cy="64" r={radius} stroke="#BF5AF2" strokeWidth="4" fill="transparent" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference - (circumference * percent) / 100 }} transition={{ duration: 1.5, ease: "circOut" }} />
      </svg>
      <div className="text-center">
        <span className="text-2xl font-black block">{percent}%</span>
        <span className="text-[8px] uppercase text-white/30 tracking-widest font-black">Mission Complete</span>
      </div>
    </div>
  );
};

const BentoCard = ({ icon, label, val, color }) => (
  <div className="p-6 bg-[#1C1726]/60 backdrop-blur-3xl border border-[#D8B4FE]/15 rounded-[2rem] flex flex-col items-center justify-center text-center">
    <div className={`${color} text-xl mb-2`}>{icon}</div>
    <div className="text-lg font-black">{val}</div>
    <div className="text-[9px] font-black uppercase text-white/20 tracking-widest">{label}</div>
  </div>
);

const SwipeableTask = ({ item, userPath, remaining, setToDo, setEditId, setCategory, setTimerModal, setFocusMode, playSound, onToggleOngoing }) => (
  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
    <div className={`p-5 bg-[#1C1726]/60 backdrop-blur-3xl border rounded-[2.2rem] flex items-center gap-4 transition-all duration-500 ${CATEGORIES[item.category || "General"]} ${item.completed ? "opacity-20 grayscale border-transparent" : "border-[#D8B4FE]/15 shadow-xl"}`}>
      <input type="checkbox" checked={item.completed} onChange={() => { playSound("click"); update(ref(db, `${userPath}/${item.id}`), { completed: !item.completed }); }} className="w-6 h-6 rounded-full accent-[#BF5AF2] cursor-pointer" />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { if (remaining > 0) setFocusMode(item.id); }}>
        <p className="text-base font-bold truncate tracking-tight">{item.TodoName}</p>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black uppercase opacity-40">{item.category}</span>
            {remaining > 0 && <span className="text-[10px] font-mono text-[#BF5AF2] font-black animate-pulse">● {Math.floor(remaining/60)}:{(remaining%60).toString().padStart(2,'0')}</span>}
        </div>
        {item.ongoing && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1726]/60 border border-[#BF5AF2]/20 backdrop-blur-xl">
            <FiRepeat size={11} className="text-[#BF5AF2]" />
            <span className="text-[9px] font-black uppercase tracking-wider text-[#BF5AF2]">This Todo List is Ongoing</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onToggleOngoing(item)} title={item.ongoing ? "Ongoing — click to disable" : "Make ongoing"} className={`p-2 transition-colors ${item.ongoing ? "text-[#BF5AF2]" : "text-white/30 hover:text-[#BF5AF2]"}`}><FiRepeat size={18}/></button>
        <button onClick={() => setTimerModal({ open: true, id: item.id, input: "" })} className="p-2 text-white/30 hover:text-[#BF5AF2] transition-colors"><FiClock size={18}/></button>
        <button onClick={() => { setToDo(item.TodoName); setEditId(item.id); setCategory(item.category || "General"); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2 text-white/30 hover:text-white transition-colors"><FiEdit3 size={18}/></button>
        <button onClick={() => { remove(ref(db, `${userPath}/${item.id}`)); }} className="p-2 text-white/30 hover:text-red-500 transition-colors"><FiTrash2 size={18}/></button>
      </div>
    </div>
  </motion.div>
);

const FocusOverlay = ({ item, remaining, setFocusMode, stopAlarm, isRinging }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#0E0C13] flex flex-col items-center justify-center p-6 text-center">
    <button onClick={() => setFocusMode(null)} className="absolute top-10 right-10 p-4 text-white/20 hover:text-white transition-all"><FiXCircle size={40}/></button>
    <h2 className="text-white/40 uppercase tracking-[0.8em] text-xs mb-6 font-black">Deep Focus</h2>
    <h1 className="text-4xl md:text-6xl font-black mb-16 tracking-tighter px-4">{item?.TodoName}</h1>
    <div className={`text-9xl font-black font-mono tracking-tighter tabular-nums ${isRinging ? "text-red-500 animate-bounce" : "text-[#BF5AF2]"}`}>
      {remaining > 0 ? `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}` : "00:00"}
    </div>
    {isRinging && (
      <button onClick={stopAlarm} className="mt-20 bg-white text-black px-16 py-6 rounded-full font-black text-2xl hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all">STOP ALARM</button>
    )}
  </motion.div>
);

export default Btn;