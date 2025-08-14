import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { useMap } from "react-leaflet";

import "leaflet/dist/leaflet.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Fixar Leaflet-ikoner
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions);
    }
  }, [positions, map]);
  return null;
}

function App() {
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState({
    start: "",
    end: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const [tracking, setTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const watchIdRef = useRef(null);

  // Hämta resor från backend
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/trips`)
      .then((res) => res.json())
      .then((data) => setTrips(data));
  }, []);

  // Formulärändringar
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function getCoordinates(place) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        place
      )}`
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const startCoords = await getCoordinates(form.start);
    const endCoords = await getCoordinates(form.end);

    const tripWithCoords = { ...form, startCoords, endCoords };

    fetch(`${API_URL}/api/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripWithCoords),
    })
      .then((res) => res.json())
      .then((newTrip) => {
        setTrips((prev) => [...prev, newTrip]);
        setForm({ start: "", end: "", startTime: "", endTime: "", notes: "" });
      });
  }

  // Starta realtids-GPS
  function startTracking() {
    if (!navigator.geolocation) {
      alert("Geolocation stöds inte i din webbläsare.");
      return;
    }

    setTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentPosition([latitude, longitude]);
        setRoute((prev) => [...prev, [latitude, longitude]]);
      },
      (err) => {
        console.error("GPS error:", err);
        alert(
          "Kunde inte hämta GPS-position. Kontrollera att platsåtkomst är aktiverad."
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  }

  // Stoppa GPS och spara resa
  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);

    if (route.length > 0) {
      const startCoords = { lat: route[0][0], lon: route[0][1] };
      const endCoords = {
        lat: route[route.length - 1][0],
        lon: route[route.length - 1][1],
      };

      const trip = {
        start: "GPS Start",
        end: "GPS Slut",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        startCoords,
        endCoords,
        route,
      };

      fetch(`${API_URL}/api/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trip),
      })
        .then((res) => res.json())
        .then((newTrip) => {
          setTrips((prev) => [...prev, newTrip]);
          setRoute([]);
        });
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        {!tracking ? (
          <button onClick={startTracking}>Starta GPS-resa</button>
        ) : (
          <button onClick={stopTracking}>Avsluta GPS-resa</button>
        )}
      </div>

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
        center={[59.3293, 18.0686]}
        zoom={12}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {currentPosition && tracking && (
          <>
            <Marker position={currentPosition}>
              <Popup>Du är här</Popup>
            </Marker>
            <Recenter position={currentPosition} />
          </>
        )}

        {route.length > 1 && <Polyline positions={route} color='red' />}

        {/* Historiska resor */}
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
            {trip.route && <Polyline positions={trip.route} color='green' />}
            {!tracking && trip.route && <FitBounds positions={trip.route} />}
          </>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
