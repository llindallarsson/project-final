import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
// src/pages/BoatDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api';
import { estimateDistanceNm } from '../lib/distance';
import { getPhotoUrl } from '../lib/photo';
import BoatForm from '../components/BoatForm';
import Button from '../components/ui/Button';
import ButtonLink from '../components/ui/ButtonLink';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { useAuth } from '../store/auth';

/* ---------- Component ---------- */
export default function BoatDetails() {
  const { id } = useParams();
  const token = useAuth((s) => s.token);
  const nav = useNavigate();

  const [boat, setBoat] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    try {
      console.log('Loading boat with ID:', id);
      console.log('Token exists:', !!token);

      setErr('');
      setLoading(true);
      const [b, ts] = await Promise.all([
        api(`/api/boats/${id}`, { token }),
        api('/api/trips', { token }),
      ]);
      setBoat(b || null);
      setTrips((ts || []).filter((t) => t.boatId === id));
    } catch (e) {
      console.error('Load error:', e);
      setErr(e.message || 'Kunde inte ladda båten.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const stats = useMemo(() => {
    const nm = trips.reduce((acc, t) => acc + estimateDistanceNm(t), 0);
    return { count: trips.length, nm: nm.toFixed(0) };
  }, [trips]);

  async function onDelete() {
    if (!confirm('Ta bort den här båten?')) return;
    try {
      await api(`/api/boats/${id}`, { method: 'DELETE', token });
      nav('/boats');
    } catch (e) {
      alert(e.message || 'Kunde inte ta bort.');
    }
  }

  // Render
  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <div className="mb-3">
        <ButtonLink to="/boats" variant="ghost" className="gap-2 px-0">
          <ArrowLeft size={16} />
          Tillbaka
        </ButtonLink>
      </div>

      {/* Error / Loading states */}
      {err && (
        <Card variant="outline" className="mb-4 border-red-300 bg-red-50">
          <CardContent padding="md" className="text-red-700">
            {err}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card variant="outline">
          <CardContent padding="lg">Laddar…</CardContent>
        </Card>
      ) : !boat ? (
        <Card variant="outline">
          <CardContent padding="lg">Båten hittades inte.</CardContent>
        </Card>
      ) : edit ? (
        <Card variant="elevated" radius="xl">
          <CardHeader
            title={`Redigera: ${boat.name ?? 'Båt'}`}
            subtitle="Uppdatera båtens uppgifter nedan."
            padding="lg"
          />
          <CardContent padding="lg">
            <BoatForm
              mode="edit"
              initialBoat={boat}
              onSaved={() => {
                setEdit(false);
                load();
              }}
              onCancel={() => setEdit(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Photo banner */}
          <Card variant="outline" radius="xl" className="overflow-hidden mb-4">
            {boat.photoUrl || boat.photo ? (
              <img
                src={getPhotoUrl(boat.photoUrl || boat.photo)}
                alt={boat.name}
                className="w-full max-h-80 object-cover"
              />
            ) : (
              <CardContent
                padding="lg"
                className="text-center text-sm text-gray-600 bg-brand-surface-200"
              >
                BILD AV BÅTEN, OM MAN VILL
              </CardContent>
            )}
          </Card>

          {/* Summary & fields */}
          <Card variant="elevated" radius="xl">
            <CardHeader
              padding="lg"
              // Använd explicit header med actions för Edit/Delete
              children={
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl">{boat.name}</CardTitle>
                    <CardDescription>Översikt och uppgifter för båten.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      leftIcon={<Pencil size={16} />}
                      onClick={() => setEdit(true)}
                    >
                      Redigera
                    </Button>
                    <Button variant="danger" leftIcon={<Trash2 size={16} />} onClick={onDelete}>
                      Ta bort
                    </Button>
                  </div>
                </div>
              }
            />

            <CardContent padding="lg">
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Antal resor" value={stats.count} />
                <StatCard label="Total distans" value={`${stats.nm} NM`} />
              </div>

              {/* Fields */}
              <div className="mt-6 grid gap-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Modell" value={boat.model || '—'} />
                  <Field
                    label="Längd"
                    value={
                      boat.lengthM != null && boat.lengthM !== ''
                        ? `${boat.lengthM} meter${
                            Number.isFinite(+boat.lengthM)
                              ? ` / ${(+boat.lengthM * 3.28084).toFixed(0)} fot`
                              : ''
                          }`
                        : '—'
                    }
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <Field
                    label="Djupgående"
                    value={boat.draftM != null && boat.draftM !== '' ? `${boat.draftM} meter` : '—'}
                  />
                  <Field label="Motor" value={boat.engine || '—'} />
                </div>

                <Field label="Övrigt" value={boat.notes ? boat.notes : '—'} multiline />
              </div>
            </CardContent>
          </Card>

          {/* Related trips */}
          {trips.length > 0 && (
            <Card variant="elevated" radius="xl" className="mt-6">
              <CardHeader padding="lg" title="Resor med denna båt" subtitle="Senaste först" />
              <CardContent padding="md">
                <ul className="grid gap-2">
                  {trips
                    .slice()
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((t) => (
                      <li key={t._id}>
                        <Card
                          as={Link}
                          to={`/trips/${t._id}`}
                          variant="outline"
                          interactive
                          className="block"
                        >
                          <CardContent padding="md" className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{t.title || 'Resa'}</p>
                              <p className="text-xs text-gray-600">
                                {new Date(t.date).toLocaleDateString('sv-SE')} ·{' '}
                                {estimateDistanceNm(t).toFixed(0)} NM
                              </p>
                            </div>
                            <span className="text-sm text-brand-secondary">Visa</span>
                          </CardContent>
                        </Card>
                      </li>
                    ))}
                </ul>
              </CardContent>
              <CardFooter padding="sm" className="text-xs text-gray-600">
                Visar {trips.length} resa{trips.length === 1 ? '' : 'r'}.
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Small presentational subcomponents (Card-baserade) ---------- */

function StatCard({ label, value }) {
  return (
    <Card variant="outline" radius="lg">
      <CardContent padding="md">
        <p className="text-2xl font-extrabold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{label}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, multiline = false }) {
  return (
    <Card variant="outline" radius="lg">
      <CardContent padding="md">
        <p className="text-xs text-gray-500">{label}</p>
        {multiline ? (
          <p className="mt-1 text-sm whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="mt-1 text-sm">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
