export default function TripCard({ trip }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
        maxWidth: "400px",
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      {trip.image && (
        <img
          src={trip.image}
          alt={trip.destination}
          style={{
            width: "100%",
            height: "200px",
            objectFit: "cover",
            borderRadius: "6px",
            marginBottom: "12px",
          }}
        />
      )}

      <h2 style={{ margin: "0 0 8px" }}>{trip.destination}</h2>

      {trip.date && (
        <p style={{ color: "#666", margin: "0 0 8px" }}>
          📅 {new Date(trip.date).toLocaleDateString()}
        </p>
      )}

      {trip.description && (
        <p style={{ margin: "0", lineHeight: "1.4" }}>{trip.description}</p>
      )}
    </div>
  );
}
