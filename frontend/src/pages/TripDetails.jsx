import {
  ArrowLeft,
  Calendar,
  Clock,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Compass,
  Edit3,
  MapPin,
  Ruler,
  Ship,
  Sun,
  Trash2,
  Users,
  Wind,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../api';
import { estimateDistanceNm } from '../lib/distance';
import { getPhotoUrl } from '../lib/photo';
import TripMap from '../components/TripMap';
import Button from '../components/ui/Button';
import ButtonLink from '../components/ui/ButtonLink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../store/auth';

/* ---------- Formatting helpers ---------- */
function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}
function fmtDuration(min) {
  if (!Number.isFinite(min)) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}
function formatNm(n) {
  return Number.isFinite(n) ? `${n.toFixed(2)} NM` : '—';
}

/* ---------- Wind helpers (always m/s) ---------- */
function windMsFromTrip(trip) {
  if (trip?.wind?.speedMs != null) return Number(trip.wind.speedMs);
  if (trip?.wind?.speedKn != null) return Number(trip.wind.speedKn) / 1.943844;
  return null;
}

/* ---------- Weather mappings ---------- */
const WEATHER_LABEL = {
  sunny: 'Soligt',
  partly: 'Sol + moln',
  cloudy: 'Molnigt',
  rain: 'Regn',
  storm: 'Åska',
};
const WEATHER_ICON = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
};

/* ---------- Location label ---------- */
function coordLabel(p) {
  if (!p?.lat || !p?.lng) return '—';
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
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const data = await api(`/api/trips/${id}`, { token });
        if (!alive) return;
        setTrip(data);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || 'Kunde inte hämta resa.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, token]);

  const distanceNm = useMemo(() => distanceNmFromTrip(trip), [trip]);
  const windMs = useMemo(() => windMsFromTrip(trip), [trip]);

  const handleDelete = useCallback(async () => {
    if (!trip?._id) return;
    if (!confirm('Ta bort denna resa?')) return;
    try {
      await api(`/api/trips/${trip._id}`, { method: 'DELETE', token });
      nav('/');
    } catch (e) {
      alert(e.message || 'Kunde inte ta bort resan.');
    }
  }, [trip, token, nav]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card variant="outline">
          <CardContent padding="lg">Laddar…</CardContent>
        </Card>
      </div>
    );
  }
  if (err) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card variant="outline" className="border-red-300 bg-red-50">
          <CardContent padding="lg" className="text-red-700">
            {err}
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card variant="outline">
          <CardContent padding="lg">Resan hittades inte.</CardContent>
        </Card>
      </div>
    );
  }

  const WIcon = WEATHER_ICON[trip.weather] || null;
  const photos = Array.isArray(trip.photos) ? trip.photos : [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-6">
        {/* Header Card */}
        <Card variant="elevated" radius="xl">
          <CardHeader padding="lg">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-2xl md:text-3xl break-words">
                  {trip.title || 'Resa'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {fmtDate(trip.date)} • {fmtDuration(Number(trip.durationMinutes))}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<ArrowLeft size={16} />}
                  onClick={() => nav(-1)}
                  className="hidden sm:flex"
                >
                  Tillbaka
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<ArrowLeft size={16} />}
                  onClick={() => nav(-1)}
                  className="sm:hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit3 size={16} />}
                  onClick={() => nav(`/trips/${trip._id}/edit`)}
                />
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 size={16} />}
                  onClick={handleDelete}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent padding="lg" className="space-y-6">
            {/* Summary info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoChip icon={Ruler} label="Distans" value={formatNm(distanceNm)} />
              <InfoChip
                icon={Wind}
                label="Vind"
                value={`${trip.wind?.dir || '—'}${
                  windMs != null ? ` · ${windMs.toFixed(1)} m/s` : ''
                }`}
              />
              <InfoChip icon={Ship} label="Båt" value={trip.boatId?.name || '—'} />
              <InfoChip
                icon={Users}
                label="Besättning"
                value={
                  Array.isArray(trip.crew) && trip.crew.length > 0 ? trip.crew.join(', ') : '—'
                }
              />
            </div>

            {/* Locations */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-800">Rutt</h3>
              <div className="space-y-2">
                <InfoChip icon={Compass} label="Start" value={coordLabel(trip.start)} />
                <InfoChip icon={MapPin} label="Mål" value={coordLabel(trip.end)} />
              </div>
            </div>

            {/* Weather */}
            {trip.weather && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-800">Väder</h3>
                <div className="inline-flex items-center gap-2 border px-3 py-2 rounded-lg bg-gray-50">
                  {WIcon ? <WIcon size={16} className="text-gray-600" /> : null}
                  <span className="text-sm">{WEATHER_LABEL[trip.weather] || trip.weather}</span>
                </div>
              </div>
            )}

            {/* Map */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-800">Karta</h3>
              <div className="w-full rounded-lg overflow-hidden border">
                <TripMap
                  mode="view"
                  start={trip.start}
                  end={trip.end}
                  route={trip.route}
                  height={400}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {trip.notes && (
          <Card variant="outline" radius="xl">
            <CardHeader padding="md">
              <CardTitle className="text-lg">Anteckningar</CardTitle>
            </CardHeader>
            <CardContent padding="lg" className="whitespace-pre-wrap text-gray-700">
              {trip.notes}
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <Card variant="outline" radius="xl">
            <CardHeader padding="md">
              <CardTitle className="text-lg">Bilder ({photos.length})</CardTitle>
            </CardHeader>
            <CardContent padding="lg">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((p, i) => {
                  const url = getPhotoUrl(p);
                  if (!url) return null;
                  const alt = trip.title ? `Foto ${i + 1} – ${trip.title}` : `Foto ${i + 1}`;
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block border bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      title="Öppna bild i full storlek"
                    >
                      <img src={url} alt={alt} className="w-full aspect-square object-cover" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------- Small presentational subcomponent ---------- */
function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="border px-3 py-2.5 flex items-center gap-3 rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <Icon size={18} className="text-gray-500 flex-shrink-0" />
      <div className="leading-tight min-w-0 flex-1">
        <div className="text-xs text-gray-600 uppercase tracking-wide">{label}</div>
        <div className="font-medium text-gray-900 truncate" title={value}>
          {value}
        </div>
      </div>
    </div>
  );
}
