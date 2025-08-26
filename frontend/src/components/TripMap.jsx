import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";

// Fix för Leaflet-ikoner (behövs med Vite)
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
 * TripMap (utan auto-zoom)
 *
 * Props:
 * - mode: 'view' | 'set-start' | 'set-end' | 'draw'
 * - start: { lat, lng } | null
 * - end:   { lat, lng } | null
 * - route: [{ lat, lng, t }]
 * - setStart, setEnd, setRoute: optional setters
 * - center: { lat, lng } initialt (default Sthlm)
 * - zoom: number initialt (default 9)
 * - height: number | string (px eller '100%')
 * - className: extra klasser
 * - autoFit: boolean (default false) — vi använder INTE detta här (lämnas för ev. framtid)
 * - showRecenter: boolean (default true) — visar en liten knapp för att centrera manuellt
 */
export default function TripMap({
  mode = "view",
  start,
  end,
  route = [],
  setStart,
  setEnd,
  setRoute,
  center = { lat: 59.325, lng: 18.07 },
  zoom = 9,
  height = 320,
  className = "",
  autoFit = false, // ej använd nu, men kvar om du skulle vilja aktivera framöver
  showRecenter = true,
}) {
  const style = {
    height: typeof height === "number" ? `${height}px` : height || "320px",
    width: "100%",
  };

  const isDrawing = mode === "draw";

  const polylinePositions =
    Array.isArray(route) && route.length > 1
      ? route.map((p) => [p.lat, p.lng])
      : null;

  return (
    <div style={style} className={`w-full overflow-hidden border ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {start?.lat && start?.lng && (
          <Marker position={[start.lat, start.lng]} />
        )}
        {end?.lat && end?.lng && <Marker position={[end.lat, end.lng]} />}

        {polylinePositions && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              weight: 4,
              opacity: 0.9,
              ...(isDrawing ? { dashArray: "6 8" } : {}),
            }}
          />
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
