import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";

// Fixa default-ikoner i bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapPreview({
  start,
  end,
  route = [],
  height = 120,
  className = "",
}) {
  const bounds = useMemo(() => {
    const pts = [];
    if (start?.lat && start?.lng) pts.push([start.lat, start.lng]);
    if (end?.lat && end?.lng) pts.push([end.lat, end.lng]);
    if (Array.isArray(route)) route.forEach((p) => pts.push([p.lat, p.lng]));
    return pts.length ? L.latLngBounds(pts) : L.latLngBounds([[59.325, 18.07]]);
  }, [start, end, route]);

  return (
    <div style={{ height }} className={`w-full overflow-hidden ${className}`}>
      <MapContainer
        bounds={bounds}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%", pointerEvents: "none" }}
      >
        <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        {start?.lat && start?.lng && (
          <Marker position={[start.lat, start.lng]} />
        )}
        {end?.lat && end?.lng && <Marker position={[end.lat, end.lng]} />}
        {route?.length > 1 && (
          <Polyline positions={route.map((p) => [p.lat, p.lng])} />
        )}
      </MapContainer>
    </div>
  );
}
