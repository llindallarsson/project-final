import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import TripMap from "./TripMap";
import PhotoPicker from "./PhotoPicker";

export default function TripForm() {
  const nav = useNavigate();
  const token = useAuth((s) => s.token);

  // formulärfält
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [crewCsv, setCrewCsv] = useState("");
  const [notes, setNotes] = useState("");
  const [windDir, setWindDir] = useState("");
  const [windSpeedKn, setWindSpeedKn] = useState("");

  // båtval
  const [boatId, setBoatId] = useState("");
  const [boats, setBoats] = useState([]);

  // karta & foton
  const [mode, setMode] = useState("draw"); // 'view' | 'set-start' | 'set-end' | 'draw'
  const [start, setStart] = useState(null); // {lat,lng}
  const [end, setEnd] = useState(null);
  const [route, setRoute] = useState([]); // [{lat,lng,t}]
  const [files, setFiles] = useState([]); // File[]

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/api/boats", { token });
        setBoats(data);
      } catch (e) {
        // boats är ett plus – om det failar kan man fortfarande skapa resa
        console.warn("Failed to load boats", e);
      }
    })();
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Titel krävs");
    if (!date) return setError("Datum krävs");

    const body = {
      title: title.trim(),
      date: new Date(date).toISOString(),
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      crew: crewCsv
        ? crewCsv
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      notes: notes || undefined,
      start: start || undefined,
      end: end || undefined,
      route: route?.length ? route : undefined,
      wind:
        windDir || windSpeedKn
          ? {
              dir: windDir || undefined,
              speedKn: windSpeedKn ? Number(windSpeedKn) : undefined,
            }
          : undefined,
      boatId: boatId || undefined,
    };

    try {
      setSaving(true);
      if (files.length > 0) {
        const fd = new FormData();
        fd.append("data", JSON.stringify(body));
        files.forEach((f) => fd.append("photos", f));
        await api("/api/trips", {
          method: "POST",
          body: fd,
          token,
          isMultipart: true,
        });
      } else {
        await api("/api/trips", { method: "POST", body, token });
      }
      nav("/");
    } catch (err) {
      setError(err.message || "Något gick fel när resan sparades");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <h2 className='text-2xl font-semibold mb-4'>Logga en resa</h2>
      {error && <p className='mb-3 text-red-600'>{error}</p>}

      <form
        onSubmit={onSubmit}
        className='grid gap-4 bg-white p-6 rounded shadow'
      >
        <div className='grid gap-2'>
          <label className='font-medium' htmlFor='title'>
            Rubrik
          </label>
          <input
            id='title'
            className='border p-2 rounded'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='date'>
              Datum
            </label>
            <input
              id='date'
              type='date'
              className='border p-2 rounded'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='dur'>
              Seglingstid (min)
            </label>
            <input
              id='dur'
              type='number'
              min='0'
              className='border p-2 rounded'
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='crew'>
              Besättning (komma-separerat)
            </label>
            <input
              id='crew'
              className='border p-2 rounded'
              placeholder='T.ex. Lisa, Kalle'
              value={crewCsv}
              onChange={(e) => setCrewCsv(e.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='boat'>
              Båt
            </label>
            <select
              id='boat'
              className='border p-2 rounded'
              value={boatId}
              onChange={(e) => setBoatId(e.target.value)}
            >
              <option value=''>— Välj båt —</option>
              {boats.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='windDir'>
              Vindriktning
            </label>
            <input
              id='windDir'
              className='border p-2 rounded'
              value={windDir}
              onChange={(e) => setWindDir(e.target.value)}
              placeholder='t.ex. NV'
            />
          </div>
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='windSp'>
              Vindstyrka (knop)
            </label>
            <input
              id='windSp'
              type='number'
              min='0'
              className='border p-2 rounded'
              value={windSpeedKn}
              onChange={(e) => setWindSpeedKn(e.target.value)}
            />
          </div>
        </div>

        {/* Karta */}
        <div className='grid gap-2'>
          <div className='flex gap-2 flex-wrap'>
            <button
              type='button'
              className='px-3 py-1 rounded border'
              onClick={() => setMode("set-start")}
            >
              Sätt start
            </button>
            <button
              type='button'
              className='px-3 py-1 rounded border'
              onClick={() => setMode("set-end")}
            >
              Sätt slut
            </button>
            <button
              type='button'
              className='px-3 py-1 rounded border'
              onClick={() => setMode("draw")}
            >
              Rita rutt
            </button>
          </div>
          <TripMap
            mode={mode}
            start={start}
            end={end}
            route={route}
            setStart={setStart}
            setEnd={setEnd}
            setRoute={setRoute}
            height={320}
          />
        </div>

        {/* Foton */}
        <div className='grid gap-2'>
          <label className='font-medium'>Foton</label>
          <PhotoPicker files={files} onChange={setFiles} />
        </div>

        <div className='flex gap-2 justify-end'>
          <button
            type='button'
            className='px-4 py-2 rounded border'
            onClick={() => nav(-1)}
          >
            Avbryt
          </button>
          <button
            disabled={saving}
            className='px-4 py-2 rounded bg-blue-600 text-white'
          >
            {saving ? "Sparar…" : "Spara resa"}
          </button>
        </div>
      </form>
    </div>
  );
}
