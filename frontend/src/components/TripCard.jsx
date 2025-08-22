import MapPreview from "./MapPreview";

function capFirst(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDateSv(d) {
  const dt = new Date(d);
  const weekday = dt.toLocaleDateString("sv-SE", { weekday: "long" });
  const day = dt.toLocaleDateString("sv-SE", { day: "numeric" });
  const month = dt.toLocaleDateString("sv-SE", { month: "long" });
  return `${capFirst(weekday)} ${day} ${month}`;
}

function formatDur(min) {
  if (!min && min !== 0) return "–";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function haversineNm(a, b) {
  // a/b = {lat,lng} i grader. 1 sjömil = 1852 m
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000; // m
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const d = 2 * R * Math.asin(Math.sqrt(h)); // meter
  return d / 1852; // NM
}

function estimateDistanceNm(trip) {
  // Prioritet: route → start/end → 0
  if (trip?.route?.length > 1) {
    let sum = 0;
    for (let i = 1; i < trip.route.length; i++) {
      sum += haversineNm(trip.route[i - 1], trip.route[i]);
    }
    return sum;
  }
  if (trip?.start?.lat && trip?.end?.lat) {
    return haversineNm(trip.start, trip.end);
  }
  return 0;
}

export default function TripCard({ trip, onClick }) {
  const nm = estimateDistanceNm(trip);
  const nmText = `${nm.toFixed(2)} NM`;

  return (
    <article
      className='bg-white border border-brand-border/40 overflow-hidden'
      role='button'
      onClick={onClick}
    >
      <div className='px-4 pt-4'>
        <p className='text-xs text-gray-500'>{formatDateSv(trip.date)}</p>

        <h3 className='text-lg font-semibold mt-1'>{trip.title || "Resa"}</h3>

        <div className='grid grid-cols-2 gap-6 mt-3'>
          <div>
            <p className='text-xs text-gray-500'>Start</p>
            <p className='font-medium'>{trip.start?.name || "—"}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500'>Stopp</p>
            <p className='font-medium'>{trip.end?.name || "—"}</p>
          </div>
        </div>

        <div className='flex items-center gap-6 mt-3 text-sm'>
          <span className='inline-flex items-center gap-2'>
            <span className='h-2.5 w-2.5 rounded-full bg-gray-300' />
            <span className='font-semibold'>
              {formatDur(trip.durationMinutes)}
            </span>
          </span>
          <span className='inline-flex items-center gap-2'>
            <span className='h-2.5 w-2.5 rounded-full bg-gray-300' />
            <span className='font-semibold'>{nmText}</span>
          </span>
        </div>
      </div>

      {/* Karta längst ned i kortet */}
      <div className='mt-4'>
        <MapPreview
          start={trip.start}
          end={trip.end}
          route={trip.route}
          height={110}
        />
      </div>
    </article>
  );
}
