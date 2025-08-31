import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';
import { useAuth } from '../store/auth';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';

// ---- Leaflet default marker icons (Vite/React safe & idempotent) ----
if (typeof window !== 'undefined' && !window.__leaflet_icon_patch_applied) {
  // Guard against repeated merges in strict/dev mode
  // eslint-disable-next-line no-underscore-dangle
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  window.__leaflet_icon_patch_applied = true;
}

/** Imperatively pan the map when `center` changes. */
function MoveTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center?.lat || !center?.lng) return;
    map.setView([center.lat, center.lng]);
  }, [center, map]);
  return null;
}

/** Map click handler: writes picked lat/lng via `onPick`. */
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

  // Data
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Draft (create form)
  const [draft, setDraft] = useState({
    name: '',
    lat: 59.325, // Stockholm default
    lng: 18.07,
    notes: '',
  });

  // UI: which place is highlighted/centered on the map
  const [activePlaceId, setActivePlaceId] = useState(null);

  // Derived map center from draft inputs
  const center = useMemo(
    () => ({
      lat: Number(draft.lat) || 59.325,
      lng: Number(draft.lng) || 18.07,
    }),
    [draft.lat, draft.lng]
  );

  // ---- API ----
  async function load() {
    setLoading(true);
    try {
      const data = await api('/api/places', { token });
      setPlaces(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e.message || 'Kunde inte ladda platser.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function createPlace(e) {
    e.preventDefault();
    setError('');
    try {
      const lat = Number(draft.lat);
      const lng = Number(draft.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return setError('Lat/Lng måste vara giltiga nummer.');
      }

      await api('/api/places', {
        method: 'POST',
        token,
        body: {
          name: draft.name.trim(),
          notes: draft.notes?.trim() || undefined,
          location: { lat, lng },
        },
      });

      setDraft((d) => ({ ...d, name: '', notes: '' }));
      await load();
    } catch (e) {
      setError(e.message || 'Kunde inte skapa plats.');
    }
  }

  async function deletePlace(id) {
    if (!confirm('Radera denna plats?')) return;
    try {
      await api(`/api/places/${id}`, { method: 'DELETE', token });
      if (activePlaceId === id) setActivePlaceId(null);
      await load();
    } catch (e) {
      alert(e.message || 'Kunde inte radera plats.');
    }
  }

  // ---- Render ----
  return (
    <div className="lg:grid lg:grid-cols-[minmax(360px,1fr)_460px] xl:grid-cols-[minmax(380px,1fr)_520px] lg:items-start gap-6">
      {/* LEFT: list + create form */}
      <div className="min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Dina platser</h1>
        </div>

        {error && (
          <Card variant="outline" className="mb-4 border-red-300 bg-red-50">
            <CardContent className="text-red-700">{error}</CardContent>
          </Card>
        )}

        {/* List */}
        <Card radius="xl">
          <CardHeader padding="lg">
            <CardTitle>Sparade platser</CardTitle>
            <CardDescription>Tryck på en rad för att visa på kartan.</CardDescription>
          </CardHeader>
          <CardContent padding="md">
            {loading ? (
              <p className="text-sm text-gray-600">Laddar…</p>
            ) : places.length === 0 ? (
              <p className="text-sm text-gray-600">Inga platser ännu.</p>
            ) : (
              <ul className="grid gap-2">
                {places.map((p) => {
                  const isActive = activePlaceId === p._id;
                  const lat = p.location?.lat;
                  const lng = p.location?.lng;

                  const onShow = () => {
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                    setActivePlaceId(p._id);
                    setDraft((d) => ({ ...d, lat, lng }));
                  };

                  return (
                    <li key={p._id}>
                      <Card
                        onClick={onShow}
                        variant="outline"
                        radius="lg"
                        interactive={Number.isFinite(lat) && Number.isFinite(lng)}
                        className={
                          isActive ? 'bg-brand-surface-200 border-brand-border' : 'bg-white'
                        }
                      >
                        <CardContent
                          padding="md"
                          className="flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-medium truncate">{p.name || '—'}</div>
                            <div className="text-xs text-gray-600">
                              {Number.isFinite(lat) && Number.isFinite(lng)
                                ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                                : '—'}
                            </div>
                            {p.notes && (
                              <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                                {p.notes}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {Number.isFinite(lat) && Number.isFinite(lng) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onShow();
                                }}
                                title="Visa på kartan"
                              >
                                Visa
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePlace(p._id);
                              }}
                            >
                              Ta bort
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Create form */}
        <Card radius="xl" className="mt-4">
          <CardHeader padding="lg">
            <CardTitle>Lägg till plats</CardTitle>
          </CardHeader>
          <CardContent padding="lg">
            <form onSubmit={createPlace} className="grid gap-3" noValidate>
              <div className="grid gap-2">
                <label htmlFor="name" className="font-medium">
                  Namn
                </label>
                <input
                  id="name"
                  className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30 rounded-lg"
                  placeholder="T.ex. Hemmahamn"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label htmlFor="lat" className="font-medium">
                    Latitud
                  </label>
                  <input
                    id="lat"
                    className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30 rounded-lg"
                    placeholder="59.325000"
                    value={draft.lat}
                    onChange={(e) => setDraft({ ...draft, lat: e.target.value })}
                    inputMode="decimal"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="lng" className="font-medium">
                    Longitud
                  </label>
                  <input
                    id="lng"
                    className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30 rounded-lg"
                    placeholder="18.070000"
                    value={draft.lng}
                    onChange={(e) => setDraft({ ...draft, lng: e.target.value })}
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="notes" className="font-medium">
                  Anteckningar <span className="text-gray-500 font-normal">(valfritt)</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30 rounded-lg"
                  placeholder="Kort beskrivning, förtöjningsinfo, etc."
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDraft({ name: '', lat: 59.325, lng: 18.07, notes: '' })}
                >
                  Rensa
                </Button>
                <Button type="submit">Lägg till plats</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: sticky map on desktop, Card-wrapped; full width on mobile below */}
      <aside className="hidden lg:block sticky top-20 min-w-0 h-[calc(100vh-140px)] overflow-hidden">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={9}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Saved places */}
              {places.map((p) => {
                const lat = p.location?.lat;
                const lng = p.location?.lng;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                return <Marker key={p._id} position={[lat, lng]} title={p.name || ''} />;
              })}

              {/* Draft marker */}
              <Marker position={[center.lat, center.lng]} />

              <MoveTo center={center} />
              <Clicker
                onPick={(ll) =>
                  setDraft((d) => ({
                    ...d,
                    lat: Number(ll.lat).toFixed(6),
                    lng: Number(ll.lng).toFixed(6),
                  }))
                }
              />
            </MapContainer>
          </CardContent>
        </Card>
      </aside>

      {/* Mobile map */}
      <div className="lg:hidden mt-4">
        <Card>
          <CardContent className="p-0" style={{ height: 380 }}>
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={9}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {places.map((p) => {
                const lat = p.location?.lat;
                const lng = p.location?.lng;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                return <Marker key={p._id} position={[lat, lng]} title={p.name || ''} />;
              })}
              <Marker position={[center.lat, center.lng]} />
              <MoveTo center={center} />
              <Clicker
                onPick={(ll) =>
                  setDraft((d) => ({
                    ...d,
                    lat: Number(ll.lat).toFixed(6),
                    lng: Number(ll.lng).toFixed(6),
                  }))
                }
              />
            </MapContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
