import { useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
} from "react-leaflet";

/* -----------------------------------------------------------------------------
 * Ensure Leaflet default marker icons work in bundlers like Vite/React
 * Runs only in the browser and only once.
 * ---------------------------------------------------------------------------*/
if (typeof window !== "undefined" && !window.__leaflet_icon_patch_applied) {
  // Guard against repeated merges in strict/dev mode
  // eslint-disable-next-line no-underscore-dangle
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
  window.__leaflet_icon_patch_applied = true;
}

/* -----------------------------------------------------------------------------
 * Internal click handler
 * - set-start: drops/updates start marker
 * - set-end:   drops/updates end marker
 * - draw:      appends a point to the route (and right-click removes last)
 * ---------------------------------------------------------------------------*/
function ClickHandler({ mode, setStart, setEnd, route, setRoute }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (mode === "set-start" && typeof setStart === "function") {
        setStart({ lat, lng });
      } else if (mode === "set-end" && typeof setEnd === "function") {
        setEnd({ lat, lng });
      } else if (mode === "draw" && typeof setRoute === "function") {
        const t = new Date().toISOString();
        setRoute([...(route || []), { lat, lng, t }]);
      }
    },
    // Optional: right-click = undo last point while drawing
    contextmenu() {
      if (mode !== "draw" || !Array.isArray(route) || route.length === 0)
        return;
      if (typeof setRoute === "function") {
        setRoute(route.slice(0, -1));
      }
    },
  });
  return null;
}

/**
 * TripMap — simple Leaflet map without auto-fit/auto-zoom.
 *
 * Props
 * - mode: 'view' | 'set-start' | 'set-end' | 'draw'
 * - start: { lat: number, lng: number } | null
 * - end:   { lat: number, lng: number } | null
 * - route: Array<{ lat: number, lng: number, t?: string }>
 * - setStart?: (p) => void
 * - setEnd?: (p) => void
 * - setRoute?: (arr) => void
 * - center?: { lat: number, lng: number }    // initial center (default: Stockholm)
 * - zoom?: number                             // initial zoom (default: 9)
 * - height?: number | string                  // px number or CSS size ('100%')
 * - className?: string
 * - autoFit?: boolean (kept for compatibility; not used)
 * - showRecenter?: boolean (kept for compatibility; not used)
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
  // compatibility placeholders (not used)
  autoFit = false, // eslint-disable-line no-unused-vars
  showRecenter = true, // eslint-disable-line no-unused-vars
}) {
  // Compose container inline height once
  const style = {
    height: typeof height === "number" ? `${height}px` : height || "320px",
    width: "100%",
  };

  const isDrawing = mode === "draw";
  const isPicking = mode === "set-start" || mode === "set-end";

  // Memoize polyline positions so we don't remap on every render
  const polylinePositions = useMemo(() => {
    if (!Array.isArray(route) || route.length < 2) return null;
    return route.map((p) => [p.lat, p.lng]);
  }, [route]);

  const containerClasses = [
    "w-full overflow-hidden border",
    // subtle rounded corners for consistency with cards
    "rounded",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  // Cursor hints for interactive modes
  const cursorStyle =
    isDrawing || isPicking
      ? { cursor: isDrawing ? "crosshair" : "pointer" }
      : {};

  return (
    <div style={{ ...style, ...cursorStyle }} className={containerClasses}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        // No auto-fit: we deliberately avoid `bounds` so user keeps control while drawing
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {start?.lat != null && start?.lng != null && (
          <Marker position={[start.lat, start.lng]} />
        )}

        {end?.lat != null && end?.lng != null && (
          <Marker position={[end.lat, end.lng]} />
        )}

        {polylinePositions && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              weight: 4,
              opacity: 0.9,
              // Show dashes while drawing to convey "in-progress"
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
