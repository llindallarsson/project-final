import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../store/auth";

export default function Boats() {
  const token = useAuth((s) => s.token);
  const [boats, setBoats] = useState([]);
  const [form, setForm] = useState({
    name: "",
    model: "",
    lengthM: "",
    notes: "",
  });
  const [error, setError] = useState("");

  async function load() {
    try {
      setBoats(await api("/api/boats", { token }));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [token]);

  async function createBoat(e) {
    e.preventDefault();
    try {
      await api("/api/boats", {
        method: "POST",
        body: {
          ...form,
          lengthM: form.lengthM ? Number(form.lengthM) : undefined,
        },
        token,
      });
      setForm({ name: "", model: "", lengthM: "", notes: "" });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function saveBoat(id, patch) {
    try {
      await api(`/api/boats/${id}`, { method: "PUT", body: patch, token });
      load();
    } catch (e) {
      alert(e.message);
    }
  }
  async function deleteBoat(id) {
    if (!confirm("Delete this boat?")) return;
    try {
      await api(`/api/boats/${id}`, { method: "DELETE", token });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-semibold'>Dina båtar</h2>
      </div>
      {error && <p className='text-red-600 mb-2'>{error}</p>}

      <form
        onSubmit={createBoat}
        className='bg-white p-4 rounded shadow grid grid-cols-4 gap-2 mb-4'
      >
        <input
          className='border p-2 rounded'
          placeholder='Name'
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className='border p-2 rounded'
          placeholder='Model'
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
        />
        <input
          className='border p-2 rounded'
          placeholder='Length (m)'
          value={form.lengthM}
          onChange={(e) => setForm({ ...form, lengthM: e.target.value })}
        />
        <input
          className='border p-2 rounded col-span-3'
          placeholder='Notes'
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className='col-span-1 flex justify-end'>
          <button className='px-3 py-2 rounded bg-blue-600 text-white'>
            Add boat
          </button>
        </div>
      </form>

      <ul className='grid gap-3'>
        {boats.map((b) => (
          <li
            key={b._id}
            className='bg-white p-4 rounded shadow grid grid-cols-4 gap-2 items-start'
          >
            <input
              className='border p-2 rounded'
              defaultValue={b.name}
              onBlur={(e) => saveBoat(b._id, { name: e.target.value })}
            />
            <input
              className='border p-2 rounded'
              defaultValue={b.model || ""}
              onBlur={(e) => saveBoat(b._id, { model: e.target.value })}
            />
            <input
              className='border p-2 rounded'
              defaultValue={b.lengthM ?? ""}
              onBlur={(e) =>
                saveBoat(b._id, {
                  lengthM: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <div className='flex gap-2 items-center'>
              <input
                className='border p-2 rounded grow'
                defaultValue={b.notes || ""}
                onBlur={(e) => saveBoat(b._id, { notes: e.target.value })}
              />
              <button
                className='px-2 py-1 rounded border text-red-600'
                onClick={() => deleteBoat(b._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
