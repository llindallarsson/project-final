import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import TripMap from "../components/TripMap";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function TripDetails() {
  const { id } = useParams();
  const token = useAuth((s) => s.token);
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/api/trips/${id}`, { token });
        setTrip(data);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id, token]);

  if (error) return <p className='text-red-600'>{error}</p>;
  if (!trip) return <p>Laddar…</p>;

  const crewLine = (trip.crew || []).join(", ");

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-semibold'>{trip.title}</h2>
        <Link to='/' className='text-sm underline'>
          ← Tillbaka
        </Link>
      </div>
      <p className='text-sm text-gray-600 mb-2'>
        {new Date(trip.date).toLocaleDateString()} ·{" "}
        {trip.durationMinutes ?? "-"} min
      </p>
      {crewLine && (
        <p className='mb-2'>
          <span className='font-medium'>Besättning:</span> {crewLine}
        </p>
      )}
      {trip.wind && (trip.wind.dir || trip.wind.speedKn) && (
        <p className='mb-2'>
          <span className='font-medium'>Vind:</span> {trip.wind.dir || "-"} ·{" "}
          {trip.wind.speedKn ?? "-"} kn
        </p>
      )}
      {trip.notes && <p className='mb-4 whitespace-pre-wrap'>{trip.notes}</p>}

      <div className='mb-4'>
        <TripMap
          mode='view'
          start={trip.start}
          end={trip.end}
          route={trip.route || []}
          height={320}
        />
      </div>

      {Array.isArray(trip.photos) && trip.photos.length > 0 && (
        <div className='grid grid-cols-3 gap-2'>
          {trip.photos.map((src, idx) => (
            <img
              key={idx}
              src={`${API_BASE}${src}`}
              alt='trip'
              className='w-full h-28 object-cover rounded border'
            />
          ))}
        </div>
      )}
    </div>
  );
}
