import { useState } from 'react';

import { api } from '../api';
import { useAuth } from '../store/auth';
import PhotoPicker from './PhotoPicker';
import Button from './ui/Button';
import Input from './ui/Input';

export default function BoatForm({
  mode = 'create', // "create" | "edit"
  initialBoat = null, // används när mode === "edit"
  onSaved, // callback(savedBoat)
  onCancel, // valfri cancel-handler
  maxPhotoSizeMB = 10, // storleksvakt för uppladdning
}) {
  const token = useAuth((s) => s.token);

  // --- Form state ---
  const [name, setName] = useState(initialBoat?.name ?? '');
  const [model, setModel] = useState(initialBoat?.model ?? '');
  const [lengthStr, setLengthStr] = useState(
    initialBoat?.lengthM != null ? String(initialBoat.lengthM) : ''
  );
  const [draftStr, setDraftStr] = useState(
    initialBoat?.draftM != null ? String(initialBoat.draftM) : ''
  );
  const [engine, setEngine] = useState(initialBoat?.engine ?? '');
  const [notes, setNotes] = useState(initialBoat?.notes ?? '');
  const [files, setFiles] = useState([]); // vi använder samma PhotoPicker-API som TripForm

  // --- UI state ---
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Locale-säker parsing av decimaltal (tillåter komma)
  const parseNum = (v) => {
    if (v === '' || v == null) return undefined;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  };

  // Bygg payload – multipart om vi har bild
  function buildPayload() {
    const body = {
      name: name.trim(),
      model: model.trim() || undefined,
      lengthM: parseNum(lengthStr),
      draftM: parseNum(draftStr),
      engine: engine.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const file = files?.[0] || null;
    if (file) {
      const fd = new FormData();
      fd.append('data', JSON.stringify(body));
      fd.append('photo', file);
      return { data: fd, isMultipart: true };
    }
    return { data: body, isMultipart: false };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');

    // Klientvalidering
    if (!name.trim()) {
      setErr('Namn är obligatoriskt.');
      return;
    }
    const file = files?.[0];
    if (file && file.size > maxPhotoSizeMB * 1024 * 1024) {
      setErr(`Bilden får max vara ${maxPhotoSizeMB} MB.`);
      return;
    }

    const { data, isMultipart } = buildPayload();

    try {
      setSaving(true);
      const saved =
        mode === 'edit' && initialBoat?._id
          ? await api(`/api/boats/${initialBoat._id}`, {
              method: 'PUT',
              token,
              body: data,
              isMultipart,
            })
          : await api('/api/boats', {
              method: 'POST',
              token,
              body: data,
              isMultipart,
            });

      onSaved?.(saved);
    } catch (e2) {
      setErr(e2.message || 'Kunde inte spara båten.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {/* Top-error (API/validering) */}
      {err && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded border border-red-300 bg-red-50 p-3 text-red-700"
        >
          {err}
        </p>
      )}

      <Input
        label="Namn"
        id="boat-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        error={!name.trim() ? ' ' : undefined /* reservera höjd när tomt */}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Modell"
          id="boat-model"
          placeholder="Albin Cirus 78"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <Input
          label="Längd (m)"
          id="boat-length"
          type="text"
          inputMode="decimal"
          placeholder="t.ex. 7,8"
          value={lengthStr}
          onChange={(e) => setLengthStr(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Djupgående (m)"
          id="boat-draft"
          type="text"
          inputMode="decimal"
          placeholder="t.ex. 1,49"
          value={draftStr}
          onChange={(e) => setDraftStr(e.target.value)}
        />
        <Input
          label="Motor"
          id="boat-engine"
          placeholder="Volvo Penta MD5"
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="boat-notes" className="text-sm font-medium text-gray-800">
          Övrigt
        </label>
        <textarea
          id="boat-notes"
          rows={4}
          className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anteckningar om båten…"
        />
      </div>

      {/* Foto – använd PhotoPicker om du vill ha samma upplevelse som TripForm */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-gray-800">Bild (valfritt)</label>
        <PhotoPicker files={files} onChange={setFiles} maxFiles={1} />
        {files?.[0] && (
          <p className="text-xs text-gray-600">
            Vald fil: <span className="font-medium">{files[0].name}</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Avbryt
          </Button>
        )}
        <Button type="submit" isLoading={saving} disabled={saving}>
          {mode === 'edit' ? 'Uppdatera' : 'Lägg till båt'}
        </Button>
      </div>
    </form>
  );
}
