// src/api/trips.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const getTrips = async () => {
  const res = await fetch(`${API_URL}/api/trips`);
  if (!res.ok) throw new Error("Kunde inte hämta resor");
  return res.json();
};

export const createTrip = async (tripData) => {
  const res = await fetch(`${API_URL}/api/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tripData),
  });
  if (!res.ok) throw new Error("Kunde inte spara resa");
  return res.json();
};
