import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import TripForm from "../components/TripForm";

export default function EditTrip() {
  const { id } = useParams();
  const token = useAuth((s) => s.token);

  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch trip by id, safely handling unmounts and errors
  async function fetchTrip() {
    setLoading(true);
    setError("");
    let cancelled = false;

    try {
      const data = await api(`/api/trips/${id}`, { token });
      if (!cancelled) setTrip(data);
    } catch (e) {
      if (!cancelled) setError(e?.message || "Kunde inte hämta resa.");
    } finally {
      if (!cancelled) setLoading(false);
    }

    // Return a cleanup function to mark this run as cancelled
    return () => {
      cancelled = true;
    };
  }

  useEffect(() => {
    // Kick off the fetch; cleanup prevents state updates after unmount
    let cleanup;
    (async () => {
      cleanup = await fetchTrip();
    })();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  if (loading) {
    return (
      <div className='max-w-3xl mx-auto'>
        <div className='bg-white border p-6'>
          <div className='animate-pulse space-y-3'>
            <div className='h-6 w-40 bg-gray-200' />
            <div className='h-4 w-72 bg-gray-200' />
            <div className='h-28 w-full bg-gray-100' />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='max-w-3xl mx-auto'>
        <div className='bg-red-50 border border-red-300 text-red-700 p-4'>
          <p className='mb-3'>{error}</p>
          <button
            type='button'
            onClick={fetchTrip}
            className='px-3 py-1.5 rounded border border-red-300 bg-white'
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className='max-w-3xl mx-auto'>
        <div className='bg-white border p-6'>Resan hittades inte.</div>
      </div>
    );
  }

  // Reuse the TripForm in edit mode with prefilled data
  return <TripForm initialTrip={trip} mode='edit' />;
}
