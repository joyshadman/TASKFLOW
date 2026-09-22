import React, { createContext, useState, useContext, useRef } from "react";

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [timers, setTimers] = useState({});
  const [remaining, setRemaining] = useState({});
  const alarmRef = useRef(new Audio("/assets/amb.mp3")); // Path to your sound

  const startGlobalTimer = (id, minutes) => {
    if (timers[id]) clearInterval(timers[id]);

    const end = Date.now() + minutes * 60000;
    const intervalId = setInterval(() => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining((prev) => ({ ...prev, [id]: left }));

      if (left <= 0) {
        clearInterval(intervalId);
        alarmRef.current.play().catch(() => {});
        // Optional: Add a global notification here
      }
    }, 1000);

    setTimers((prev) => ({ ...prev, [id]: intervalId }));
  };

  const stopGlobalAlarm = () => {
    alarmRef.current.pause();
    alarmRef.current.currentTime = 0;
  };

  return (
    <TimerContext.Provider value={{ remaining, startGlobalTimer, stopGlobalAlarm }}>
      {children}
    </TimerContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTimer = () => useContext(TimerContext);