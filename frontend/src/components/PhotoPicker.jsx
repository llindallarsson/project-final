import { useEffect, useRef, useState } from "react";

export default function PhotoPicker({
  files = [],
  onChange,
  maxFiles = 10,
  maxSizeMB = 10,
}) {
  // Förhandsvisningar via object URLs
  const [previews, setPreviews] = useState([]); // [{url, name, size}]
  const urlsRef = useRef([]); // spårar skapade URLs

  useEffect(() => {
    // Rensa gamla URLs (säkerhetsnät). Vi revokar dessutom per-bild onLoad.
    urlsRef.current.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    urlsRef.current = [];

    const next = files.map((f) => {
      const url = URL.createObjectURL(f);
      urlsRef.current.push(url);
      return { url, name: f.name, size: f.size };
    });
    setPreviews(next);
  }, [files]);

  function handleSelect(e) {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;

    const tooBig = incoming.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (tooBig) {
      alert(`Each file must be <= ${maxSizeMB}MB`);
      return;
    }
    const merged = [...files, ...incoming].slice(0, maxFiles);
    onChange(merged);
    // Tillåt samma fil igen om användaren ångrar sig
    e.target.value = "";
  }

  function removeAt(i) {
    const next = files.slice();
    next.splice(i, 1);
    onChange(next);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <input type='file' accept='image/*' multiple onChange={handleSelect} />
        {files.length > 0 && (
          <button
            type='button'
            className='px-2 py-1 text-sm rounded border'
            onClick={clearAll}
          >
            Clear all ({files.length})
          </button>
        )}
      </div>

      <div className='grid grid-cols-3 gap-2'>
        {previews.map((p, i) => (
          <div key={i} className='relative'>
            <img
              src={p.url}
              alt={p.name}
              className='w-full h-24 object-cover rounded border'
              // Revoke när bilden är laddad (undviker för tidig revoke i Strict Mode)
              onLoad={() => {
                try {
                  URL.revokeObjectURL(p.url);
                } catch {}
              }}
              onError={(e) => {
                // Fallback om format ej stöds (t.ex. HEIC i vissa browsers)
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div
              className='hidden w-full h-24 rounded border items-center justify-center text-xs text-gray-600 bg-gray-50'
              aria-hidden='true'
            >
              {p.name}
            </div>
            <button
              type='button'
              className='absolute top-1 right-1 bg-white/90 px-2 py-0.5 text-xs rounded border'
              onClick={() => removeAt(i)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <p className='text-xs text-gray-600'>
        Max {maxFiles} images, {maxSizeMB}MB each.
      </p>
    </div>
  );
}
