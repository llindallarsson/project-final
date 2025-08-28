// Boat details page: loads a single boat, shows summary stats and fields,
// supports inline edit via <BoatForm />, and delete with confirmation.

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import BoatForm from "../components/BoatForm";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";

/* ---------- Distance helpers (nautical miles) ---------- */
const toRad = (x) => (x * Math.PI) / 180;
function haversineNm(a, b) {
  // a/b = { lat, lng } in degrees. 1 NM = 1852 m
  const Rm = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return (2 * Rm * Math.asin(Math.sqrt(h))) / 1852;
}
function estimateDistanceNm(trip) {
  if (trip?.route?.length > 1) {
    let s = 0;
    for (let i = 1; i < trip.route.length; i++) {
      s += haversineNm(trip.route[i - 1], trip.route[i]);
    }
    return s;
  }
  if (trip?.start?.lat && trip?.end?.lat)
    return haversineNm(trip.start, trip.end);
  return 0;
}

/* ---------- Component ---------- */
export default function BoatDetails() {
  const { id } = useParams();
  const token = useAuth((s) => s.token);
  const nav = useNavigate();

  const [boat, setBoat] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [err, setErr] = useState("");

  // Resolve base URL for relative photo paths (same approach as TripDetails)
  const apiBase =
    import.meta.env.VITE_API_URL ??
    (location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:8080"
      : "https://vindra.onrender.com");

  // Normalizes any photo field to an absolute URL
  function photoUrl(raw) {
    if (!raw) return "";
    const u = typeof raw === "string" ? raw : raw.url || raw.path || "";
    if (!u) return "";
    return u.startsWith("http")
      ? u
      : `${apiBase}${u.startsWith("/") ? "" : "/"}${u}`;
  }

  // Load boat and its trips
  async function load() {
    try {
      setErr("");
      setLoading(true);
      const [b, ts] = await Promise.all([
        api(`/api/boats/${id}`, { token }),
        api("/api/trips", { token }),
      ]);
      setBoat(b || null);
      setTrips((ts || []).filter((t) => t.boatId === id));
    } catch (e) {
      setErr(e.message || "Kunde inte ladda båten.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  // Aggregate stats for the boat
  const stats = useMemo(() => {
    const nm = trips.reduce((acc, t) => acc + estimateDistanceNm(t), 0);
    return { count: trips.length, nm: nm.toFixed(0) };
  }, [trips]);

  async function onDelete() {
    if (!confirm("Ta bort den här båten?")) return;
    try {
      await api(`/api/boats/${id}`, { method: "DELETE", token });
      nav("/boats");
    } catch (e) {
      alert(e.message || "Kunde inte ta bort.");
    }
  }

  // Render
  return (
    <div className='max-w-3xl mx-auto'>
      {/* Header: back + actions */}
      <div className='flex items-center justify-between mb-4'>
        <Link
          to='/boats'
          className='inline-flex items-center gap-2 text-sm text-gray-800 hover:underline'
        >
          <ArrowLeft size={16} />
          Tillbaka
        </Link>

        {!edit && boat && (
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              leftIcon={<Pencil size={16} />}
              onClick={() => setEdit(true)}
            >
              Redigera
            </Button>
            <Button
              variant='danger'
              leftIcon={<Trash2 size={16} />}
              onClick={onDelete}
            >
              Ta bort
            </Button>
          </div>
        )}
      </div>

      {/* States */}
      {err && (
        <div className='mb-3 border border-red-300 bg-red-50 text-red-700 p-3'>
          {err}
        </div>
      )}

      {loading ? (
        <div className='bg-white border p-6'>Laddar…</div>
      ) : !boat ? (
        <div className='bg-white border p-6'>Båten hittades inte.</div>
      ) : edit ? (
        <BoatForm
          mode='edit'
          initialBoat={boat}
          onSaved={() => {
            setEdit(false);
            load();
          }}
          onCancel={() => setEdit(false)}
        />
      ) : (
        <>
          {/* Photo banner (or placeholder) */}
          <div className='bg-brand-surface-200 border text-center text-sm text-gray-600 py-14 mb-4'>
            {boat.photoUrl || boat.photo ? (
              <img
                src={photoUrl(boat.photoUrl || boat.photo)}
                alt={boat.name}
                className='w-full max-h-72 object-cover'
              />
            ) : (
              "BILD AV BÅTEN, OM MAN VILL"
            )}
          </div>

          {/* Summary + fields */}
          <section className='bg-white border p-4 md:p-6'>
            <h1 className='text-2xl md:text-3xl font-bold'>{boat.name}</h1>

            {/* Quick stats */}
            <div className='mt-4 grid grid-cols-2 gap-3'>
              <StatCard label='Antal resor' value={stats.count} />
              <StatCard label='Total distans' value={`${stats.nm} NM`} />
            </div>

            {/* Fields */}
            <div className='mt-6 grid gap-3'>
              <div className='grid md:grid-cols-2 gap-3'>
                <Field label='Modell' value={boat.model || "—"} />
                <Field
                  label='Längd'
                  value={
                    boat.lengthM != null && boat.lengthM !== ""
                      ? `${boat.lengthM} meter${
                          Number.isFinite(+boat.lengthM)
                            ? ` / ${(+boat.lengthM * 3.28084).toFixed(0)} fot`
                            : ""
                        }`
                      : "—"
                  }
                />
              </div>

              <div className='grid md:grid-cols-2 gap-3'>
                <Field
                  label='Djupgående'
                  value={
                    boat.draftM != null && boat.draftM !== ""
                      ? `${boat.draftM} meter`
                      : "—"
                  }
                />
                <Field label='Motor' value={boat.engine || "—"} />
              </div>

              <Field
                label='Övrigt'
                value={boat.notes ? boat.notes : "—"}
                multiline
              />
            </div>
          </section>

          {/* Related trips (optional light list) */}
          {trips.length > 0 && (
            <section className='mt-6 bg-white border p-4 md:p-6'>
              <h2 className='text-lg font-semibold mb-3'>
                Resor med denna båt
              </h2>
              <ul className='grid gap-2'>
                {trips
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((t) => (
                    <li
                      key={t._id}
                      className='flex items-center justify-between border p-3'
                    >
                      <div>
                        <p className='font-medium'>{t.title || "Resa"}</p>
                        <p className='text-xs text-gray-600'>
                          {new Date(t.date).toLocaleDateString("sv-SE")} ·{" "}
                          {estimateDistanceNm(t).toFixed(0)} NM
                        </p>
                      </div>
                      <Link
                        to={`/trips/${t._id}`}
                        className='text-sm text-brand-secondary hover:underline'
                        title='Visa resa'
                      >
                        Visa
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Small presentational subcomponents ---------- */

function StatCard({ label, value }) {
  return (
    <div className='bg-white border border-brand-border/40 p-4'>
      <p className='text-2xl font-extrabold tracking-tight'>{value}</p>
      <p className='text-xs text-gray-500 mt-1'>{label}</p>
    </div>
  );
}

function Field({ label, value, multiline = false }) {
  return (
    <div className='border p-3'>
      <p className='text-xs text-gray-500'>{label}</p>
      {multiline ? (
        <p className='mt-1 text-sm whitespace-pre-wrap'>{value}</p>
      ) : (
        <p className='mt-1 text-sm'>{value}</p>
      )}
    </div>
  );
}
