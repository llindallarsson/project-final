import { useEffect, useState } from "react";

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

  // Skicka ny resa till backend
  function handleSubmit(e) {
    e.preventDefault();
    fetch("http://localhost:3000/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

      {/* Lista av resor */}
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
    </div>
  );
}

export default App;
