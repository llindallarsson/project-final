import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../store/auth";

export function useLiveTrack() {
  const token = useAuth((s) => s.token);
  const [isTracking, setIsTracking] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [points, setPoints] = useState([]); // [{lat,lng,t}]
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => stopWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startTimer() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (startedAt) setElapsedMs(Date.now() - new Date(startedAt).getTime());
    }, 1000);
  }
  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }
  function stopWatch() {
    if (watchIdRef.current != null) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {}
      watchIdRef.current = null;
    }
    stopTimer();
  }

  async function start() {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported in this browser");
      return;
    }
    // 1) Starta session i backend
    const res = await api("/api/tracking/start", { method: "POST", token });
    const sid = res.sessionId;
    setSessionId(sid);
    setPoints([]);
    setIsTracking(true);
    const started = new Date().toISOString();
    setStartedAt(started);
    setElapsedMs(0);
    startTimer();

    // 2) Starta geolocation-watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const t = new Date().toISOString();
        setPoints((prev) => [...prev, { lat: latitude, lng: longitude, t }]);
        try {
          await api(`/api/tracking/${sid}/point`, {
            method: "POST",
            token,
            body: { lat: latitude, lng: longitude, t },
          });
        } catch (e) {
          // behåll lokalt även om nätet glappar
          console.warn("Failed to push point", e);
        }
      },
      (err) => {
        setError(err?.message || "Location error");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  }

  async function stop() {
    stopWatch();
    setIsTracking(false);
    if (!sessionId) return null;
    try {
      const res = await api(`/api/tracking/${sessionId}/stop`, {
        method: "POST",
        token,
      });
      return res.session; // { startedAt, endedAt, points, ... }
    } finally {
      setSessionId(null);
    }
  }

  return {
    isTracking,
    start,
    stop,
    points,
    startedAt,
    elapsedMs,
    error,
    sessionId,
  };
}
