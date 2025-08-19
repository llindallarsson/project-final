import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import TripForm from "../components/TripForm";
import Spinner from "../components/Spinner";

export default function EditTrip() {
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
  if (!trip) return <Spinner label='Laddar resa…' />;

  return <TripForm initialTrip={trip} mode='edit' />;
}
