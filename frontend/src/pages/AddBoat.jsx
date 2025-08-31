import { useNavigate } from 'react-router-dom';
import BoatForm from '../components/BoatForm';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

export default function AddBoat() {
  const nav = useNavigate();

  return (
    <div className="mx-auto max-w-3xl">
      <Card variant="elevated" radius="xl">
        <CardHeader
          title="Lägg till båt"
          subtitle="Fyll i uppgifterna nedan. Du kan ändra allt senare."
          padding="lg"
        />
        <CardContent padding="lg">
          <BoatForm
            mode="create"
            onSaved={(boat) => nav(`/boats/${boat._id}`)}
            onCancel={() => nav('/boats')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
