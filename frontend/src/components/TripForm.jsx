import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import TripMap from "./TripMap";
import PhotoPicker from "./PhotoPicker";

export default function TripForm({ initialTrip = null, mode = "create" }) {
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
  const [boatId, setBoatId] = useState("");

  // karta & foton
  const [modeMap, setModeMap] = useState("draw");
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [route, setRoute] = useState([]);
  const [files, setFiles] = useState([]); // nya filer för uppladdning

  const [boats, setBoats] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Förifyll vid edit
  useEffect(() => {
    if (!initialTrip) return;
    setTitle(initialTrip.title || "");
    setDate(
      initialTrip.date
        ? new Date(initialTrip.date).toISOString().slice(0, 10)
        : ""
    );
    setDurationMinutes(initialTrip.durationMinutes ?? "");
    setCrewCsv(
      Array.isArray(initialTrip.crew) ? initialTrip.crew.join(", ") : ""
    );
    setNotes(initialTrip.notes || "");
    setWindDir(initialTrip.wind?.dir || "");
    setWindSpeedKn(initialTrip.wind?.speedKn ?? "");
    setBoatId(initialTrip.boatId || "");
    setStart(initialTrip.start || null);
    setEnd(initialTrip.end || null);
    setRoute(initialTrip.route || []);
  }, [initialTrip]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/api/boats", { token });
        setBoats(data);
      } catch {}
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
      if (mode === "edit" && initialTrip?._id) {
        if (files.length > 0) {
          const fd = new FormData();
          fd.append("data", JSON.stringify(body));
          files.forEach((f) => fd.append("photos", f));
          await api(`/api/trips/${initialTrip._id}`, {
            method: "PUT",
            body: fd,
            token,
            isMultipart: true,
          });
        } else {
          await api(`/api/trips/${initialTrip._id}`, {
            method: "PUT",
            body,
            token,
          });
        }
      } else {
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
      <h2 className='text-2xl font-semibold mb-4'>
        {mode === "edit" ? "Redigera resa" : "Logga en resa"}
      </h2>
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

        <div className='grid gap-2'>
          <div className='flex gap-2 flex-wrap'>
            <button
              type='button'
              className='px-3 py-1 rounded border'
              onClick={() => setModeMap("set-start")}
            >
              Sätt start
            </button>
            <button
              type='button'
              className='px-3 py-1 rounded border'
              onClick={() => setModeMap("set-end")}
            >
              Sätt slut
            </button>
            <button
              type='button'
              className='px-3 py-1 rounded border'
              onClick={() => setModeMap("draw")}
            >
              Rita rutt
            </button>
          </div>
          <TripMap
            mode={modeMap}
            start={start}
            end={end}
            route={route}
            setStart={setStart}
            setEnd={setEnd}
            setRoute={setRoute}
            height={320}
          />
        </div>

        <div className='grid gap-2'>
          <label className='font-medium'>Lägg till nya foton</label>
          <PhotoPicker files={files} onChange={setFiles} />
          {mode === "edit" && initialTrip?.photos?.length > 0 && (
            <p className='text-xs text-gray-600'>
              Befintliga foton behålls. Nya foton läggs till.
            </p>
          )}
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
            {saving ? "Sparar…" : mode === "edit" ? "Uppdatera" : "Spara resa"}
          </button>
        </div>
      </form>
    </div>
  );
}
