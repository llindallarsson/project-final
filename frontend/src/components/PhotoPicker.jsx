import { useEffect, useRef, useState } from "react";

/**
 * PhotoPicker
 * - Controlled component: parent owns `files` (File[]) and updates via `onChange`.
 * - Validates type/size, prevents duplicates, caps at maxFiles.
 * - Creates/revokes object URLs safely on prop change & unmount.
 * - Supports drag & drop in addition to the file dialog.
 *
 * UI text is Swedish; comments are in English (per project convention).
 */
export default function PhotoPicker({
  files = [],
  onChange,
  maxFiles = 10,
  maxSizeMB = 10,
  accept = "image/*,.heic,.heif",
  className = "",
}) {
  const inputRef = useRef(null);

  // Previews are derived from `files` and cleaned up automatically.
  const [previews, setPreviews] = useState([]); // [{ url, name, size, type }]
  const [message, setMessage] = useState(""); // info/warning messages (SV)
  const [error, setError] = useState(""); // validation errors (SV)
  const [dragOver, setDragOver] = useState(false);

  // Build previews and revoke URLs on change/unmount.
  useEffect(() => {
    setError("");
    setMessage("");

    const urls = [];
    const next = files.map((f) => {
      const url = URL.createObjectURL(f);
      urls.push(url);
      return { url, name: f.name, size: f.size, type: f.type || "" };
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
    if (n == null) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  };
  const keyOf = (f) => `${f.name}|${f.size}|${f.lastModified}`;

  // Core merge logic shared by dialog & DnD
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
      const isImage =
        f.type?.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);
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
    if (skippedType)
      msgs.push(`${skippedType} fil(er) var inte bilder och hoppades över.`);
    if (skippedTooBig)
      msgs.push(
        `${skippedTooBig} fil(er) var större än ${maxSizeMB}MB och hoppades över.`
      );
    if (skippedDup) msgs.push(`${skippedDup} dubblett(er) hoppades över.`);
    if (droppedForCap)
      msgs.push(
        `${droppedForCap} fil(er) hoppades över p.g.a. max ${maxFiles} bilder.`
      );

    setError(msgs.join(" "));
    setMessage(""); // clear info if any

    if (accepted.length > 0) {
      onChange([...files, ...accepted]);
    }
    // Reset file input so the same file can be re-picked later
    if (inputRef.current) inputRef.current.value = "";
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
    setMessage("Bild borttagen.");
  }

  function handleClearAll() {
    onChange([]);
    setMessage("Alla bilder rensades.");
  }

  // Drag & drop
  function onDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }
  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer?.files || []);
    mergeIncoming(list);
  }

  return (
    <div className={className}>
      {/* Controls */}
      <div className='flex items-center gap-2'>
        <label
          className='inline-flex items-center justify-center px-3 py-2 rounded border border-brand-border/60 bg-white hover:bg-brand-surface-200 cursor-pointer'
          title='Lägg till bilder'
        >
          Lägg till bilder
          <input
            ref={inputRef}
            type='file'
            accept={accept}
            multiple
            onChange={handleSelect}
            className='sr-only'
          />
        </label>

        <span className='text-xs text-gray-600'>
          Valda: {files.length}/{maxFiles}
        </span>

        {files.length > 0 && (
          <button
            type='button'
            onClick={handleClearAll}
            className='ml-auto px-2 py-1 text-sm rounded border border-brand-border/60 bg-white hover:bg-brand-surface-200'
          >
            Rensa alla
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`mt-2 rounded border border-dashed p-3 text-center text-sm ${
          dragOver
            ? "bg-brand-surface-200 border-brand-primary"
            : "bg-white border-brand-border/60"
        }`}
      >
        Dra och släpp bilder här, eller klicka på “Lägg till bilder”.
      </div>

      {/* Feedback */}
      {(error || message) && (
        <p
          className={`mt-2 text-sm ${
            error ? "text-red-600" : "text-green-700"
          }`}
          role='status'
          aria-live='polite'
        >
          {error || message}
        </p>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className='mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2'>
          {previews.map((p, i) => (
            <figure key={`${p.name}-${i}`} className='relative group'>
              <img
                src={p.url}
                alt={p.name}
                className='w-full aspect-square object-cover rounded border border-brand-border/60 bg-gray-100'
                onError={(e) => {
                  // Hide broken preview and show fallback label
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.classList.remove("hidden");
                }}
                draggable={false}
              />
              {/* Fallback tile (e.g. HEIC not previewable in some browsers) */}
              <div className='hidden w-full aspect-square rounded border border-brand-border/60 bg-gray-50 grid place-items-center p-2 text-xs text-gray-700'>
                <div className='text-center'>
                  <div
                    className='font-medium truncate max-w-[90%]'
                    title={p.name}
                  >
                    {p.name}
                  </div>
                  <div className='text-[11px] text-gray-500 mt-1'>
                    {fmtBytes(p.size)}
                  </div>
                </div>
              </div>

              <button
                type='button'
                aria-label={`Ta bort ${p.name}`}
                title='Ta bort'
                onClick={() => handleRemoveAt(i)}
                className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 text-xs rounded bg-white/95 border border-brand-border/60 shadow'
              >
                Ta bort
              </button>
            </figure>
          ))}
        </div>
      )}

      <p className='mt-2 text-xs text-gray-600'>
        Max {maxFiles} bilder, {maxSizeMB}MB per bild.
      </p>
    </div>
  );
}
