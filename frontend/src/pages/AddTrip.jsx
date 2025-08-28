import { useEffect } from "react";
import TripForm from "../components/TripForm";

export default function AddTrip() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Logga en resa • Vindra";
    return () => {
      document.title = prev;
    };
  }, []);

  return <TripForm mode='create' />;
}
