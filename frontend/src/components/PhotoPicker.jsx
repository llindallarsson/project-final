import { useEffect, useRef, useState } from 'react';

/**
 * PhotoPicker
 * - Controlled component: parent owns `files` (File[]) and updates via `onChange`.
 * - Validates type/size, prevents duplicates, caps at maxFiles.
 * - Creates/revokes object URLs safely on prop change & unmount.
 * - Simple file dialog interface (no drag & drop).
 *
 * UI text is Swedish; comments are in English (per project convention).
 */
export default function PhotoPicker({
  files = [],
  onChange,
  maxFiles = 10,
  maxSizeMB = 10,
  accept = 'image/*,.heic,.heif',
  className = '',
}) {
  const inputRef = useRef(null);

  // Previews are derived from `files` and cleaned up automatically.
  const [previews, setPreviews] = useState([]); // [{ url, name, size, type }]
  const [message, setMessage] = useState(''); // info/warning messages (SV)
  const [error, setError] = useState(''); // validation errors (SV)

  // Build previews and revoke URLs on change/unmount.
  useEffect(() => {
    setError('');
    setMessage('');

    const urls = [];
    const next = files.map((f) => {
      const url = URL.createObjectURL(f);
      urls.push(url);
      return { url, name: f.name, size: f.size, type: f.type || '' };
    });
    setPreviews(next);

    return () => {
      urls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
    };
  }, [files]);

  // Helpers
  const fmtBytes = (n) => {
    if (n == null) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  };
  const keyOf = (f) => `${f.name}|${f.size}|${f.lastModified}`;

  // Core merge logic for file selection
  function mergeIncoming(incoming) {
    if (!incoming?.length) return;

    const maxBytes = maxSizeMB * 1024 * 1024;
    const existingKeys = new Set(files.map(keyOf));

    let accepted = [];
    let skippedTooBig = 0;
    let skippedType = 0;
    let skippedDup = 0;

    for (const f of incoming) {
      // Type guard — accept images + common HEIC/HEIF (browser may not preview, but allowed)
      const isImage = f.type?.startsWith('image/') || /\.(heic|heif)$/i.test(f.name);
      if (!isImage) {
        skippedType++;
        continue;
      }
      // Size guard
      if (f.size > maxBytes) {
        skippedTooBig++;
        continue;
      }
      // Duplicate guard
      const k = keyOf(f);
      if (existingKeys.has(k) || accepted.find((x) => keyOf(x) === k)) {
        skippedDup++;
        continue;
      }
      accepted.push(f);
    }

    // Cap to maxFiles
    const room = Math.max(0, maxFiles - files.length);
    const droppedForCap = Math.max(0, accepted.length - room);
    if (room < accepted.length) accepted = accepted.slice(0, room);

    // Build feedback
    const msgs = [];
    if (skippedType) msgs.push(`${skippedType} fil(er) var inte bilder och hoppades över.`);
    if (skippedTooBig)
      msgs.push(`${skippedTooBig} fil(er) var större än ${maxSizeMB}MB och hoppades över.`);
    if (skippedDup) msgs.push(`${skippedDup} dubblett(er) hoppades över.`);
    if (droppedForCap)
      msgs.push(`${droppedForCap} fil(er) hoppades över p.g.a. max ${maxFiles} bilder.`);

    setError(msgs.join(' '));
    setMessage(''); // clear info if any

    if (accepted.length > 0) {
      onChange([...files, ...accepted]);
    }
    // Reset file input so the same file can be re-picked later
    if (inputRef.current) inputRef.current.value = '';
  }

  // Handlers
  function handleSelect(e) {
    const list = Array.from(e.target.files || []);
    mergeIncoming(list);
  }

  function handleRemoveAt(i) {
    const next = files.slice();
    next.splice(i, 1);
    onChange(next);
    setMessage('Bild borttagen.');
  }

  function handleClearAll() {
    onChange([]);
    setMessage('Alla bilder rensades.');
  }

  return (
    <div className={className}>
      {/* Controls */}
      <div className="flex items-center gap-3">
        <label
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-brand-border bg-white hover:bg-brand-surface-100 cursor-pointer transition-colors text-sm font-medium"
          title="Lägg till bilder"
        >
          Välj bilder
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleSelect}
            className="sr-only"
          />
        </label>

        <span className="text-sm text-gray-600">
          {files.length}/{maxFiles}
        </span>

        {files.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-auto px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            Rensa alla
          </button>
        )}
      </div>

      {/* Feedback */}
      {(error || message) && (
        <p
          className={`mt-3 text-sm ${error ? 'text-red-600' : 'text-green-700'}`}
          role="status"
          aria-live="polite"
        >
          {error || message}
        </p>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {previews.map((p, i) => (
            <figure key={`${p.name}-${i}`} className="relative group">
              <img
                src={p.url}
                alt={p.name}
                className="w-full aspect-square object-cover rounded-lg border border-gray-200 bg-gray-100"
                onError={(e) => {
                  // Hide broken preview and show fallback label
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.classList.remove('hidden');
                }}
                draggable={false}
              />
              {/* Fallback tile (e.g. HEIC not previewable in some browsers) */}
              <div className="hidden w-full aspect-square rounded-lg border border-gray-200 bg-gray-50 grid place-items-center p-2 text-xs text-gray-700">
                <div className="text-center">
                  <div className="font-medium truncate max-w-[90%]" title={p.name}>
                    {p.name}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">{fmtBytes(p.size)}</div>
                </div>
              </div>

              <button
                type="button"
                aria-label={`Ta bort ${p.name}`}
                title="Ta bort"
                onClick={() => handleRemoveAt(i)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs rounded-md bg-white/95 border border-gray-200 shadow-sm hover:bg-white"
              >
                ×
              </button>
            </figure>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Max {maxFiles} bilder, {maxSizeMB}MB per bild. Stödda format: JPG, PNG, GIF, WebP, HEIC,
        HEIF.
      </p>
    </div>
  );
}
