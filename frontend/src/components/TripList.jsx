// src/components/TripList.jsx
export default function TripList({ trips }) {
  if (!trips || trips.length === 0) {
    return <p>Inga resor hittades.</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {trips.map((trip) => (
        <li
          key={trip.id || trip._id}
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "#f9f9f9",
          }}
        >
          <strong>{trip.start}</strong> → <strong>{trip.end}</strong>
          <br />
          <small>
            {trip.startTime
              ? new Date(trip.startTime).toLocaleString()
              : "Okänt startdatum"}{" "}
            –{" "}
            {trip.endTime
              ? new Date(trip.endTime).toLocaleString()
              : "Okänt slutdatum"}
          </small>
          {trip.notes && <p style={{ marginTop: "0.5rem" }}>📝 {trip.notes}</p>}
        </li>
      ))}
    </ul>
  );
}
