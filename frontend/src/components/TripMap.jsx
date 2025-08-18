import { useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
} from "react-leaflet";

// Fixa Leaflet-markörernas ikoner (behövs i bundlers som Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ mode, setStart, setEnd, route, setRoute }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (mode === "set-start" && setStart) {
        setStart({ lat, lng });
      } else if (mode === "set-end" && setEnd) {
        setEnd({ lat, lng });
      } else if (mode === "draw" && setRoute) {
        const t = new Date().toISOString();
        setRoute([...(route || []), { lat, lng, t }]);
      }
    },
  });
  return null;
}

/**
 * TripMap
 * Props:
 * - mode: 'view' | 'set-start' | 'set-end' | 'draw'
 * - start: { lat, lng }
 * - end: { lat, lng }
 * - route: [{ lat, lng, t }]
 * - setStart, setEnd, setRoute: setters för interaktion
 * - center: { lat, lng } (default: Stockholm)
 * - zoom: number (default 9)
 * - height: number (px)
 */
export default function TripMap({
  mode = "view",
  start,
  end,
  route = [],
  setStart,
  setEnd,
  setRoute,
  center = { lat: 59.325, lng: 18.07 }, // Stockholm default
  zoom = 9,
  height = 320,
}) {
  const bounds = useMemo(() => {
    const pts = [];
    if (start?.lat && start?.lng) pts.push([start.lat, start.lng]);
    if (end?.lat && end?.lng) pts.push([end.lat, end.lng]);
    if (Array.isArray(route)) route.forEach((p) => pts.push([p.lat, p.lng]));
    return pts.length > 0 ? L.latLngBounds(pts) : null;
  }, [start, end, route]);

  return (
    <div style={{ height }} className='w-full overflow-hidden rounded border'>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        bounds={bounds || undefined}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {start?.lat && start?.lng && (
          <Marker position={[start.lat, start.lng]} />
        )}
        {end?.lat && end?.lng && <Marker position={[end.lat, end.lng]} />}
        {Array.isArray(route) && route.length > 1 && (
          <Polyline positions={route.map((p) => [p.lat, p.lng])} />
        )}

        <ClickHandler
          mode={mode}
          setStart={setStart}
          setEnd={setEnd}
          route={route}
          setRoute={setRoute}
        />
      </MapContainer>
    </div>
  );
}
