import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "./Config/firebaseConfig";
import { ClipLoader } from "react-spinners"; // Optional: For a smooth transition

import Navbar from "./components/navbar";
import Btn from "./components/btn";
import LoginPage from "./components/LoginPage";
import TermsPolicyPage from "./components/Termsploicy";
import Notes from "./components/Notes";
import MindTrainingPage from "./components/MindTrainingPage";
import About from "./components/About";
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

  useEffect(() => {
    // onAuthStateChanged is the key to persistence
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
      <div className="h-screen bg-[#050507] flex items-center justify-center">
        <ClipLoader color="#f97316" size={40} />
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        {/* Public Routes */}
        <Route path="/terms" element={<TermsPolicyPage />} />
        
        {/* AUTH REDIRECT: If user exists, /login sends them to home */}
        <Route 
          path="/login" 
          element={!user ? <LoginPage setUser={setUser} /> : <Navigate to="/" replace />} 
        />

        {/* Protected Routes: If no user, send to /login */}
        <Route 
          path="/about" 
          element={user ? <About user={user} onSignOut={handleSignOut} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/notes" 
          element={user ? <Notes user={user} /> : <Navigate to="/login" replace />} 
        />
        
        <Route
          path="/mind-training"
          element={
            user ? (
              <MindTrainingPage user={user} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/"
          element={
            user ? (
              <>
                <Navbar user={user} onSignOut={handleSignOut} />
                <Btn 
                  user={user} 
                  remaining={remaining} 
                  startGlobalTimer={startGlobalTimer} 
                  stopGlobalAlarm={stopGlobalAlarm}
                />
              </>
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