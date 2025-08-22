import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import TripCard from "../components/TripCard";
import SegmentedControl from "../components/ui/SegmentedControl";

const TF = { WEEK: "week", MONTH: "month", YEAR: "year", ALL: "all" };

function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // måndag=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfYear(d) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// unik dagsräkning
function countUniqueDays(trips) {
  const set = new Set();
  for (const t of trips) {
    if (!t.date) continue;
    const d = new Date(t.date);
    set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return set.size;
}

// enkel NM-summering (samma som i TripCard)
function toRad(x) {
  return (x * Math.PI) / 180;
}
function haversineNm(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat),
    lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(h))) / 1852;
}
function estimateDistanceNm(trip) {
  if (trip?.route?.length > 1) {
    let sum = 0;
    for (let i = 1; i < trip.route.length; i++)
      sum += haversineNm(trip.route[i - 1], trip.route[i]);
    return sum;
  }
  if (trip?.start?.lat && trip?.end?.lat)
    return haversineNm(trip.start, trip.end);
  return 0;
}

export default function TripsPage() {
  const token = useAuth((s) => s.token);
  const nav = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tf, setTf] = useState(TF.ALL);
  const [selYear, setSelYear] = useState(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api("/api/trips", { token });
        setTrips(data);
        // initiera valt år till senaste förekomsten
        const years = Array.from(
          new Set(
            data.map((t) => new Date(t.date).getFullYear()).filter(Boolean)
          )
        ).sort((a, b) => a - b);
        if (years.length) setSelYear(years[years.length - 1]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const yearsAvailable = useMemo(() => {
    const ys = Array.from(
      new Set(trips.map((t) => new Date(t.date).getFullYear()).filter(Boolean))
    ).sort((a, b) => a - b);
    return ys;
  }, [trips]);

  const filtered = useMemo(() => {
    const now = new Date();
    if (tf === TF.ALL)
      return trips.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    if (tf === TF.WEEK) {
      const from = startOfWeek(now);
      return trips.filter((t) => new Date(t.date) >= from);
    }
    if (tf === TF.MONTH) {
      const from = startOfMonth(now);
      return trips.filter((t) => new Date(t.date) >= from);
    }
    if (tf === TF.YEAR) {
      const from = startOfYear(new Date(selYear, 0, 1));
      const to = startOfYear(new Date(selYear + 1, 0, 1));
      return trips.filter((t) => {
        const d = new Date(t.date);
        return d >= from && d < to;
      });
    }
    return trips;
  }, [trips, tf, selYear]);

  const stats = useMemo(() => {
    const totalNm = filtered.reduce((acc, t) => acc + estimateDistanceNm(t), 0);
    const days = countUniqueDays(filtered);
    return { totalNm: totalNm.toFixed(2), days };
  }, [filtered]);

  return (
    <div className='max-w-3xl mx-auto'>
      {/* Titel */}
      <h1 className='text-2xl md:text-3xl font-bold mb-4'>Dina resor</h1>

      {/* Segmented filter: V / M / Å / Alla */}
      <SegmentedControl
        className='mb-3'
        value={tf}
        onChange={setTf}
        options={[
          { value: TF.WEEK, label: "V" },
          { value: TF.MONTH, label: "M" },
          { value: TF.YEAR, label: "Å" },
          { value: TF.ALL, label: "Alla" },
        ]}
      />

      {/* Årsfilter – visas bara om TF.YEAR och det finns >1 år */}
      {tf === TF.YEAR &&
        (yearsAvailable.length > 1 ? (
          <div className='flex items-center gap-2 mb-4 overflow-x-auto'>
            {yearsAvailable.map((y) => (
              <button
                key={y}
                onClick={() => setSelYear(y)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border
                  ${
                    selYear === y
                      ? "bg-brand-secondary text-white border-brand-secondary"
                      : "bg-white text-gray-700 border-brand-border/60 hover:bg-brand-surface-200"
                  }`}
              >
                {y}
              </button>
            ))}
          </div>
        ) : (
          <p className='text-sm text-gray-600 mb-4'>
            {yearsAvailable[0] ?? new Date().getFullYear()}
          </p>
        ))}

      {/* Sammanställning */}
      <section className='grid grid-cols-2 gap-3 mb-4'>
        <div className='bg-white border border-brand-border/40 p-4'>
          <p className='text-2xl md:text-3xl font-extrabold tracking-tight'>
            {stats.totalNm} NM
          </p>
          <p className='text-xs text-gray-500 mt-1'>Total distans</p>
        </div>
        <div className='bg-white border border-brand-border/40 p-4'>
          <p className='text-2xl md:text-3xl font-extrabold tracking-tight'>
            {stats.days} DAGAR
          </p>
          <p className='text-xs text-gray-400 mt-1'>Dagar ute till havs</p>
        </div>
      </section>

      <h2 className='text-xl font-semibold mb-2'>Loggade resor</h2>

      {/* Lista */}
      {loading ? (
        <div className='bg-white rounded-xl border p-6'>Laddar…</div>
      ) : filtered.length === 0 ? (
        <div className='bg-white rounded-xl border p-6'>
          Inga resor i vald period.
        </div>
      ) : (
        <ul className='grid gap-3'>
          {filtered
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((t) => (
              <li key={t._id}>
                <TripCard
                  trip={t}
                  onClick={() =>
                    /** gå till detaljer */ window.location.assign(
                      `/trips/${t._id}`
                    )
                  }
                />
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
