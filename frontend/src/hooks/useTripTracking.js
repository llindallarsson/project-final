import { useRef, useState } from "react";

export function useTripTracking(onTripComplete) {
  const [tracking, setTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const watchIdRef = useRef(null);

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
        alert("Kunde inte hämta GPS-position.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);

    if (route.length > 0) {
      const trip = {
        start: "GPS Start",
        end: "GPS Slut",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        startCoords: { lat: route[0][0], lon: route[0][1] },
        endCoords: { lat: route.at(-1)[0], lon: route.at(-1)[1] },
        route,
      };
      onTripComplete(trip);
      setRoute([]);
    }
  }

  return { tracking, currentPosition, route, startTracking, stopTracking };
}
