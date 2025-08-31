import { Cloud, CloudLightning, CloudRain, CloudSun, Sun } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api';
import { useAuth } from '../store/auth';
import PhotoPicker from './PhotoPicker';
import TripMap from './TripMap';
import Button from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Input from './ui/Input';

/* --------------------------------------------
 * Reverse geocoding (OSM / Nominatim) + simple cache
 * -------------------------------------------- */
const _geoCache = new Map();

async function reverseGeocodeLatLng(lat, lng) {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (_geoCache.has(key)) return _geoCache.get(key);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=sv&zoom=14`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await res.json();

    const nice =
      data?.name ||
      data?.address?.harbour ||
      data?.address?.marina ||
      data?.address?.neighbourhood ||
      data?.address?.suburb ||
      data?.address?.village ||
      data?.address?.town ||
      data?.address?.city ||
      (data?.display_name ? String(data.display_name).split(',')[0] : null);

    const label = nice || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    _geoCache.set(key, label);
    return label;
  } catch {
    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    _geoCache.set(key, fallback);
    return fallback;
  }
}

/* --------------------------------------------
 * Weather presets
 * -------------------------------------------- */
const WEATHER_OPTS = [
  { key: 'sunny', label: 'Sol', Icon: Sun },
  { key: 'partly', label: 'Sol + moln', Icon: CloudSun },
  { key: 'cloudy', label: 'Molnigt', Icon: Cloud },
  { key: 'rain', label: 'Regn', Icon: CloudRain },
  { key: 'storm', label: 'Åska', Icon: CloudLightning },
];

/* --------------------------------------------
 * Helpers
 * -------------------------------------------- */
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const toRad = (x) => (x * Math.PI) / 180;

// Haversine in nautical miles
function haversineNm(a, b) {
  if (!a || !b) return 0;
  const R_km = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const d_km = 2 * R_km * Math.asin(Math.sqrt(h));
  return d_km / 1.852; // km → NM
}

function calcRouteNm(route, start, end) {
  if (Array.isArray(route) && route.length > 1) {
    let sum = 0;
    for (let i = 1; i < route.length; i++) sum += haversineNm(route[i - 1], route[i]);
    return sum;
  }
  if (start && end) return haversineNm(start, end);
  return 0;
}

function numOrEmpty(v) {
  const n = Number(v);
  return Number.isNaN(n) ? '' : n;
}

/* --------------------------------------------
 * Tiny autocomplete backed by saved Places
 * -------------------------------------------- */
function PlaceAutocomplete({
  value,
  onChange,
  onPick,
  placeholder,
  places,
  leading,
  noIcon = false,
  onFocus,
}) {
  const [open, setOpen] = useState(false);

  const items = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return places.filter((p) => p.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [value, places]);

  const commonInputProps = {
    className:
      'h-11 border px-3 py-2 w-full rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/30',
    placeholder,
    value,
    onChange: (e) => {
      onChange(e.target.value);
      setOpen(true);
    },
    onFocus: (e) => {
      setOpen(true);
      onFocus && onFocus(e);
    },
    onBlur: () => setTimeout(() => setOpen(false), 120),
  };

  return (
    <div className="relative">
      {noIcon ? (
        <input {...commonInputProps} />
      ) : (
        <div className="grid grid-cols-[24px_1fr] items-center gap-2">
          <span
            className="inline-flex h-5 w-5 select-none items-center justify-center pointer-events-none"
            aria-hidden
          >
            {leading}
          </span>
          <input {...commonInputProps} />
        </div>
      )}

      {open && items.length > 0 && (
        <div
          className={`absolute right-0 z-20 mt-1 rounded-lg border bg-white shadow ${
            noIcon ? 'left-0' : 'left-[24px]'
          }`}
        >
          {items.map((p) => (
            <button
              type="button"
              key={p._id}
              className="w-full px-3 py-2 text-left hover:bg-brand-surface-200 text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(p)}
            >
              <div className="truncate">{p.name}</div>
              {p.location?.lat && p.location?.lng && (
                <div className="text-xs text-gray-500 truncate">
                  ({p.location.lat.toFixed(3)}, {p.location.lng.toFixed(3)})
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------
 * TripForm
 * -------------------------------------------- */
export default function TripForm({ initialTrip = null, mode = 'create' }) {
  const token = useAuth((s) => s.token);
  const nav = useNavigate();

  // Base fields
  const [title, setTitle] = useState(initialTrip?.title || '');
  const [date, setDate] = useState(
    initialTrip?.date ? new Date(initialTrip.date).toISOString().slice(0, 10) : ''
  );
  const [hours, setHours] = useState(
    initialTrip?.durationMinutes ? Math.floor(initialTrip.durationMinutes / 60) : ''
  );
  const [mins, setMins] = useState(
    initialTrip?.durationMinutes ? initialTrip.durationMinutes % 60 : ''
  );

  // Wind (m/s)
  const [windDir, setWindDir] = useState(initialTrip?.wind?.dir || '');
  const [windMs, setWindMs] = useState(
    initialTrip?.wind?.speedMs != null ? String(initialTrip.wind.speedMs) : ''
  );

  // Weather & Boat
  const [weather, setWeather] = useState(initialTrip?.weather || '');
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState(initialTrip?.boatId || '');

  // Crew & notes
  const [crewCsv, setCrewCsv] = useState(
    Array.isArray(initialTrip?.crew) ? initialTrip.crew.join(', ') : ''
  );
  const [notes, setNotes] = useState(initialTrip?.notes || '');

  // Places & inputs
  const [places, setPlaces] = useState([]);
  const [startName, setStartName] = useState(initialTrip?.start?.name || '');
  const [endName, setEndName] = useState(initialTrip?.end?.name || '');

  // Map & route
  const [start, setStart] = useState(initialTrip?.start || null);
  const [end, setEnd] = useState(initialTrip?.end || null);
  const [startAuto, setStartAuto] = useState(false); // set by route drawing
  const [endAuto, setEndAuto] = useState(false); // set by route drawing
  const [route, setRoute] = useState(initialTrip?.route || []);
  const [pickerEnabled, setPickerEnabled] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('start'); // 'start' | 'end' | 'route'

  const derivedMapMode = !pickerEnabled
    ? 'view'
    : pickerTarget === 'start'
    ? 'set-start'
    : pickerTarget === 'end'
    ? 'set-end'
    : 'draw';

  // Distance (NM)
  const [distanceNm, setDistanceNm] = useState(initialTrip?.distanceNm ?? '');
  const [calcFromMap, setCalcFromMap] = useState(true);

  // Files
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /* Load boats & places */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [bts, pls] = await Promise.all([
          api('/api/boats', { token }),
          api('/api/places', { token }),
        ]);
        if (!alive) return;
        setBoats(bts || []);
        setPlaces(pls || []);
        if (!boatId && bts?.length === 1) setBoatId(bts[0]._id);
      } catch (e) {
        console.warn(e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  /* Shared handler for picking start/end on the map */
  const applyPickedPoint = useCallback(async (kind, p) => {
    const label = await reverseGeocodeLatLng(p.lat, p.lng);
    if (kind === 'start') {
      setStart((prev) =>
        prev ? { ...prev, lat: p.lat, lng: p.lng, name: label } : { ...p, name: label }
      );
      setStartName(label);
      setStartAuto(false);
    } else {
      setEnd((prev) =>
        prev ? { ...prev, lat: p.lat, lng: p.lng, name: label } : { ...p, name: label }
      );
      setEndName(label);
      setEndAuto(false);
    }
  }, []);

  /* When drawing a route, derive start (first) and end (last) with labels */
  useEffect(() => {
    if (!(pickerEnabled && pickerTarget === 'route')) return;
    if (!Array.isArray(route) || route.length === 0) return;

    (async () => {
      if ((!start || startAuto) && route.length >= 1) {
        const p0 = route[0];
        const label0 = await reverseGeocodeLatLng(p0.lat, p0.lng);
        setStart({ lat: p0.lat, lng: p0.lng, name: label0 });
        setStartName(label0);
        setStartAuto(true);
      }
      if (route.length >= 1 && (endAuto || !end)) {
        const last = route[route.length - 1];
        const labelLast = await reverseGeocodeLatLng(last.lat, last.lng);
        setEnd({ lat: last.lat, lng: last.lng, name: labelLast });
        setEndName(labelLast);
        setEndAuto(true);
      }
    })();
  }, [route, pickerEnabled, pickerTarget, start, end, startAuto, endAuto]);

  /* Auto-calc distance from map (route preferred) */
  useEffect(() => {
    if (!calcFromMap) return;
    const nm = calcRouteNm(route, start, end);
    setDistanceNm(nm ? nm.toFixed(2) : '');
  }, [calcFromMap, route, start, end]);

  /* Submit handler */
  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Rubrik krävs.');
    if (!date) return setError('Datum krävs.');

    const durationMinutes =
      (Number.isFinite(+hours) ? +hours * 60 : 0) + (Number.isFinite(+mins) ? +mins : 0);

    const body = {
      title: title.trim(),
      date: new Date(date).toISOString(),
      durationMinutes: durationMinutes || undefined,
      crew: crewCsv
        ? crewCsv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      notes: notes || undefined,
      start: start ? { ...start, name: startName || start?.name } : undefined,
      end: end ? { ...end, name: endName || end?.name } : undefined,
      route: route?.length ? route : undefined,
      wind:
        windDir || windMs !== ''
          ? { dir: windDir || undefined, speedMs: windMs ? Number(windMs) : undefined }
          : undefined,
      weather: weather || undefined,
      boatId: boatId || undefined,
      distanceNm:
        distanceNm !== '' && !Number.isNaN(Number(distanceNm)) ? Number(distanceNm) : undefined,
    };

    try {
      setSaving(true);
      if (files.length > 0) {
        const fd = new FormData();
        fd.append('data', JSON.stringify(body));
        files.forEach((f) => fd.append('photos', f));
        if (mode === 'edit' && initialTrip?._id) {
          await api(`/api/trips/${initialTrip._id}`, {
            method: 'PUT',
            token,
            body: fd,
            isMultipart: true,
          });
        } else {
          await api('/api/trips', { method: 'POST', token, body: fd, isMultipart: true });
        }
      } else {
        if (mode === 'edit' && initialTrip?._id) {
          await api(`/api/trips/${initialTrip._id}`, { method: 'PUT', token, body });
        } else {
          await api('/api/trips', { method: 'POST', token, body });
        }
      }
      nav('/');
    } catch (err) {
      setError(err.message || 'Kunde inte spara resan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {error && (
        <Card variant="outline" className="mb-4 border-red-300 bg-red-50">
          <CardContent className="text-red-700 p-4">{error}</CardContent>
        </Card>
      )}

      <Card variant="elevated" radius="xl">
        <CardHeader className="pb-6" padding="lg">
          <CardTitle className="text-2xl lg:text-3xl">
            {mode === 'edit' ? 'Redigera resa' : 'Logga en resa'}
          </CardTitle>
        </CardHeader>

        <CardContent padding="lg" className="space-y-6">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            {/* Title */}
            <Input
              label="Rubrik"
              id="title"
              placeholder="En rubrik för resan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {/* Date + duration */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Datum"
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Seglingstid</label>
                <div className="flex items-center gap-2">
                  <Input
                    id="hours"
                    type="number"
                    inputClassName="w-20"
                    placeholder="h"
                    min={0}
                    value={hours}
                    onChange={(e) => setHours(numOrEmpty(e.target.value))}
                  />
                  <span className="text-sm text-gray-600">h</span>
                  <Input
                    id="mins"
                    type="number"
                    inputClassName="w-20"
                    placeholder="min"
                    min={0}
                    max={59}
                    value={mins}
                    onChange={(e) => setMins(numOrEmpty(e.target.value))}
                  />
                  <span className="text-sm text-gray-600">min</span>
                </div>
              </div>
            </div>

            {/* Start & End */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">
                Start– och slutdestination
              </label>

              <div className="grid grid-cols-[24px_1fr] items-stretch gap-2">
                {/* Decorative timeline */}
                <div className="flex h-full select-none flex-col items-center py-2" aria-hidden>
                  <span className="mt-1 h-2.5 w-2.5 rounded-full ring-1 ring-gray-600" />
                  <span className="my-2 w-px flex-1 border-l border-dashed border-gray-400" />
                  <svg width="16" height="16" viewBox="0 0 24 24" className="mb-1 text-red-500">
                    <path
                      fill="currentColor"
                      d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"
                    />
                  </svg>
                </div>

                <div className="grid gap-3">
                  <PlaceAutocomplete
                    noIcon
                    value={startName}
                    onChange={setStartName}
                    onPick={(p) => {
                      setPickerEnabled(true);
                      setPickerTarget('start');
                      if (p.location?.lat && p.location?.lng) {
                        applyPickedPoint('start', { lat: p.location.lat, lng: p.location.lng });
                      }
                    }}
                    places={places}
                    placeholder="Välj startdestination, eller markera på kartan…"
                    onFocus={() => {
                      setPickerEnabled(true);
                      setPickerTarget('start');
                    }}
                  />
                  <PlaceAutocomplete
                    noIcon
                    value={endName}
                    onChange={setEndName}
                    onPick={(p) => {
                      setPickerEnabled(true);
                      setPickerTarget('end');
                      if (p.location?.lat && p.location?.lng) {
                        applyPickedPoint('end', { lat: p.location.lat, lng: p.location.lng });
                      }
                    }}
                    places={places}
                    placeholder="Välj slutdestination, eller markera på kartan…"
                    onFocus={() => {
                      setPickerEnabled(true);
                      setPickerTarget('end');
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Route actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={pickerEnabled && pickerTarget === 'route' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setPickerEnabled(true);
                  setPickerTarget('route');
                }}
              >
                Rita rutt
              </Button>

              {pickerEnabled && pickerTarget === 'route' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRoute([]);
                    if (startAuto) {
                      setStart(null);
                      setStartName('');
                      setStartAuto(false);
                    }
                    if (endAuto) {
                      setEnd(null);
                      setEndName('');
                      setEndAuto(false);
                    }
                  }}
                >
                  Ångra rutt
                </Button>
              )}
            </div>

            {/* Map */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Karta</label>
              <div className="w-full rounded-lg overflow-hidden border">
                <TripMap
                  mode={derivedMapMode}
                  start={start}
                  end={end}
                  route={route}
                  setStart={(p) => applyPickedPoint('start', p)}
                  setEnd={(p) => applyPickedPoint('end', p)}
                  setRoute={setRoute}
                  height={400}
                />
              </div>
            </div>

            {/* Distance & Wind */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Distance */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Distans</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      inputClassName="w-24 disabled:bg-gray-100"
                      value={distanceNm}
                      onChange={(e) => setDistanceNm(e.target.value)}
                      placeholder="NM"
                      disabled={calcFromMap}
                    />
                    <span className="text-sm text-gray-600 flex-shrink-0">NM</span>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="accent-brand-primary"
                      checked={calcFromMap}
                      onChange={(e) => setCalcFromMap(e.target.checked)}
                    />
                    <span className="text-gray-700">Beräkna från karta</span>
                  </label>
                </div>
              </div>

              {/* Wind */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Vind</label>
                <div className="flex items-center gap-2">
                  <select
                    className="h-10 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 flex-shrink-0"
                    value={windDir}
                    onChange={(e) => setWindDir(e.target.value)}
                  >
                    <option value="">Riktning</option>
                    {DIRS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    inputClassName="w-20"
                    placeholder="m/s"
                    value={windMs}
                    onChange={(e) => setWindMs(e.target.value)}
                  />
                  <span className="text-sm text-gray-600 flex-shrink-0">m/s</span>
                </div>
              </div>
            </div>

            {/* Boat & Crew */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <label className="text-sm font-medium text-gray-800" htmlFor="boat">
                  Båt
                </label>
                <select
                  id="boat"
                  className="w-full h-10 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
                  value={boatId}
                  onChange={(e) => setBoatId(e.target.value)}
                >
                  <option value="">{boats.length ? 'Välj båt (valfritt)' : 'Inga båtar'}</option>
                  {boats.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Besättning"
                id="crew"
                placeholder="Lisa, Kalle, …"
                value={crewCsv}
                onChange={(e) => setCrewCsv(e.target.value)}
              />
            </div>

            {/* Weather */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Väder</label>
              <div className="flex flex-wrap gap-2">
                {WEATHER_OPTS.map(({ key, label, Icon }) => {
                  const active = weather === key;
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant={active ? 'primary' : 'outline'}
                      size="sm"
                      aria-pressed={active}
                      onClick={() => setWeather(active ? '' : key)}
                      leftIcon={<Icon size={16} />}
                      className="flex-shrink-0"
                    >
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden sr-only">{label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800" htmlFor="notes">
                Anteckningar
              </label>
              <textarea
                id="notes"
                rows={4}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 resize-vertical"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Skriv något kul från resan…"
              />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Bilder</label>
              <PhotoPicker files={files} onChange={setFiles} />
              {mode === 'edit' && initialTrip?.photos?.length > 0 && (
                <p className="text-xs text-gray-600">Befintliga bilder behålls; nya läggs till.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => nav(-1)}>
                Avbryt
              </Button>
              <Button type="submit" isLoading={saving} disabled={saving}>
                {mode === 'edit' ? 'Uppdatera' : 'Spara resa'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
