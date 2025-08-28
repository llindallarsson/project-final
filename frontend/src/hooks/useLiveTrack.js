// Live tracking hook: starts a backend session, watches geolocation,
// pushes points periodically, and exposes elapsed time & state.
//
// Returned API (backwards-compatible):
//   isTracking, start, stop, points, startedAt, elapsedMs, error, sessionId
// Plus a few extras (optional to use):
//   isStarting, isStopping, clear, lastErrorAt
//
// Notes:
// - Points are still stored locally on every position update for a smooth UI.
// - Uploads to the backend are throttled (default 2s) to avoid spamming.
// - If geolocation permission is denied, the session is closed cleanly.

import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../store/auth";

export function useLiveTrack({
  uploadThrottleMs = 2000, // minimum time between backend point uploads
  geoOptions = {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 10000,
  },
} = {}) {
  const token = useAuth((s) => s.token);

  // Core state
  const [isTracking, setIsTracking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [points, setPoints] = useState([]); // [{ lat, lng, t }]
  const [error, setError] = useState("");
  const [lastErrorAt, setLastErrorAt] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Refs to avoid stale closures
  const tokenRef = useRef(token);
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const lastUploadRef = useRef(0);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopWatchOnly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Internals ---------- */

  function startTimer() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (startedAt) {
        setElapsedMs(Date.now() - new Date(startedAt).getTime());
      }
    }, 1000);
  }

  function stopTimer() {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  // Stop only the geolocation/timer without touching backend session
  function stopWatchOnly() {
    if (watchIdRef.current != null) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        /* no-op */
      }
      watchIdRef.current = null;
    }
    stopTimer();
  }

  function clear() {
    setPoints([]);
    setError("");
    setLastErrorAt(null);
    setElapsedMs(0);
    setStartedAt(null);
    setSessionId(null);
    setIsTracking(false);
    setIsStarting(false);
    setIsStopping(false);
  }

  /* ---------- Public actions ---------- */

  async function start() {
    if (isTracking || isStarting) return;
    setIsStarting(true);
    setError("");

    if (!("geolocation" in navigator)) {
      setIsStarting(false);
      setError("Geolocation not supported in this browser");
      setLastErrorAt(Date.now());
      return;
    }

    try {
      // 1) Create session on backend
      const res = await api("/api/tracking/start", {
        method: "POST",
        token: tokenRef.current,
      });
      const sid = res.sessionId;
      setSessionId(sid);
      setPoints([]);
      setIsTracking(true);

      // 2) Start timekeeping
      const started = new Date().toISOString();
      setStartedAt(started);
      setElapsedMs(0);
      startTimer();

      // 3) Start geolocation watch
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const t = new Date().toISOString();

          // Always update local points for a smooth map
          setPoints((prev) => [...prev, { lat: latitude, lng: longitude, t }]);

          // Throttle uploads to backend
          const now = Date.now();
          if (now - lastUploadRef.current >= uploadThrottleMs) {
            lastUploadRef.current = now;
            try {
              await api(`/api/tracking/${sid}/point`, {
                method: "POST",
                token: tokenRef.current,
                body: { lat: latitude, lng: longitude, t },
              });
            } catch (e) {
              // Keep local points even if upload fails (e.g., flaky network)
              console.warn("Failed to push point", e);
            }
          }
        },
        async (geoErr) => {
          const msg =
            geoErr?.message ||
            (geoErr?.code === 1
              ? "Location permission denied"
              : "Location error");
          setError(msg);
          setLastErrorAt(Date.now());

          // If we cannot get location, close the session gracefully.
          try {
            if (sid) {
              await api(`/api/tracking/${sid}/stop`, {
                method: "POST",
                token: tokenRef.current,
              });
            }
          } catch {
            /* ignore */
          } finally {
            stopWatchOnly();
            setIsTracking(false);
            setSessionId(null);
          }
        },
        geoOptions
      );
    } catch (e) {
      setError(e?.message || "Failed to start live tracking");
      setLastErrorAt(Date.now());
      // Ensure local cleanup if backend start failed
      stopWatchOnly();
      setIsTracking(false);
      setSessionId(null);
    } finally {
      setIsStarting(false);
    }
  }

  async function stop() {
    if (!sessionId || isStopping) {
      // Ensure UI state is sane even if stop() is called twice
      stopWatchOnly();
      setIsTracking(false);
      return null;
    }

    setIsStopping(true);
    stopWatchOnly();
    setIsTracking(false);

    try {
      const res = await api(`/api/tracking/${sessionId}/stop`, {
        method: "POST",
        token: tokenRef.current,
      });
      return res.session; // { startedAt, endedAt, points, ... }
    } catch (e) {
      setError(e?.message || "Failed to stop tracking");
      setLastErrorAt(Date.now());
      return null;
    } finally {
      setSessionId(null);
      setIsStopping(false);
    }
  }

  /* ---------- Return API ---------- */

  return {
    // state
    isTracking,
    isStarting,
    isStopping,
    sessionId,
    points,
    startedAt,
    elapsedMs,
    error,
    lastErrorAt,
    // actions
    start,
    stop,
    clear,
  };
}
