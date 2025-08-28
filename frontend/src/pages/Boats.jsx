import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { PlusCircle, ChevronRight } from "lucide-react";

const toRad = (x) => (x * Math.PI) / 180;
function haversineNm(a, b) {
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(h))) / 1852; // meters -> NM
}
function estimateDistanceNm(trip) {
  if (trip?.route?.length > 1) {
    let s = 0;
    for (let i = 1; i < trip.route.length; i++) {
      s += haversineNm(trip.route[i - 1], trip.route[i]);
    }
    return s;
  }
  if (trip?.start?.lat && trip?.end?.lat) {
    return haversineNm(trip.start, trip.end);
  }
  return 0;
}

export default function Boats() {
  const token = useAuth((s) => s.token);
  const nav = useNavigate();

  const [boats, setBoats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Fetch boats and trips together; guard against unmounted updates
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const [bs, ts] = await Promise.all([
          api("/api/boats", { token }),
          api("/api/trips", { token }),
        ]);
        if (cancelled) return;
        setBoats(Array.isArray(bs) ? bs : []);
        setTrips(Array.isArray(ts) ? ts : []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Kunde inte ladda båtar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Aggregate stats per boat (trip count + total distance)
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
    <div className='max-w-3xl mx-auto'>
      {/* Page header */}
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl md:text-3xl font-bold'>Dina båtar</h1>
        <Button as={Link} to='/boats/new' leftIcon={<PlusCircle size={16} />}>
          Lägg till båt
        </Button>
      </div>

      {/* Error banner */}
      {err && (
        <div className='mb-3 border border-red-300 bg-red-50 text-red-700 p-3'>
          {err}
        </div>
      )}

      {/* Loading skeletons */}
      {loading ? (
        <div className='grid gap-3'>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className='bg-white border border-brand-border/40 px-4 py-3'
            >
              <div className='animate-pulse space-y-3'>
                <div className='h-5 w-40 bg-gray-200' />
                <div className='grid grid-cols-2 gap-10'>
                  <div className='h-4 w-24 bg-gray-200' />
                  <div className='h-4 w-24 bg-gray-200' />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : boats.length === 0 ? (
        // Empty state
        <div className='bg-white border border-brand-border/40 p-6'>
          <p className='mb-3'>Du har inga båtar ännu. Lägg till din första!</p>
          <Link to={`/boats/${b._id}`}>
            <Card className='px-4 py-3'>
              <CardContent className='p-0'>
                {/* ...din nuvarande inner-HTML... */}
                <ChevronRight className='text-gray-400' />
              </CardContent>
            </Card>
          </Link>
        </div>
      ) : (
        // Boats list
        <ul className='grid gap-3'>
          {boats.map((b) => {
            const s = statsByBoat.get(b._id) || { count: 0, nm: 0 };
            return (
              <li key={b._id}>
                <Link to={`/boats/${b._id}`}>
                  <Card className='px-4 py-3'>
                    <CardContent className='p-0'>
                      <h3 className='text-lg font-semibold truncate'>
                        {b.name}
                      </h3>

                      {/* Optional subline if you store model/length/etc */}
                      {(b.model || b.lengthM) && (
                        <p className='mt-0.5 text-sm text-gray-600 truncate'>
                          {b.model ? b.model : ""}
                          {b.model && b.lengthM ? " · " : ""}
                          {b.lengthM ? `${b.lengthM} m` : ""}
                        </p>
                      )}

                      <div className='mt-2 grid grid-cols-2 gap-10 text-sm'>
                        <div>
                          <p className='text-gray-500'>Antal resor</p>
                          <p className='mt-0.5 font-medium'>{s.count}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Total distans</p>
                          <p className='mt-0.5 font-medium'>
                            {s.nm.toFixed(0)} NM
                          </p>
                        </div>
                      </div>
                      <ChevronRight className='text-gray-400' />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
