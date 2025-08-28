import { Link } from "react-router-dom";
import MapPreview from "./MapPreview";
import { Clock, Ruler } from "lucide-react";

/* ---------- Utils ---------- */
// Capitalize first character (svenska weekday/month come lowercase)
function capFirst(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Safe Swedish date label (fallback to "—")
function formatDateSv(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  const weekday = dt.toLocaleDateString("sv-SE", { weekday: "long" });
  const day = dt.toLocaleDateString("sv-SE", { day: "numeric" });
  const month = dt.toLocaleDateString("sv-SE", { month: "long" });
  return `${capFirst(weekday)} ${day} ${month}`;
}

// Duration label like "2h 15min" or "–"
function formatDur(min) {
  if (!Number.isFinite(min)) return "–";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

/* ---------- Distance (Haversine in NM) ---------- */
function toRad(x) {
  return (x * Math.PI) / 180;
}
function haversineNm(a, b) {
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const d = 2 * R * Math.asin(Math.sqrt(h));
  return d / 1852; // meters → NM
}
function estimateDistanceNm(trip) {
  if (trip?.route?.length > 1) {
    let sum = 0;
    for (let i = 1; i < trip.route.length; i++) {
      sum += haversineNm(trip.route[i - 1], trip.route[i]);
    }
    return sum;
  }
  if (trip?.start?.lat && trip?.end?.lat) {
    return haversineNm(trip.start, trip.end);
  }
  return 0;
}

/* ---------- Component ---------- */
/**
 * TripCard
 * Props:
 * - trip: object (start/end/route/date/title/durationMinutes)
 * - to?: string — if provided, card renders as a <Link>
 * - onClick?: () => void — if no `to`, card renders as a <button>
 */
export default function TripCard({ trip, to, onClick }) {
  const nm = estimateDistanceNm(trip);
  const nmText = `${nm.toFixed(2)} NM`;
  const content = (
    <article className='bg-white border border-brand-border/40 overflow-hidden'>
      <div className='px-4 pt-4'>
        <p className='text-xs text-gray-500'>{formatDateSv(trip?.date)}</p>

        <h3 className='text-lg font-semibold mt-1'>
          {trip?.title?.trim() || "Resa"}
        </h3>

        <div className='grid grid-cols-2 gap-6 mt-3'>
          <div>
            <p className='text-xs text-gray-500'>Start</p>
            <p className='font-medium'>{trip?.start?.name || "—"}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500'>Stopp</p>
            <p className='font-medium'>{trip?.end?.name || "—"}</p>
          </div>
        </div>

        <div className='flex items-center gap-6 mt-3 text-sm'>
          <span className='inline-flex items-center gap-2'>
            <Clock size={16} className='text-gray-500' aria-hidden />
            <span className='font-semibold'>
              {formatDur(trip?.durationMinutes)}
            </span>
          </span>
          <span className='inline-flex items-center gap-2'>
            <Ruler size={16} className='text-gray-500' aria-hidden />
            <span className='font-semibold'>{nmText}</span>
          </span>
        </div>
      </div>

      {/* Map preview at the bottom of the card */}
      <div className='mt-4'>
        <MapPreview
          start={trip?.start}
          end={trip?.end}
          route={trip?.route}
          height={200}
        />
      </div>
    </article>
  );

  // Prefer Link when `to` is provided; otherwise render a semantic button.
  if (to) {
    return (
      <Link
        to={to}
        className='block focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 rounded-lg'
        aria-label={`Öppna resa: ${trip?.title || ""}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type='button'
      onClick={onClick}
      className='w-full text-left focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 rounded-lg'
      aria-label={`Öppna resa: ${trip?.title || ""}`}
    >
      {content}
    </button>
  );
}
