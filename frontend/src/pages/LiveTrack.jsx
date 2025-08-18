import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveTrack } from "../hooks/useLiveTrack";
import { useAuth } from "../store/auth";
import { api } from "../api";
import TripMap from "../components/TripMap";

function fmt(ms) {
  if (!ms || ms < 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export default function LiveTrack() {
  const nav = useNavigate();
  const token = useAuth((s) => s.token);
  const { isTracking, start, stop, points, startedAt, elapsedMs, error } =
    useLiveTrack();
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    try {
      await start();
    } catch (e) {
      alert(e.message || "Could not start tracking");
    }
  }

  async function handleStop() {
    try {
      const session = await stop();
      if (!session) return;

      const pts = session.points?.length ? session.points : points;
      if (!pts || pts.length === 0) {
        alert("No GPS points captured — not creating a trip.");
        return;
      }

      const startPoint = pts[0];
      const endPoint = pts[pts.length - 1];
      const durationMinutes = Math.max(
        1,
        Math.round(
          (new Date(session.endedAt) - new Date(session.startedAt)) / 60000
        )
      );

      const body = {
        title: `Live trip ${new Date(session.startedAt).toLocaleString()}`,
        date: session.startedAt,
        durationMinutes,
        start: { lat: startPoint.lat, lng: startPoint.lng },
        end: { lat: endPoint.lat, lng: endPoint.lng },
        route: pts.map((p) => ({ lat: p.lat, lng: p.lng, t: p.t })),
      };

      setSaving(true);
      const trip = await api("/api/trips", { method: "POST", token, body });
      nav(`/trips/${trip._id}`);
    } catch (e) {
      alert(e.message || "Failed to stop/save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <h2 className='text-2xl font-semibold mb-3'>Live loggning</h2>
      {error && <p className='text-red-600 mb-2'>{error}</p>}

      <div className='flex items-center gap-3 mb-3'>
        <span
          className={`px-2 py-1 text-sm rounded ${
            isTracking
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {isTracking ? "Tracking…" : "Idle"}
        </span>
        <span className='text-sm text-gray-700'>Elapsed: {fmt(elapsedMs)}</span>
        {startedAt && !isTracking && (
          <span className='text-xs text-gray-500'>
            Started: {new Date(startedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className='mb-3'>
        <TripMap
          mode='view'
          route={points}
          start={points[0]}
          end={points[points.length - 1]}
          height={360}
        />
      </div>

      <div className='flex gap-2'>
        <button
          onClick={handleStart}
          disabled={isTracking}
          className='px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50'
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!isTracking || saving}
          className='px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50'
        >
          {saving ? "Saving…" : "Stop & Save"}
        </button>
      </div>

      <p className='text-xs text-gray-600 mt-2'>
        Tips: Tillåt plats i webbläsaren. På iOS/Safari fungerar det bäst när
        skärmen är på.
      </p>
    </div>
  );
}
