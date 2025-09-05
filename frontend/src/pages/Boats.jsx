import { ChevronRight, PlusCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api';
import { estimateDistanceNm } from '../lib/distance.js';
import { getPhotoUrl } from '../lib/photo';
import ButtonLink from '../components/ui/ButtonLink';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { useAuth } from '../store/auth';

/* ---------- Formatters ---------- */
const nmFmt = new Intl.NumberFormat('sv-SE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function initials(name = '') {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('');
}

function BoatThumb({ boat }) {
  const src = getPhotoUrl(boat?.photoUrl || boat?.photo);
  if (src) {
    return (
      <img
        src={src}
        alt={boat?.name || 'Båt'}
        className="h-14 w-14 rounded-xl object-cover border border-brand-border/40 bg-white"
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="h-14 w-14 rounded-xl grid place-items-center text-white font-semibold
                 bg-gradient-to-br from-brand-primary to-brand-secondary border border-white/20"
      aria-hidden
    >
      {initials(boat?.name || 'Båt')}
    </div>
  );
}

export default function Boats() {
  const token = useAuth((s) => s.token);

  const [boats, setBoats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Hämta båtar + resor
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const [bs, ts] = await Promise.all([
          api('/api/boats', { token }),
          api('/api/trips', { token }),
        ]);
        if (cancelled) return;
        setBoats(Array.isArray(bs) ? bs : []);
        setTrips(Array.isArray(ts) ? ts : []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Kunde inte ladda båtar.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Aggregat per båt
  const statsByBoat = useMemo(() => {
    const map = new Map(); // boatId -> { count, nm }
    for (const b of boats) map.set(b._id, { count: 0, nm: 0 });
    for (const t of trips) {
      if (!t?.boatId || !map.has(t.boatId)) continue;
      const s = map.get(t.boatId);
      s.count += 1;
      s.nm += estimateDistanceNm(t);
    }
    return map;
  }, [boats, trips]);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Dina båtar</h1>
        <ButtonLink to="/boats/new" leftIcon={<PlusCircle size={16} />}>
          Lägg till båt
        </ButtonLink>
      </div>

      {/* Error */}
      {err && (
        <Card variant="outline" className="mb-4 border-red-300 bg-red-50">
          <CardContent padding="md" className="text-red-700">
            {err}
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading ? (
        <ul className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card variant="outline">
                <CardContent padding="md">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl bg-gray-200 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
                      <div className="mt-2 grid grid-cols-2 gap-8">
                        <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : boats.length === 0 ? (
        // Empty state
        <Card variant="elevated" radius="xl">
          <CardHeader padding="lg">
            <CardTitle>Inga båtar ännu</CardTitle>
            <CardDescription>Lägg till din första båt för att börja logga resor.</CardDescription>
          </CardHeader>
          <CardFooter padding="lg">
            <ButtonLink to="/boats/new">Lägg till båt</ButtonLink>
          </CardFooter>
        </Card>
      ) : (
        // Lista
        <ul className="grid gap-3">
          {boats.map((b) => {
            const s = statsByBoat.get(b._id) || { count: 0, nm: 0 };
            return (
              <li key={b._id}>
                <Card
                  as={Link}
                  to={`/boats/${b._id}`}
                  variant="outline"
                  radius="xl"
                  interactive
                  className="block"
                >
                  <CardContent padding="md">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <BoatThumb boat={b} />

                      {/* Text + stats */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold">{b.name}</h3>
                        {(b.model || b.lengthM) && (
                          <p className="mt-0.5 truncate text-sm text-gray-600">
                            {b.model ? b.model : ''}
                            {b.model && b.lengthM ? ' · ' : ''}
                            {b.lengthM ? `${b.lengthM} m` : ''}
                          </p>
                        )}

                        <div className="mt-2 grid grid-cols-2 gap-8 text-sm">
                          <div>
                            <p className="text-gray-500">Antal resor</p>
                            <p className="mt-0.5 font-medium">{s.count}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total distans</p>
                            <p className="mt-0.5 font-medium">{nmFmt.format(s.nm)} NM</p>
                          </div>
                        </div>
                      </div>

                      {/* Chevron */}
                      <ChevronRight className="text-gray-400" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
