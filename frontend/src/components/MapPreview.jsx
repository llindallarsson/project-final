import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";

// One-time Leaflet default icon patch (safe in bundlers like Vite)
if (!L.Icon.Default.prototype._vindraPatched) {
  // mark as patched
  L.Icon.Default.prototype._vindraPatched = true;
  // ensure URLs are set when bundling assets from CDN
  // (do this once globally to avoid duplicate work per render)
  // eslint-disable-next-line no-underscore-dangle
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

/**
 * Non-interactive map preview for trip cards and small embeds.
 * Renders start/end markers and an optional polyline. Pans/zooms to fit.
 */
export default function MapPreview({
  start,
  end,
  route = [],
  height = 120,
  className = "",
  padding = [12, 12],
  lineOptions = {},
}) {
  const bounds = useMemo(() => {
    const pts = [];
    if (start?.lat && start?.lng) pts.push([start.lat, start.lng]);
    if (end?.lat && end?.lng) pts.push([end.lat, end.lng]);
    if (Array.isArray(route)) {
      for (const p of route) if (p?.lat && p?.lng) pts.push([p.lat, p.lng]);
    }
    // Fallback: Stockholm-ish
    return pts.length ? L.latLngBounds(pts) : L.latLngBounds([[59.325, 18.07]]);
  }, [start, end, route]);

  return (
    <div style={{ height }} className={`w-full overflow-hidden ${className}`}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={false}
        keyboard={false}
        style={{ height: "100%", width: "100%", pointerEvents: "none" }}
        aria-label='Trip map preview'
      >
        <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        {start?.lat && start?.lng && (
          <Marker position={[start.lat, start.lng]} />
        )}
        {end?.lat && end?.lng && <Marker position={[end.lat, end.lng]} />}
        {route?.length > 1 && (
          <Polyline
            positions={route.map((p) => [p.lat, p.lng])}
            pathOptions={{ weight: 3, opacity: 0.9, ...lineOptions }}
          />
        )}
      </MapContainer>
    </div>
  );
}
