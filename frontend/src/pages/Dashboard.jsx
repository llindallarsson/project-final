// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { getTrips } from "../api/trips";
import TripCard from "../components/TripCard";

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTrips()
      .then((data) => {
        setTrips(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Laddar resor...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1>Dina resor</h1>
      {trips.length === 0 ? (
        <p>Inga resor hittades. Lägg till en resa!</p>
      ) : (
        trips.map((trip) => <TripCard key={trip.id} trip={trip} />)
      )}
    </div>
  );
}
