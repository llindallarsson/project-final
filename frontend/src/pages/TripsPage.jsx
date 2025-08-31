import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api';
import TripCard from '../components/TripCard';
import Button from '../components/ui/Button';
import ButtonLink from '../components/ui/ButtonLink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import SegmentedControl from '../components/ui/SegmentedControl';
import { useAuth } from '../store/auth';

// Timeframe enum
const TF = { WEEK: 'week', MONTH: 'month', YEAR: 'year', ALL: 'all' };

/* ---------- Date helpers (Mon-based week) ---------- */
function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
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

/* ---------- Distance helpers (Haversine, NM) ---------- */
const toRad = (x) => (x * Math.PI) / 180;
function haversineNm(a, b) {
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(h))) / 1852; // m -> NM
}
function estimateDistanceNm(trip) {
  if (trip?.route?.length > 1) {
    let sum = 0;
    for (let i = 1; i < trip.route.length; i++) {
      sum += haversineNm(trip.route[i - 1], trip.route[i]);
    }
    return sum;
  }
  if (trip?.start?.lat && trip?.end?.lat) return haversineNm(trip.start, trip.end);
  return 0;
}

/* ---------- Unique sailing day counter ---------- */
function countUniqueDays(trips) {
  const set = new Set();
  for (const t of trips) {
    if (!t?.date) continue;
    const d = new Date(t.date);
    set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return set.size;
}

export default function TripsPage() {
  const token = useAuth((s) => s.token);
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tf, setTf] = useState(TF.ALL);
  const [selYear, setSelYear] = useState(new Date().getFullYear());

  // Load trips
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api('/api/trips', { token });
        if (!mounted) return;
        setTrips(Array.isArray(data) ? data : []);
        // Init selected year to latest present
        const years = Array.from(
          new Set(
            (Array.isArray(data) ? data : [])
              .map((t) => (t?.date ? new Date(t.date).getFullYear() : null))
              .filter(Boolean)
          )
        ).sort((a, b) => a - b);
        if (years.length) setSelYear(years[years.length - 1]);
      } catch (e) {
        if (mounted) setError(e?.message || 'Kunde inte hämta resor.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  // Available years (for YEAR filter)
  const yearsAvailable = useMemo(() => {
    return Array.from(
      new Set(trips.map((t) => (t?.date ? new Date(t.date).getFullYear() : null)).filter(Boolean))
    ).sort((a, b) => a - b);
  }, [trips]);

  // Filter by timeframe
  const filtered = useMemo(() => {
    const now = new Date();
    if (tf === TF.ALL) return trips.slice();
    if (tf === TF.WEEK) {
      const from = startOfWeek(now);
      return trips.filter((t) => t?.date && new Date(t.date) >= from);
    }
    if (tf === TF.MONTH) {
      const from = startOfMonth(now);
      return trips.filter((t) => t?.date && new Date(t.date) >= from);
    }
    if (tf === TF.YEAR) {
      const from = startOfYear(new Date(selYear, 0, 1));
      const to = startOfYear(new Date(selYear + 1, 0, 1));
      return trips.filter((t) => {
        if (!t?.date) return false;
        const d = new Date(t.date);
        return d >= from && d < to;
      });
    }
    return trips;
  }, [trips, tf, selYear]);

  // Sort newest → oldest
  const sortedFiltered = useMemo(
    () =>
      filtered
        .slice()
        .sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime()),
    [filtered]
  );

  // Stats for current filter
  const stats = useMemo(() => {
    const totalNm = sortedFiltered.reduce((acc, t) => acc + estimateDistanceNm(t), 0);
    const days = countUniqueDays(sortedFiltered);
    return { totalNm: totalNm.toFixed(2), days };
  }, [sortedFiltered]);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Dina resor</h1>
      </div>

      {/* Timeframe segmented control */}
      <SegmentedControl
        className="mb-3"
        value={tf}
        onChange={setTf}
        options={[
          { value: TF.WEEK, labelSm: 'V', labelLg: 'Vecka' },
          { value: TF.MONTH, labelSm: 'M', labelLg: 'Månad' },
          { value: TF.YEAR, labelSm: 'Å', labelLg: 'År' },
          { value: TF.ALL, labelSm: 'Alla', labelLg: 'Alla' },
        ]}
      />

      {/* Year filter — only if YEAR and > 1 year present */}
      {tf === TF.YEAR &&
        (yearsAvailable.length > 1 ? (
          <div className="mb-4 flex items-center gap-2 overflow-x-auto" aria-label="Filtrera år">
            {yearsAvailable.map((y) => (
              <Button
                key={y}
                variant={selYear === y ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={selYear === y}
                onClick={() => setSelYear(y)}
                className="rounded-full"
              >
                {y}
              </Button>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-sm text-gray-600">
            {yearsAvailable[0] ?? new Date().getFullYear()}
          </p>
        ))}

      {/* Summary cards */}
      <section className="mb-4 grid grid-cols-2 gap-3">
        <Card variant="outline" radius="lg">
          <CardContent padding="md">
            <p className="text-2xl md:text-3xl font-extrabold tracking-tight">{stats.totalNm} NM</p>
            <p className="mt-1 text-xs text-gray-500">Total distans</p>
          </CardContent>
        </Card>
        <Card variant="outline" radius="lg">
          <CardContent padding="md">
            <p className="text-2xl md:text-3xl font-extrabold tracking-tight">{stats.days} DAGAR</p>
            <p className="mt-1 text-xs text-gray-500">Dagar ute till havs</p>
          </CardContent>
        </Card>
      </section>

      {/* List states */}
      {loading ? (
        <Card variant="outline">
          <CardContent padding="md">
            <div className="animate-pulse space-y-3">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="h-4 w-64 rounded bg-gray-200" />
              <div className="h-24 w-full rounded bg-gray-100" />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card variant="outline" className="border-red-300 bg-red-50">
          <CardContent padding="md" className="text-red-700">
            Kunde inte hämta resor: {error}
          </CardContent>
        </Card>
      ) : sortedFiltered.length === 0 ? (
        <Card variant="outline">
          <CardContent padding="md" className="flex items-center justify-between gap-3">
            <div>Inga resor i vald period.</div>
            <Button size="sm" onClick={() => navigate('/trips/new')}>
              Skapa första resan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {sortedFiltered.map((t) => (
            <li key={t._id}>
              <TripCard trip={t} onClick={() => navigate(`/trips/${t._id}`)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
