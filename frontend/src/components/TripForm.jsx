// src/components/TripForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { api } from "../api";

export default function TripForm() {
  const nav = useNavigate();
  const token = useAuth((s) => s.token);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Title is required");
    if (!date) return setError("Date is required");

    const body = {
      title: title.trim(),
      date: new Date(date).toISOString(),
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      notes: notes || undefined,
    };

    try {
      await api("/api/trips", { method: "POST", body, token });
      nav("/"); // tillbaka till listan
    } catch (err) {
      setError(err.message || "Failed to save trip");
    }
  }

  return (
    <div className='max-w-2xl mx-auto'>
      <h2 className='text-2xl font-semibold mb-4'>New Trip</h2>
      {error && <p className='mb-3 text-red-600'>{error}</p>}

      <form
        onSubmit={onSubmit}
        className='grid gap-4 bg-white p-6 rounded shadow'
      >
        <div className='grid gap-2'>
          <label className='font-medium' htmlFor='title'>
            Title
          </label>
          <input
            id='title'
            className='border p-2 rounded'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='date'>
              Date
            </label>
            <input
              id='date'
              type='date'
              className='border p-2 rounded'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className='grid gap-2'>
            <label className='font-medium' htmlFor='dur'>
              Duration (minutes)
            </label>
            <input
              id='dur'
              type='number'
              min='0'
              className='border p-2 rounded'
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
        </div>

        <div className='grid gap-2'>
          <label className='font-medium' htmlFor='notes'>
            Notes
          </label>
          <textarea
            id='notes'
            rows={4}
            className='border p-2 rounded'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className='flex gap-2 justify-end'>
          <button
            type='button'
            className='px-4 py-2 rounded border'
            onClick={() => nav(-1)}
          >
            Cancel
          </button>
          <button className='px-4 py-2 rounded bg-blue-600 text-white'>
            Save Trip
          </button>
        </div>
      </form>
    </div>
  );
}
