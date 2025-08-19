import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import TripMap from "../components/TripMap";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardContent } from "../components/ui/Card";

const BASE = import.meta.env.VITE_API_URL || "";

export default function TripDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = useAuth((s) => s.token);
  const [trip, setTrip] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/api/trips/${id}`, { token });
        setTrip(data);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id, token]);

  async function handleDelete() {
    if (!confirm("Delete this trip?")) return;
    try {
      await api(`/api/trips/${id}`, { method: "DELETE", token });
      nav("/");
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  if (err) return <p className='text-red-600'>{err}</p>;
  if (!trip) return <p>Laddar…</p>;

  return (
    <div className='max-w-4xl mx-auto space-y-4'>
      <div className='flex items-center justify-between'>
        <h1>{trip.title}</h1>
        <div className='flex gap-2'>
          <Link to={`/trips/${trip._id}/edit`}>
            <Button variant='secondary'>Edit</Button>
          </Link>
          <Button variant='danger' onClick={handleDelete}>
            Delete
          </Button>
          <Link to='/'>
            <Button variant='ghost'>← Back</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3>Översikt</h3>
        </CardHeader>
        <CardContent className='grid gap-2'>
          <div className='text-sm text-gray-700'>
            Datum: <strong>{new Date(trip.date).toLocaleString()}</strong>
          </div>
          <div className='text-sm text-gray-700'>
            Tid: <strong>{trip.durationMinutes ?? "-"} min</strong>
          </div>
          {trip.crew?.length > 0 && (
            <div className='text-sm text-gray-700'>
              Besättning: <strong>{trip.crew.join(", ")}</strong>
            </div>
          )}
          {(trip.wind?.dir || trip.wind?.speedKn) && (
            <div className='text-sm text-gray-700'>
              Vind:{" "}
              <strong>
                {trip.wind?.dir || ""}{" "}
                {trip.wind?.speedKn ? `${trip.wind.speedKn} kn` : ""}
              </strong>
            </div>
          )}
          {trip.notes && <p className='mt-2'>{trip.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3>Karta</h3>
        </CardHeader>
        <CardContent>
          <TripMap
            mode='view'
            start={trip.start}
            end={trip.end}
            route={trip.route}
            height={360}
          />
        </CardContent>
      </Card>

      {trip.photos?.length > 0 && (
        <Card>
          <CardHeader>
            <h3>Bilder</h3>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
              {trip.photos.map((p, i) => (
                <img
                  key={i}
                  src={`${BASE}${p}`}
                  alt={`Foto från ${new Date(trip.date).toLocaleDateString()}`}
                  className='w-full h-40 object-cover rounded-xl border'
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
