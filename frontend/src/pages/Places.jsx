import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { api } from "../api";
import { useAuth } from "../store/auth";

// Leaflet default marker icons (behövs i Vite/React)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function Clicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

export default function Places() {
  const token = useAuth((s) => s.token);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    lat: 59.325, // Stockholm default
    lng: 18.07,
    notes: "",
  });

  async function load() {
    try {
      const data = await api("/api/places", { token });
      setPlaces(data);
      setError("");
    } catch (e) {
      setError(e.message || "Failed to load places");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function createPlace(e) {
    e.preventDefault();
    try {
      await api("/api/places", {
        method: "POST",
        token,
        body: {
          name: draft.name,
          notes: draft.notes || undefined,
          location: { lat: Number(draft.lat), lng: Number(draft.lng) },
        },
      });
      setDraft((d) => ({ ...d, name: "", notes: "" }));
      load();
    } catch (e) {
      alert(e.message || "Failed to create place");
    }
  }

  async function deletePlace(id) {
    if (!confirm("Delete this place?")) return;
    try {
      await api(`/api/places/${id}`, { method: "DELETE", token });
      load();
    } catch (e) {
      alert(e.message || "Failed to delete place");
    }
  }

  const center = useMemo(
    () => ({ lat: Number(draft.lat), lng: Number(draft.lng) }),
    [draft.lat, draft.lng]
  );

  return (
    <div className='max-w-5xl mx-auto grid grid-cols-2 gap-4'>
      {/* Lista + formulär */}
      <div className='bg-white p-4 rounded shadow'>
        <h2 className='text-xl font-semibold mb-3'>Dina platser</h2>
        {error && <p className='text-red-600 mb-2'>{error}</p>}

        <ul className='grid gap-2 mb-4'>
          {places.map((p) => (
            <li
              key={p._id}
              className='flex justify-between items-center bg-gray-50 p-2 rounded border'
            >
              <div>
                <div className='font-medium'>{p.name}</div>
                <div className='text-xs text-gray-600'>
                  {p.location?.lat?.toFixed(5)}, {p.location?.lng?.toFixed(5)}
                </div>
                {p.notes && <div className='text-sm'>{p.notes}</div>}
              </div>
              <button
                className='px-2 py-1 rounded border text-red-600'
                onClick={() => deletePlace(p._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={createPlace} className='grid gap-2'>
          <input
            className='border p-2 rounded'
            placeholder='Name'
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            required
          />
          <div className='grid grid-cols-2 gap-2'>
            <input
              className='border p-2 rounded'
              placeholder='Lat'
              value={draft.lat}
              onChange={(e) => setDraft({ ...draft, lat: e.target.value })}
            />
            <input
              className='border p-2 rounded'
              placeholder='Lng'
              value={draft.lng}
              onChange={(e) => setDraft({ ...draft, lng: e.target.value })}
            />
          </div>
          <textarea
            className='border p-2 rounded'
            rows='2'
            placeholder='Notes'
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
          <button className='px-3 py-2 rounded bg-blue-600 text-white'>
            Add place
          </button>
          <p className='text-xs text-gray-600'>
            Tips: Klicka i kartan för att fylla Lat/Lng.
          </p>
        </form>
      </div>

      {/* Karta */}
      <div className='rounded border overflow-hidden' style={{ height: 520 }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={9}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {places.map(
            (p) =>
              p.location?.lat && (
                <Marker
                  key={p._id}
                  position={[p.location.lat, p.location.lng]}
                  title={p.name}
                />
              )
          )}

          {/* aktuell draft-markör */}
          <Marker position={[center.lat, center.lng]} />

          {/* klick i kartan fyller draft.lat/lng */}
          <Clicker
            onPick={(ll) =>
              setDraft({
                ...draft,
                lat: ll.lat.toFixed(6),
                lng: ll.lng.toFixed(6),
              })
            }
          />
        </MapContainer>
      </div>
    </div>
  );
}
