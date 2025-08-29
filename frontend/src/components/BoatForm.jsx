import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../store/auth";

export default function BoatForm({
  mode = "create", // "create" | "edit"
  initialBoat = null, // used when mode === "edit"
  onSaved, // callback(savedBoat)
  onCancel, // optional cancel handler
  maxPhotoSizeMB = 10, // guard large uploads
}) {
  const token = useAuth((s) => s.token);

  // --- Form state ---
  const [name, setName] = useState(initialBoat?.name ?? "");
  const [model, setModel] = useState(initialBoat?.model ?? "");
  const [lengthM, setLengthM] = useState(
    initialBoat?.lengthM != null ? String(initialBoat.lengthM) : ""
  );
  const [draftM, setDraftM] = useState(
    initialBoat?.draftM != null ? String(initialBoat.draftM) : ""
  );
  const [engine, setEngine] = useState(initialBoat?.engine ?? "");
  const [notes, setNotes] = useState(initialBoat?.notes ?? "");
  const [file, setFile] = useState(null);

  // --- UI state ---
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Utility: parse numeric input safely (empty string -> undefined)
  const numOrUndef = (v) => (v === "" ? undefined : Number(v));

  // Utility: build payload, optionally multipart if a photo is selected
  function buildPayload() {
    const body = {
      name: name.trim(),
      model: model.trim() || undefined,
      lengthM: numOrUndef(lengthM),
      draftM: numOrUndef(draftM),
      engine: engine.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (file) {
      const fd = new FormData();
      fd.append("data", JSON.stringify(body));
      fd.append("photo", file);
      return { data: fd, isMultipart: true };
    }
    return { data: body, isMultipart: false };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    // Basic client-side validation
    if (!name.trim()) {
      setErr("Namn är obligatoriskt.");
      return;
    }
    if (file && file.size > maxPhotoSizeMB * 1024 * 1024) {
      setErr(`Bilden får max vara ${maxPhotoSizeMB} MB.`);
      return;
    }

    const { data, isMultipart } = buildPayload();

    try {
      setSaving(true);

      const saved =
        mode === "edit" && initialBoat?._id
          ? await api(`/api/boats/${initialBoat._id}`, {
              method: "PUT",
              token,
              body: data,
              isMultipart,
            })
          : await api("/api/boats", {
              method: "POST",
              token,
              body: data,
              isMultipart,
            });

      onSaved?.(saved);
    } catch (e) {
      setErr(e.message || "Kunde inte spara båten.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-4 bg-white border p-4 md:p-6"
    >
      {/* Error banner */}
      {err && (
        <div
          role="alert"
          className="border border-red-300 bg-red-50 text-red-700 p-3 rounded"
        >
          {err}
        </div>
      )}

      {/* Name */}
      <div className="grid gap-2">
        <label className="font-medium" htmlFor="boat-name">
          Namn
        </label>
        <input
          id="boat-name"
          className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-invalid={!!err && !name.trim()}
          autoComplete="off"
        />
      </div>

      {/* Model & Length */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="font-medium" htmlFor="boat-model">
            Modell
          </label>
          <input
            id="boat-model"
            className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Albin Cirus 78"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-2">
          <label className="font-medium" htmlFor="boat-length">
            Längd (m)
          </label>
          <input
            id="boat-length"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30"
            value={lengthM}
            onChange={(e) => setLengthM(e.target.value)}
            placeholder="t.ex. 7.8"
          />
        </div>
      </div>

      {/* Draft & Engine */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="font-medium" htmlFor="boat-draft">
            Djupgående (m)
          </label>
          <input
            id="boat-draft"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30"
            value={draftM}
            onChange={(e) => setDraftM(e.target.value)}
            placeholder="t.ex. 1.49"
          />
        </div>

        <div className="grid gap-2">
          <label className="font-medium" htmlFor="boat-engine">
            Motor
          </label>
          <input
            id="boat-engine"
            className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30"
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            placeholder="Volvo Penta MD5"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="grid gap-2">
        <label className="font-medium" htmlFor="boat-notes">
          Övrigt
        </label>
        <textarea
          id="boat-notes"
          rows={4}
          className="border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary/30"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anteckningar om båten..."
        />
      </div>

      {/* Photo */}
      <div className="grid gap-2">
        <label className="font-medium" htmlFor="boat-photo">
          Bild (valfritt)
        </label>
        <input
          id="boat-photo"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {file && (
          <p className="text-xs text-gray-600">
            Vald fil: <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={onCancel}
          >
            Avbryt
          </button>
        )}
        <button
          disabled={saving}
          className="px-4 py-2 bg-brand-primary text-white rounded disabled:opacity-60"
        >
          {saving ? "Sparar…" : mode === "edit" ? "Uppdatera" : "Lägg till båt"}
        </button>
      </div>
    </form>
  );
}
