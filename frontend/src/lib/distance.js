// /Users/lasln/Technigo/project-final/frontend/src/lib/distance.js
const toRad = (x) => (x * Math.PI) / 180;

function isPoint(p) {
  const lat = Number(p?.lat);
  const lng = Number(p?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function haversineNm(a, b) {
  if (!isPoint(a) || !isPoint(b)) return 0;

  const lat1 = Number(a.lat);
  const lng1 = Number(a.lng);
  const lat2 = Number(b.lat);
  const lng2 = Number(b.lng);

  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return (2 * R * Math.asin(Math.sqrt(h))) / 1852; // meters -> NM
}

export function estimateDistanceNm(trip) {
  if (!trip) return 0;
  if (Number.isFinite(trip.distanceNm)) return Number(trip.distanceNm);

  const route = Array.isArray(trip.route) ? trip.route : [];
  if (route.length > 1) {
    let sum = 0;
    for (let i = 1; i < route.length; i++) sum += haversineNm(route[i - 1], route[i]);
    return sum;
  }

  if (isPoint(trip.start) && isPoint(trip.end)) return haversineNm(trip.start, trip.end);
  return 0;
}
