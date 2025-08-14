// src/components/TripCard.jsx
export default function TripCard({ trip }) {
  return (
    <div className='trip-card'>
      <h3>
        {trip.start} → {trip.end}
      </h3>
      <p>
        <strong>Starttid:</strong> {trip.startTime}
      </p>
      <p>
        <strong>Sluttid:</strong> {trip.endTime}
      </p>
      {trip.notes && (
        <p>
          <em>{trip.notes}</em>
        </p>
      )}
    </div>
  );
}
