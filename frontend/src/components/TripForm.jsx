import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import TripMap from "./TripMap";
import PhotoPicker from "./PhotoPicker";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  MapPin,
} from "lucide-react";

const WEATHER_OPTS = [
  { key: "sunny", label: "Sol", Icon: Sun },
  { key: "partly", label: "Sol + moln", Icon: CloudSun },
  { key: "cloudy", label: "Molnigt", Icon: Cloud },
  { key: "rain", label: "Regn", Icon: CloudRain },
  { key: "storm", label: "Åska", Icon: CloudLightning },
];
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

// Haversine (NM)
function haversineNm(a, b) {
  if (!a || !b) return 0;
  const toRad = (x) => (x * Math.PI) / 180;
  const R_km = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const d_km = 2 * R_km * Math.asin(Math.sqrt(h));
  return d_km / 1.852; // km → NM
}
function calcRouteNm(route, start, end) {
  if (Array.isArray(route) && route.length > 1) {
    let sum = 0;
    for (let i = 1; i < route.length; i++)
      sum += haversineNm(route[i - 1], route[i]);
    return sum;
  }
  if (start && end) return haversineNm(start, end);
  return 0;
}

// Tiny autocomplete using your saved places
function PlaceAutocomplete({
  value,
  onChange,
  onPick,
  placeholder,
  places,
  leading, // används bara när noIcon = false
  noIcon = false,
}) {
  const [open, setOpen] = useState(false);

  const items = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return places.filter((p) => p.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [value, places]);

  return (
    <div className='relative'>
      {noIcon ? (
        // Enkel input utan ikonspalt
        <input
          className='h-11 border px-3 py-2 w-full outline-none focus:ring-2 focus:ring-brand-primary/30'
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
      ) : (
        // Gamla varianten med ikon + input
        <div className='grid grid-cols-[24px_1fr] items-center gap-2'>
          <span
            className='inline-flex items-center justify-center h-5 w-5 pointer-events-none select-none'
            aria-hidden
          >
            {leading}
          </span>
          <input
            className='h-11 border px-3 py-2 w-full outline-none focus:ring-2 focus:ring-brand-primary/30'
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
          />
        </div>
      )}

      {open && items.length > 0 && (
        <div
          className={`absolute z-20 right-0 mt-1 border bg-white shadow ${
            noIcon ? "left-0" : "left-[24px]"
          }`}
        >
          {items.map((p) => (
            <button
              type='button'
              key={p._id}
              className='w-full text-left px-3 py-2 hover:bg-brand-surface-200'
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(p)}
            >
              {p.name}
              {p.location?.lat && p.location?.lng && (
                <span className='ml-2 text-xs text-gray-500'>
                  ({p.location.lat.toFixed(3)}, {p.location.lng.toFixed(3)})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripForm({ initialTrip = null, mode = "create" }) {
  const token = useAuth((s) => s.token);
  const nav = useNavigate();

  // Basic fields
  const [title, setTitle] = useState(initialTrip?.title || "");
  const [date, setDate] = useState(
    initialTrip?.date
      ? new Date(initialTrip.date).toISOString().slice(0, 10)
      : ""
  );
  const [hours, setHours] = useState(
    initialTrip?.durationMinutes
      ? Math.floor(initialTrip.durationMinutes / 60)
      : ""
  );
  const [mins, setMins] = useState(
    initialTrip?.durationMinutes ? initialTrip.durationMinutes % 60 : ""
  );

  // Wind (stored/displayed in m/s now)
  const [windDir, setWindDir] = useState(initialTrip?.wind?.dir || "");
  const [windMs, setWindMs] = useState(
    initialTrip?.wind?.speedMs != null ? String(initialTrip.wind.speedMs) : ""
  );

  // Weather
  const [weather, setWeather] = useState(initialTrip?.weather || "");

  // Boats
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState(initialTrip?.boatId || "");

  // Crew & notes
  const [crewCsv, setCrewCsv] = useState(
    Array.isArray(initialTrip?.crew) ? initialTrip.crew.join(", ") : ""
  );
  const [notes, setNotes] = useState(initialTrip?.notes || "");

  // Places & inputs
  const [places, setPlaces] = useState([]);
  const [startName, setStartName] = useState(initialTrip?.start?.name || "");
  const [endName, setEndName] = useState(initialTrip?.end?.name || "");

  // Map state
  const [start, setStart] = useState(initialTrip?.start || null);
  const [end, setEnd] = useState(initialTrip?.end || null);
  const [route, setRoute] = useState(initialTrip?.route || []);
  const [pickerEnabled, setPickerEnabled] = useState(false);
  const [pickerTarget, setPickerTarget] = useState("start"); // 'start' | 'end' | 'route'
  const derivedMapMode = !pickerEnabled
    ? "view"
    : pickerTarget === "start"
    ? "set-start"
    : pickerTarget === "end"
    ? "set-end"
    : "draw";

  // Distance (NM)
  const [distanceNm, setDistanceNm] = useState(initialTrip?.distanceNm ?? "");
  const [calcFromMap, setCalcFromMap] = useState(true);

  // Photos
  const [files, setFiles] = useState([]);

  // UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load boats & places
  useEffect(() => {
    (async () => {
      try {
        const [bts, pls] = await Promise.all([
          api("/api/boats", { token }),
          api("/api/places", { token }),
        ]);
        setBoats(bts || []);
        setPlaces(pls || []);
        if (!boatId && bts?.length === 1) setBoatId(bts[0]._id);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [token]);

  // When selecting a saved place, fill coords+name
  function pickStartPlace(p) {
    setStartName(p.name || "");
    if (p.location?.lat && p.location?.lng) {
      setStart({ lat: p.location.lat, lng: p.location.lng, name: p.name });
    }
  }
  function pickEndPlace(p) {
    setEndName(p.name || "");
    if (p.location?.lat && p.location?.lng) {
      setEnd({ lat: p.location.lat, lng: p.location.lng, name: p.name });
    }
  }

  // Auto distance from map
  useEffect(() => {
    if (!calcFromMap) return;
    const nm = calcRouteNm(route, start, end);
    setDistanceNm(nm ? nm.toFixed(2) : "");
  }, [calcFromMap, route, start, end]);

  // Submit
  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Rubrik krävs.");
    if (!date) return setError("Datum krävs.");

    const durationMinutes =
      (Number.isFinite(+hours) ? +hours * 60 : 0) +
      (Number.isFinite(+mins) ? +mins : 0);

    const body = {
      title: title.trim(),
      date: new Date(date).toISOString(),
      durationMinutes: durationMinutes || undefined,
      crew: crewCsv
        ? crewCsv
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      notes: notes || undefined,
      start: start ? { ...start, name: startName || start?.name } : undefined,
      end: end ? { ...end, name: end?.name || endName } : undefined,
      route: route?.length ? route : undefined,
      // store wind in m/s now
      wind:
        windDir || windMs !== ""
          ? {
              dir: windDir || undefined,
              speedMs: windMs ? Number(windMs) : undefined,
            }
          : undefined,
      weather: weather || undefined,
      boatId: boatId || undefined,
      distanceNm:
        distanceNm !== "" && !Number.isNaN(Number(distanceNm))
          ? Number(distanceNm)
          : undefined,
    };

    try {
      setSaving(true);
      if (files.length > 0) {
        const fd = new FormData();
        fd.append("data", JSON.stringify(body));
        files.forEach((f) => fd.append("photos", f));
        if (mode === "edit" && initialTrip?._id) {
          await api(`/api/trips/${initialTrip._id}`, {
            method: "PUT",
            token,
            body: fd,
            isMultipart: true,
          });
        } else {
          await api("/api/trips", {
            method: "POST",
            token,
            body: fd,
            isMultipart: true,
          });
        }
      } else {
        if (mode === "edit" && initialTrip?._id) {
          await api(`/api/trips/${initialTrip._id}`, {
            method: "PUT",
            token,
            body,
          });
        } else {
          await api("/api/trips", { method: "POST", token, body });
        }
      }
      nav("/");
    } catch (err) {
      setError(err.message || "Kunde inte spara resan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className='md:grid 
  md:grid-cols-[minmax(320px,1fr)_340px]   /* ≥ md: karta 340px */
  lg:grid-cols-[minmax(360px,1fr)_400px]   /* ≥ lg: karta 400px */
  xl:grid-cols-[minmax(380px,1fr)_460px]   /* ≥ xl: karta 460px */
  md:items-start gap-6 overflow-x-hidden'
    >
      {/* LEFT: the form */}
      <div className='min-w-0'>
        <h1 className='text-2xl md:text-3xl font-bold mb-4'>
          {mode === "edit" ? "Redigera resa" : "Logga en resa"}
        </h1>

        {error && (
          <div className='mb-3 border border-red-300 bg-red-50 text-red-700 p-3'>
            {error}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className='grid gap-5 bg-white border p-4 md:p-6'
        >
          {/* Title */}
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='title'>
              Rubrik
            </label>
            <input
              id='title'
              className='border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='En rubrik för resan'
              required
            />
          </div>

          {/* Date + time */}
          <div className='grid md:grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <label className='font-medium' htmlFor='date'>
                Datum
              </label>
              <div className='flex items-center gap-2'>
                <input
                  id='date'
                  type='date'
                  className='border px-3 py-2 grow outline-none focus:ring-2 focus:ring-brand-primary/30'
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className='grid gap-2'>
              <label className='font-medium'>Seglingstid</label>
              <div className='flex items-center gap-2'>
                <input
                  type='number'
                  min='0'
                  placeholder='h'
                  className='border px-3 py-2 w-20 outline-none focus:ring-2 focus:ring-brand-primary/30'
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
                <span className='text-gray-600'>h</span>
                <input
                  type='number'
                  min='0'
                  max='59'
                  placeholder='min'
                  className='border px-3 py-2 w-24 outline-none focus:ring-2 focus:ring-brand-primary/30'
                  value={mins}
                  onChange={(e) => setMins(e.target.value)}
                />
                <span className='text-gray-600'>min</span>
              </div>
            </div>
          </div>

          <label className='font-medium'>Start– och slutdestination</label>

          <div className='grid grid-cols-[24px_1fr] items-stretch gap-2'>
            {/* Vänster: dekor (prick → prickad linje → pin) */}
            <div
              className='flex flex-col items-center h-full py-2 select-none'
              aria-hidden
            >
              <span className='mt-1 h-2.5 w-2.5 rounded-full ring-1 ring-gray-600' />
              <span className='flex-1 w-px border-l border-dashed border-gray-400 my-2' />
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                className='text-red-500 mb-1'
              >
                <path
                  fill='currentColor'
                  d='M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z'
                />
              </svg>
            </div>

            {/* Höger: två inputs utan egna ikoner */}
            <div className='grid gap-3'>
              <PlaceAutocomplete
                noIcon
                value={startName}
                onChange={setStartName}
                onPick={pickStartPlace}
                places={places}
                placeholder='Välj startdestination, eller markera på kartan…'
              />
              <PlaceAutocomplete
                noIcon
                value={endName}
                onChange={setEndName}
                onPick={pickEndPlace}
                places={places}
                placeholder='Välj slutdestination, eller markera på kartan…'
              />
            </div>
          </div>

          <div className='mt-2'>
            <button
              type='button'
              onClick={() => setPickerEnabled((v) => !v)}
              className={`px-3 py-1.5 border text-sm ${
                pickerEnabled ? "bg-brand-secondary text-white" : "bg-white"
              }`}
            >
              Rita rutt på kartan
            </button>
            {pickerEnabled && (
              <div className='mt-2 flex gap-2 text-sm'>
                <span
                  className={`px-2 py-1 border cursor-pointer ${
                    pickerTarget === "start" ? "bg-brand-surface-200" : ""
                  }`}
                  onClick={() => setPickerTarget("start")}
                >
                  Start
                </span>
                <span
                  className={`px-2 py-1 border cursor-pointer ${
                    pickerTarget === "end" ? "bg-brand-surface-200" : ""
                  }`}
                  onClick={() => setPickerTarget("end")}
                >
                  Slut
                </span>
                <span
                  className={`px-2 py-1 border cursor-pointer ${
                    pickerTarget === "route" ? "bg-brand-surface-200" : ""
                  }`}
                  onClick={() => setPickerTarget("route")}
                >
                  Rutt
                </span>
              </div>
            )}
          </div>

          <div className='grid md:grid-cols-2 gap-6'>
            {/* Distans */}
            <div>
              <label className='font-medium'>Distans</label>
              <div className='mt-2 flex items-center gap-2'>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  className='h-11 border px-3 py-2 w-40 outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-gray-100'
                  value={distanceNm}
                  onChange={(e) => setDistanceNm(e.target.value)}
                  placeholder='NM'
                  disabled={calcFromMap}
                />
                <span className='text-gray-600'>NM</span>
              </div>
              <label className='mt-2 inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  className='accent-brand-primary'
                  checked={calcFromMap}
                  onChange={(e) => setCalcFromMap(e.target.checked)}
                />
                Beräkna från karta
              </label>
            </div>

            {/* Vind */}
            <div>
              <label className='font-medium'>Vind (m/s)</label>
              <div className='mt-2 flex items-center gap-2'>
                <select
                  className='h-11 border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30'
                  value={windDir}
                  onChange={(e) => setWindDir(e.target.value)}
                >
                  <option value=''>Riktning</option>
                  {DIRS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  type='number'
                  min='0'
                  step='0.1'
                  className='h-11 border px-3 py-2 w-28 outline-none focus:ring-2 focus:ring-brand-primary/30'
                  placeholder='m/s'
                  value={windMs}
                  onChange={(e) => setWindMs(e.target.value)}
                />
                <span className='text-gray-600'>m/s</span>
              </div>
            </div>
          </div>

          {/* Boat & Crew */}
          <div className='grid md:grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <label className='font-medium' htmlFor='boat'>
                Båt
              </label>
              <select
                id='boat'
                className='border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30'
                value={boatId}
                onChange={(e) => setBoatId(e.target.value)}
              >
                <option value=''>
                  {boats.length ? "Välj båt (valfritt)" : "Inga båtar ännu"}
                </option>
                {boats.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='grid gap-2'>
              <label className='font-medium' htmlFor='crew'>
                Besättning
              </label>
              <input
                id='crew'
                className='border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30'
                placeholder='Lisa, Kalle, …'
                value={crewCsv}
                onChange={(e) => setCrewCsv(e.target.value)}
              />
            </div>
          </div>

          {/* Weather */}
          <div className='grid gap-2'>
            <label className='font-medium'>Väder</label>
            <div className='flex gap-2 flex-wrap'>
              {WEATHER_OPTS.map(({ key, label, Icon }) => {
                const active = weather === key;
                return (
                  <button
                    type='button'
                    key={key}
                    onClick={() => setWeather(active ? "" : key)}
                    className={`px-3 py-2 border inline-flex items-center gap-2 select-none ${
                      active
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-white"
                    }`}
                    title={label}
                    aria-pressed={active}
                  >
                    <Icon size={18} />
                    <span className='hidden sm:inline text-sm'>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='notes'>
              Anteckningar
            </label>
            <textarea
              id='notes'
              rows={5}
              className='border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Skriv något kul från resan…'
            />
          </div>

          {/* Map on MOBILE (kept here, hidden on desktop) */}
          <div className='md:hidden'>
            <TripMap
              mode={derivedMapMode}
              start={start}
              end={end}
              route={route}
              setStart={(p) => {
                setStart(p);
                if (!startName) setStartName("Start");
              }}
              setEnd={(p) => {
                setEnd(p);
                if (!endName) setEndName("Mål");
              }}
              setRoute={setRoute}
              height={320}
            />
          </div>

          {/* Photos */}
          <div className='grid gap-2'>
            <label className='font-medium'>Bilder</label>
            <PhotoPicker files={files} onChange={setFiles} />
            {mode === "edit" && initialTrip?.photos?.length > 0 && (
              <p className='text-xs text-gray-600'>
                Befintliga bilder behålls; nya läggs till.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => nav(-1)}
              className='px-4 py-2 border'
            >
              Avbryt
            </button>
            <button
              disabled={saving}
              className='px-4 py-2 bg-brand-primary text-white disabled:opacity-60'
            >
              {saving
                ? "Sparar…"
                : mode === "edit"
                ? "Uppdatera"
                : "Spara resa"}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT: sticky map on desktop */}
      <aside className='hidden md:block sticky top-20 min-w-0 h-[calc(100vh-140px)] overflow-hidden'>
        <TripMap
          mode={derivedMapMode}
          start={start}
          end={end}
          route={route}
          setStart={(p) => {
            setStart(p);
            if (!startName) setStartName("Start");
          }}
          setEnd={(p) => {
            setEnd(p);
            if (!endName) setEndName("Mål");
          }}
          setRoute={setRoute}
          height='100%'
        />
      </aside>
    </div>
  );
}
