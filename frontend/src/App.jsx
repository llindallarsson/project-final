import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function App() {
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState({
    start: "",
    end: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  // Hämta resor från backend
  useEffect(() => {
    fetch("http://localhost:3000/api/trips")
      .then((res) => res.json())
      .then((data) => setTrips(data));
  }, []);

  // Hantera formulärändringar
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Funktion för att hämta koordinater från Nominatim
  async function getCoordinates(place) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        place
      )}`
    );
    const data = await res.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Hämta koordinater för start och slut
    const startCoords = await getCoordinates(form.start);
    const endCoords = await getCoordinates(form.end);

    const tripWithCoords = {
      ...form,
      startCoords,
      endCoords,
    };

    fetch("http://localhost:3000/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripWithCoords),
    })
      .then((res) => res.json())
      .then((newTrip) => {
        setTrips((prev) => [...prev, newTrip]);
        setForm({
          start: "",
          end: "",
          startTime: "",
          endTime: "",
          notes: "",
        });
      });
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>⛵ Min Seglingsloggbok</h1>

      {/* Formulär */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <input
          name='start'
          placeholder='Startdestination'
          value={form.start}
          onChange={handleChange}
        />
        <input
          name='end'
          placeholder='Slutdestination'
          value={form.end}
          onChange={handleChange}
        />
        <input
          type='datetime-local'
          name='startTime'
          value={form.startTime}
          onChange={handleChange}
        />
        <input
          type='datetime-local'
          name='endTime'
          value={form.endTime}
          onChange={handleChange}
        />
        <textarea
          name='notes'
          placeholder='Anteckningar'
          value={form.notes}
          onChange={handleChange}
        />
        <button type='submit'>Spara resa</button>
      </form>

      {/* Lista */}
      <h2>Tidigare resor</h2>
      <ul>
        {trips.map((trip) => (
          <li key={trip.id}>
            <strong>{trip.start}</strong> → <strong>{trip.end}</strong>
            <br />
            {trip.startTime} – {trip.endTime}
            {trip.notes && <p>📝 {trip.notes}</p>}
          </li>
        ))}
      </ul>

      {/* Karta */}
      <h2>Karta</h2>
      <MapContainer
        center={[59.3293, 18.0686]} // Stockholm default
        zoom={5}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {trips.map((trip) => (
          <>
            {trip.startCoords && (
              <Marker position={[trip.startCoords.lat, trip.startCoords.lon]}>
                <Popup>Start: {trip.start}</Popup>
              </Marker>
            )}
            {trip.endCoords && (
              <Marker position={[trip.endCoords.lat, trip.endCoords.lon]}>
                <Popup>Slut: {trip.end}</Popup>
              </Marker>
            )}
          </>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
