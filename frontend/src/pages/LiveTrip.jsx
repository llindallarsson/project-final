import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveTrack } from "../hooks/useLiveTrack";
import { useAuth } from "../store/auth";
import { api } from "../api";
import TripMap from "../components/TripMap";

// Format HH:MM:SS from milliseconds
function fmt(ms) {
  if (!ms || ms < 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export default function LiveTrip() {
  const nav = useNavigate();
  const token = useAuth((s) => s.token);

  // Hook API (supports both the simple and improved versions)
  const {
    isTracking,
    isStarting: hookIsStarting,
    isStopping: hookIsStopping,
    start,
    stop,
    points,
    startedAt,
    elapsedMs,
    error,
  } = useLiveTrack();

  const [saving, setSaving] = useState(false);

  // Use optional states if they exist on the hook
  const isStarting = !!hookIsStarting;
  const isStopping = !!hookIsStopping;

  // Current start/end from streamed points
  const startPoint = points?.length ? points[0] : null;
  const endPoint = points?.length ? points[points.length - 1] : null;

  const canStart = useMemo(
    () => !isTracking && !saving && !isStarting,
    [isTracking, saving, isStarting]
  );
  const canStop = useMemo(
    () => isTracking && !saving && !isStopping,
    [isTracking, saving, isStopping]
  );

  async function handleStart() {
    try {
      await start();
    } catch (e) {
      alert(e.message || "Kunde inte starta live-resa");
    }
  }

  async function handleStopAndSave() {
    try {
      setSaving(true);

      // Stop tracking; prefer session from backend, but fall back to local points
      const session = await stop();
      const pts = session?.points?.length ? session.points : points;

      if (!pts || pts.length === 0) {
        alert("Inga GPS-punkter fångades – ingen resa skapas.");
        return;
      }

      const s0 = pts[0];
      const sN = pts[pts.length - 1];

      // Compute duration in minutes – prefer backend times if available
      const startedIso =
        session?.startedAt || startedAt || new Date().toISOString();
      const endedIso = session?.endedAt || new Date().toISOString();
      const durationMinutes = Math.max(
        1,
        Math.round(
          (new Date(endedIso).getTime() - new Date(startedIso).getTime()) /
            60000
        )
      );

      const title = `Live-resa ${new Date(startedIso).toLocaleString("sv-SE")}`;

      const body = {
        title,
        date: startedIso,
        durationMinutes,
        start: s0 ? { lat: s0.lat, lng: s0.lng } : undefined,
        end: sN ? { lat: sN.lat, lng: sN.lng } : undefined,
        route: pts.map((p) => ({ lat: p.lat, lng: p.lng, t: p.t })),
      };

      const trip = await api("/api/trips", { method: "POST", token, body });
      nav(`/trips/${trip._id}`);
    } catch (e) {
      alert(e.message || "Misslyckades att stoppa/spara");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Live-resa</h1>

      {/* Status + meta */}
      <div className="bg-white border p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span
            className={`px-2 py-1 text-sm rounded border ${
              isTracking
                ? "bg-green-50 text-green-800 border-green-300"
                : "bg-gray-50 text-gray-700 border-gray-300"
            }`}
          >
            {isTracking ? "Pågår…" : "Stoppad"}
          </span>

          <span className="text-sm text-gray-700">
            Tid: <strong>{fmt(elapsedMs)}</strong>
          </span>

          {startedAt && (
            <span className="text-xs text-gray-500">
              Startad: {new Date(startedAt).toLocaleTimeString("sv-SE")}
            </span>
          )}

          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>

        {/* Map */}
        <div className="mb-4">
          <TripMap
            mode="view"
            route={points}
            start={startPoint}
            end={endPoint}
            height={360}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`px-4 py-2 rounded text-white ${
              canStart
                ? "bg-brand-primary hover:bg-brand-primary-600"
                : "bg-brand-primary/60"
            }`}
          >
            {isStarting ? "Startar…" : "Starta"}
          </button>

          <button
            onClick={handleStopAndSave}
            disabled={!canStop}
            className={`px-4 py-2 rounded text-white ${
              canStop ? "bg-red-600 hover:bg-red-700" : "bg-red-600/60"
            }`}
          >
            {saving || isStopping ? "Sparar…" : "Stoppa & spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
