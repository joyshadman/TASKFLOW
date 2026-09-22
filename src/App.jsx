import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "./Config/firebaseConfig";
import { ClipLoader } from "react-spinners"; // Optional: For a smooth transition

import Dock from "./components/Dock";
import Btn from "./components/btn";
import LoginPage from "./components/LoginPage";
import TermsPolicyPage from "./components/Termsploicy";
import Notes from "./components/Notes";
import MindTrainingPage from "./components/MindTrainingPage";
import About from "./components/About";
import AccountPage from "./components/AccountPage";
import { Toaster } from "react-hot-toast";

// Sound Assets
import ambSound from "./assets/amb.mp3";

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true); // Loading state for auth check
  const auth = getAuth(app);

  // GLOBAL TIMER STATE
  const [timers, setTimers] = useState({});
  const [remaining, setRemaining] = useState({});
  const alarmRef = useRef(new Audio(ambSound));

  // Root cause of auth flicker: wait for the `onAuthStateChanged` listener
  // to resolve BEFORE rendering routes / redirect logic. The listener is
  // attached once (StrictMode double-invoke is handled by the cleanup).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setInitializing(false); // Auth is now determined
    });
    return () => unsubscribe();
  }, [auth]);

  // Global Function to start a timer
  const startGlobalTimer = (id, mins) => {
    if (timers[id]) clearInterval(timers[id]);

    const end = Date.now() + mins * 60000;
    const intervalId = setInterval(() => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(prev => ({ ...prev, [id]: left }));

      if (left <= 0) {
        clearInterval(intervalId);
        alarmRef.current.play().catch(() => {});
      }
    }, 1000);

    setTimers(prev => ({ ...prev, [id]: intervalId }));
  };

  const stopGlobalAlarm = () => {
    alarmRef.current.pause();
    alarmRef.current.currentTime = 0;
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Prevent UI flicker during auth check
  if (initializing) {
    return (
      <div className="h-screen bg-[#0E0C13] flex items-center justify-center">
        <ClipLoader color="#BF5AF2" size={40} />
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <Dock user={user} onSignOut={handleSignOut} />
      <Routes>
        {/* Public Routes */}
        <Route path="/terms" element={<TermsPolicyPage />} />

        {/* AUTH REDIRECT: If user exists, /login sends them to home */}
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/" replace />}
        />

        {/* Protected Routes: If no user, send to /login */}
        <Route
          path="/about"
          element={user ? <About /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/notes"
          element={user ? <Notes user={user} /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/mind-training"
          element={
            user ? (
              <MindTrainingPage user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/account"
          element={
            user ? (
              <AccountPage user={user} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/"
          element={
            user ? (
              <Btn
                user={user}
                remaining={remaining}
                startGlobalTimer={startGlobalTimer}
                stopGlobalAlarm={stopGlobalAlarm}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;