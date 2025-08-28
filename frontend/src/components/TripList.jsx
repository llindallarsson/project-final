import TripCard from "./TripCard";

/**
 * TripList
 * Renders a list of trips using the shared TripCard component.
 *
 * Props:
 * - trips: Array<Trip> — list of trip objects
 * - onTripClick?: (trip) => void — optional handler when a card is clicked
 * - className?: string — optional extra classes for the <ul>
 */
export default function TripList({ trips = [], onTripClick, className = "" }) {
  // Empty state (consistent with app styling)
  if (!Array.isArray(trips) || trips.length === 0) {
    return (
      <div className='bg-white border border-brand-border/40 p-6 rounded'>
        Inga resor hittades.
      </div>
    );
  }

  // Default navigation if no custom click handler is provided
  const handleClick =
    onTripClick ||
    ((t) => {
      const id = t._id || t.id;
      if (id) window.location.assign(`/trips/${id}`);
    });

  // Sort newest → oldest; fall back to startTime when date is missing
  const sorted = trips
    .slice()
    .sort(
      (a, b) =>
        new Date(b.date || b.startTime || 0) -
        new Date(a.date || a.startTime || 0)
    );

  return (
    <ul className={`grid gap-3 ${className}`}>
      {sorted.map((t) => (
        <li key={t._id || t.id}>
          <TripCard trip={t} onClick={() => handleClick(t)} />
        </li>
      ))}
    </ul>
  );
}
