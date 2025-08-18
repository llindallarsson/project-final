import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";

export default function TripsPage() {
  const token = useAuth((s) => s.token);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/api/trips", { token });
        setTrips(data);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [token]);

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-semibold'>Dina resor</h2>
        <Link
          to='/trips/new'
          className='px-3 py-2 rounded bg-blue-600 text-white'
        >
          + Ny resa
        </Link>
      </div>
      {error && <p className='text-red-600 mb-2'>{error}</p>}
      {trips.length === 0 ? (
        <div className='bg-white p-6 rounded shadow'>
          Inga resor ännu. Skapa din första!
        </div>
      ) : (
        <ul className='grid gap-3'>
          {trips.map((t) => (
            <li key={t._id} className='bg-white p-4 rounded shadow'>
              <Link to={`/trips/${t._id}`} className='block'>
                <h3 className='text-lg font-semibold'>{t.title}</h3>
                <p className='text-sm text-gray-600'>
                  {new Date(t.date).toLocaleDateString()} ·{" "}
                  {t.durationMinutes ?? "-"} min
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
