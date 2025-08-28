import { memo, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  LayerGroup,
  useMap,
} from "react-leaflet";

/** Ensure Leaflet default marker icons once (idempotent for Vite/React) */
let _iconsPatched = false;
function ensureLeafletIcons() {
  if (_iconsPatched) return;
  try {
    if (L?.Icon?.Default?.prototype?._getIconUrl) {
      // Some bundlers need this deleted so mergeOptions works
      delete L.Icon.Default.prototype._getIconUrl;
    }
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
    _iconsPatched = true;
  } catch {
    /* no-op */
  }
}

/** Normalize a single point into [lat, lng] or return null */
function toPair(p) {
  if (!p) return null;
  if (Array.isArray(p) && p.length >= 2) {
    const lat = Number(p[0]);
    const lng = Number(p[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  }
  const lat = p.lat ?? p.latitude;
  const lng = p.lng ?? p.lon ?? p.longitude;
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

/** Normalize an array of points into [[lat, lng], ...] */
function toPolylinePositions(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const pt of arr) {
    const pair = toPair(pt);
    if (pair) out.push(pair);
  }
  return out;
}

/** Compute a LatLngBounds from trips, a live route, and an optional current point */
function computeBounds(trips = [], liveRoute = [], currentPair = null) {
  const pts = [];
  if (currentPair) pts.push(currentPair);
  if (liveRoute.length) pts.push(...liveRoute);
  for (const t of trips) {
    const s = toPair(t.startCoords || t.start);
    const e = toPair(t.endCoords || t.end);
    const r = toPolylinePositions(t.route);
    if (s) pts.push(s);
    if (e) pts.push(e);
    if (r.length) pts.push(...r);
  }
  return pts.length ? L.latLngBounds(pts) : null;
}

/** Handles auto-fit and tracking recenter without external components */
function AutoViewport({ tracking, currentPair, bounds }) {
  const map = useMap();
  const lastFitHashRef = useRef("");

  useEffect(() => {
    // When tracking: follow current position if available
    if (tracking && currentPair) {
      const currentZoom = map.getZoom();
      const targetZoom = Math.max(currentZoom, 13); // keep or bump zoom
      map.flyTo(currentPair, targetZoom, { animate: true, duration: 0.75 });
      return;
    }

    // When NOT tracking: fit bounds once-per-change
    if (!tracking && bounds) {
      const hash = `${bounds.getSouth()}|${bounds.getWest()}|${bounds.getNorth()}|${bounds.getEast()}`;
      if (hash !== lastFitHashRef.current) {
        lastFitHashRef.current = hash;
        map.fitBounds(bounds, { padding: [24, 24] });
      }
    }
  }, [tracking, currentPair, bounds, map]);

  return null;
}

/**
 * MapView (standalone)
 *
 * Props:
 * - trips: Array of trips; each may contain:
 *   { start/startCoords, end/endCoords, route: Array<Point>, _id/id }
 * - currentPosition: [lat,lng] or {lat,lng} for user's live location
 * - tracking: boolean — when true, the map follows currentPosition
 * - route: live route array to draw while tracking
 * - height: number | string (default 400) — container height
 * - className: extra class names for outer container
 * - autoFit: boolean (default true) — fit bounds when not tracking
 * - initialCenter: {lat,lng} fallback center (default Stockholm)
 * - initialZoom: number (default 12)
 */
function MapView({
  trips = [],
  currentPosition = null,
  tracking = false,
  route = [],
  height = 400,
  className = "",
  autoFit = true,
  initialCenter = { lat: 59.3293, lng: 18.0686 },
  initialZoom = 12,
}) {
  ensureLeafletIcons();

  const style = {
    height: typeof height === "number" ? `${height}px` : height,
    width: "100%",
  };

  const currentPair = useMemo(() => toPair(currentPosition), [currentPosition]);
  const liveRoute = useMemo(() => toPolylinePositions(route), [route]);

  // Only compute global bounds when not tracking (to avoid fighting recenter)
  const bounds = useMemo(() => {
    if (!autoFit || tracking) return null;
    return computeBounds(trips, liveRoute, currentPair);
  }, [autoFit, tracking, trips, liveRoute, currentPair]);

  return (
    <div
      className={`w-full overflow-hidden rounded border border-brand-border/40 ${className}`}
      style={style}
    >
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={initialZoom}
        bounds={bounds || undefined}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {/* Auto viewport behavior (fit bounds or follow position) */}
        <AutoViewport
          tracking={tracking}
          currentPair={currentPair}
          bounds={bounds}
        />

        {/* Current user position (on top) */}
        {currentPair && tracking && (
          <Marker position={currentPair} zIndexOffset={1000}>
            <Popup>Du är här</Popup>
          </Marker>
        )}

        {/* Live route (dashed) */}
        {liveRoute.length > 1 && (
          <Polyline
            positions={liveRoute}
            pathOptions={{
              color: "red",
              weight: 4,
              opacity: 0.95,
              dashArray: "4 6",
            }}
          />
        )}

        {/* Historical trips */}
        {trips.map((trip, idx) => {
          const key = trip._id || trip.id || `trip-${idx}`;
          const startPair = toPair(trip.startCoords || trip.start);
          const endPair = toPair(trip.endCoords || trip.end);
          const tripRoute = toPolylinePositions(trip.route);

          return (
            <LayerGroup key={key}>
              {startPair && (
                <Marker position={startPair}>
                  <Popup>
                    Start:{" "}
                    {trip.start?.name ||
                      trip.start?.label ||
                      trip.start ||
                      "Start"}
                  </Popup>
                </Marker>
              )}
              {endPair && (
                <Marker position={endPair}>
                  <Popup>
                    Slut:{" "}
                    {trip.end?.name || trip.end?.label || trip.end || "Mål"}
                  </Popup>
                </Marker>
              )}
              {tripRoute.length > 1 && (
                <Polyline
                  positions={tripRoute}
                  pathOptions={{ color: "green", weight: 3, opacity: 0.8 }}
                />
              )}
            </LayerGroup>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default memo(MapView);
