import { useEffect, useState } from "react";

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Hämtar förslag från Nominatim
  useEffect(() => {
    if (!value) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(data.slice(0, 5)); // Max 5 förslag
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();

    return () => controller.abort();
  }, [value]);

  const handleSelect = (place) => {
    onSelect({
      name: place.display_name,
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
    });
    setSuggestions([]);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete='off'
      />
      {loading && (
        <div style={{ position: "absolute", top: "100%", left: 0 }}>
          Laddar...
        </div>
      )}
      {suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ccc",
            listStyle: "none",
            margin: 0,
            padding: 0,
            zIndex: 10,
          }}
        >
          {suggestions.map((place) => (
            <li
              key={place.place_id}
              style={{ padding: "0.5rem", cursor: "pointer" }}
              onClick={() => handleSelect(place)}
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
