import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import TripMap from "../components/TripMap";
import {
  Calendar,
  Clock,
  Wind,
  Ship,
  Users,
  MapPin,
  ArrowLeft,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Edit3,
  Trash2,
  Compass,
  Ruler,
} from "lucide-react";

/* ---- helpers ---- */
function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
function fmtDuration(min) {
  if (!Number.isFinite(min)) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}
function nmFromRoute(route = []) {
  // enkel Haversine i NM om distans saknas
  const toRad = (x) => (x * Math.PI) / 180;
  const R_km = 6371;
  let sumKm = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    sumKm += 2 * R_km * Math.asin(Math.sqrt(h));
  }
  return sumKm / 1.852;
}
function windMsFromTrip(trip) {
  // visar i m/s. Om legacy speedKn finns: konvertera till m/s
  if (trip?.wind?.speedMs != null) return Number(trip.wind.speedMs);
  if (trip?.wind?.speedKn != null) return Number(trip.wind.speedKn) / 1.943844;
  return null;
}
const WEATHER_ICON = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
};

function coordLabel(p) {
  if (!p?.lat || !p?.lng) return "—";
  const name = p.name && p.name.trim() ? p.name : null;
  const coords = `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
  return name ? `${name} (${coords})` : coords;
}

export default function TripDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = useAuth((s) => s.token);

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Base URL för foton i backend (om patherna inte är fulla URLs)
  const apiBase =
    import.meta.env.VITE_API_URL ??
    (location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:8080"
      : "https://vindra.onrender.com");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api(`/api/trips/${id}`, { token });
        setTrip(data);
      } catch (e) {
        setErr(e.message || "Kunde inte hämta resa.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  const distanceNm = useMemo(() => {
    if (!trip) return null;
    if (Number.isFinite(trip.distanceNm)) return Number(trip.distanceNm);
    if (Array.isArray(trip.route) && trip.route.length > 1) {
      return nmFromRoute(trip.route);
    }
    return null;
  }, [trip]);

  if (loading) return <p className='p-4'>Laddar…</p>;
  if (err) return <p className='p-4 text-red-600'>{err}</p>;
  if (!trip) return <p className='p-4'>Resan hittades inte.</p>;

  const WIcon = WEATHER_ICON[trip.weather] || null;
  const windMs = windMsFromTrip(trip);

  const photos = Array.isArray(trip.photos) ? trip.photos : [];
  const photoUrl = (p) => {
    const raw = typeof p === "string" ? p : p?.url || p?.path || "";
    if (!raw) return "";
    return raw.startsWith("http")
      ? raw
      : `${apiBase}${raw.startsWith("/") ? "" : "/"}${raw}`;
    // ex: "/uploads/abc.jpg" → "<apiBase>/uploads/abc.jpg"
  };

  return (
    <div className='lg:grid lg:grid-cols-[minmax(360px,1fr)_400px] xl:grid-cols-[minmax(380px,1fr)_460px] gap-6'>
      {/* LEFT: Content */}
      <div className='min-w-0'>
        {/* Back + actions */}
        <div className='flex items-center justify-between mb-4'>
          <button
            onClick={() => nav(-1)}
            className='inline-flex items-center gap-2 text-sm text-gray-700 hover:underline'
          >
            <ArrowLeft size={16} />
            Tillbaka
          </button>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => nav(`/trips/${trip._id}/edit`)}
              className='inline-flex items-center gap-2 px-3 py-1.5 border text-gray-800'
              title='Redigera'
            >
              <Edit3 size={16} />
              Redigera
            </button>
            <button
              onClick={async () => {
                if (!confirm("Ta bort denna resa?")) return;
                try {
                  await api(`/api/trips/${trip._id}`, {
                    method: "DELETE",
                    token,
                  });
                  nav("/");
                } catch (e) {
                  alert(e.message || "Kunde inte ta bort resan.");
                }
              }}
              className='inline-flex items-center gap-2 px-3 py-1.5 border text-red-600'
              title='Ta bort'
            >
              <Trash2 size={16} />
              Ta bort
            </button>
          </div>
        </div>

        {/* Title + meta */}
        <div className='bg-white border p-4 md:p-5'>
          <h1 className='text-2xl md:text-3xl font-bold'>{trip.title}</h1>

          <div className='mt-3 grid gap-2 text-sm text-gray-700'>
            <div className='flex items-center gap-2'>
              <Calendar size={16} className='opacity-70' />
              <span>{fmtDate(trip.date)}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Clock size={16} className='opacity-70' />
              <span>{fmtDuration(Number(trip.durationMinutes))}</span>
            </div>
          </div>

          {/* Summary chips */}
          <div className='mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2'>
            <div className='border px-3 py-2 flex items-center gap-2'>
              <Ruler size={16} className='opacity-70' />
              <div className='leading-tight'>
                <div className='text-xs text-gray-600'>Distans</div>
                <div className='font-medium'>
                  {distanceNm != null ? `${distanceNm.toFixed(2)} NM` : "—"}
                </div>
              </div>
            </div>

            <div className='border px-3 py-2 flex items-center gap-2'>
              <Wind size={16} className='opacity-70' />
              <div className='leading-tight'>
                <div className='text-xs text-gray-600'>Vind</div>
                <div className='font-medium'>
                  {trip.wind?.dir || "—"}{" "}
                  {windMs != null ? `· ${windMs.toFixed(1)} m/s` : ""}
                </div>
              </div>
            </div>

            <div className='border px-3 py-2 flex items-center gap-2'>
              <Ship size={16} className='opacity-70' />
              <div className='leading-tight'>
                <div className='text-xs text-gray-600'>Båt</div>
                <div className='font-medium'>
                  {trip.boat?.name || trip.boatName || "—"}
                </div>
              </div>
            </div>

            <div className='border px-3 py-2 flex items-center gap-2'>
              <Users size={16} className='opacity-70' />
              <div className='leading-tight'>
                <div className='text-xs text-gray-600'>Besättning</div>
                <div className='font-medium'>
                  {Array.isArray(trip.crew) && trip.crew.length > 0
                    ? trip.crew.join(", ")
                    : "—"}
                </div>
              </div>
            </div>

            <div className='border px-3 py-2 flex items-center gap-2'>
              <Compass size={16} className='opacity-70' />
              <div className='leading-tight'>
                <div className='text-xs text-gray-600'>Start</div>
                <div className='font-medium'>{coordLabel(trip.start)}</div>
              </div>
            </div>

            <div className='border px-3 py-2 flex items-center gap-2'>
              <MapPin size={16} className='opacity-70' />
              <div className='leading-tight'>
                <div className='text-xs text-gray-600'>Mål</div>
                <div className='font-medium'>{coordLabel(trip.end)}</div>
              </div>
            </div>
          </div>

          {/* Weather line */}
          <div className='mt-3'>
            <div className='inline-flex items-center gap-2 border px-3 py-1.5'>
              {WIcon ? <WIcon size={16} /> : null}
              <span className='text-sm'>
                Väder:{" "}
                {trip.weather
                  ? {
                      sunny: "Soligt",
                      partly: "Sol + moln",
                      cloudy: "Molnigt",
                      rain: "Regn",
                      storm: "Åska",
                    }[trip.weather] || trip.weather
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <section className='mt-6'>
            <h3 className='text-lg font-semibold mb-2'>Bilder</h3>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
              {photos.map((p, i) => {
                const url = photoUrl(p);
                if (!url) return null;
                return (
                  <a
                    key={i}
                    href={url}
                    target='_blank'
                    rel='noreferrer'
                    className='block border bg-white'
                    title='Öppna bild'
                  >
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <img
                      src={url}
                      className='w-full aspect-square object-cover'
                    />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Notes */}
        {trip.notes && (
          <section className='mt-6'>
            <h3 className='text-lg font-semibold mb-2'>Anteckningar</h3>
            <div className='bg-white border p-4 whitespace-pre-wrap'>
              {trip.notes}
            </div>
          </section>
        )}

        {/* Mobile map */}
        <div className='lg:hidden mt-6'>
          <TripMap
            mode='view'
            start={trip.start}
            end={trip.end}
            route={trip.route}
            height={300}
          />
        </div>
      </div>

      {/* RIGHT: sticky map on desktop */}
      <aside className='hidden lg:block sticky top-20 min-w-0 h-[calc(100vh-140px)] overflow-hidden'>
        <TripMap
          mode='view'
          start={trip.start}
          end={trip.end}
          route={trip.route}
          height='100%'
        />
      </aside>
    </div>
  );
}
