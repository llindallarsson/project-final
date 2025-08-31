import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../store/auth';
import TripForm from '../components/TripForm';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

export default function EditTrip() {
  const { id } = useParams();
  const token = useAuth((s) => s.token);

  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0); // för "Försök igen"

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api(`/api/trips/${id}`, { token });
        if (!alive) return;
        setTrip(data);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Kunde inte hämta resa.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, token, refresh]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card variant="outline">
          <CardContent padding="lg">
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-72 bg-gray-200 rounded" />
              <div className="h-28 w-full bg-gray-100 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card variant="outline" className="border-red-300 bg-red-50">
          <CardContent padding="lg" className="text-red-700">
            <p className="mb-3">{error}</p>
            <Button variant="outline" onClick={() => setRefresh((r) => r + 1)}>
              Försök igen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card variant="outline">
          <CardContent padding="lg">Resan hittades inte.</CardContent>
        </Card>
      </div>
    );
  }

  // Redigera – förifyllt formulär
  return (
    <div className="mx-auto max-w-3xl">
      <Card variant="elevated" radius="xl">
        <CardHeader title="Redigera resa" subtitle="Uppdatera informationen nedan." padding="lg" />
        <CardContent padding="lg">
          <TripForm initialTrip={trip} mode="edit" />
        </CardContent>
      </Card>
    </div>
  );
}
