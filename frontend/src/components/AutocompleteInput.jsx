// src/components/AutocompleteInput.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * AutocompleteInput (Nominatim-backed)
 *
 * Props:
 * - value: string (controlled input)
 * - onChange: (string) => void
 * - onSelect: ({ name, lat, lng }) => void
 * - placeholder?: string
 * - minChars?: number (default 2)
 * - limit?: number (default 5)
 */
export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = "Sök plats…",
  minChars = 2,
  limit = 5,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]); // raw nominatim items
  const [activeIndex, setActiveIndex] = useState(-1);

  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useRef(
    `ac-listbox-${Math.random().toString(36).slice(2)}`
  ).current;

  // Debounced fetch to Nominatim
  useEffect(() => {
    if (!value || value.trim().length < minChars) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({
          q: value.trim(),
          format: "jsonv2",
          addressdetails: "0",
          "accept-language": "sv",
          limit: String(limit),
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${qs.toString()}`,
          { signal: controller.signal, headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data.slice(0, limit) : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Autocomplete fetch failed:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 250); // 250ms debounce

    return () => {
      clearTimeout(t);
      try {
        controller.abort();
      } catch {}
    };
  }, [value, minChars, limit]);

  // Keyboard navigation
  function onKeyDown(e) {
    if (!open || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < items.length) {
        e.preventDefault();
        handlePick(items[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handlePick(place) {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon); // NOTE: Nominatim uses "lon"
    onSelect({ name: place.display_name, lat, lng });
    setOpen(false);
    setItems([]);
    setActiveIndex(-1);
  }

  // Simple highlight of matched substring
  const highlight = useMemo(() => {
    const q = (value || "").trim();
    if (!q) return (s) => s;
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${esc})`, "ig");
    return (s) =>
      s.split(re).map((part, i) =>
        re.test(part) ? (
          <mark key={i} className='bg-yellow-100 rounded px-0.5'>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      );
  }, [value]);

  return (
    <div className='relative'>
      <input
        ref={inputRef}
        type='text'
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => value?.trim().length >= minChars && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-autocomplete='list'
        aria-expanded={open}
        aria-controls={listboxId}
        className='w-full border border-brand-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30'
        autoComplete='off'
      />

      {loading && (
        <div className='absolute top-full left-0 mt-1 text-xs text-gray-600'>
          Laddar…
        </div>
      )}

      {open && items.length > 0 && (
        <ul
          id={listboxId}
          role='listbox'
          className='absolute z-20 mt-1 w-full bg-white border border-brand-border rounded-lg shadow-soft overflow-hidden'
        >
          {items.map((p, idx) => {
            const active = idx === activeIndex;
            return (
              <li
                key={p.place_id}
                role='option'
                aria-selected={active}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  active ? "bg-brand-surface-200" : "hover:bg-brand-surface-200"
                }`}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(p)}
                title={p.display_name}
              >
                <div className='truncate'>{highlight(p.display_name)}</div>
                {p.lat && p.lon && (
                  <div className='text-[11px] text-gray-500'>
                    ({Number(p.lat).toFixed(4)}, {Number(p.lon).toFixed(4)})
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
