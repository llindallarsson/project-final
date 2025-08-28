import { useNavigate } from "react-router-dom";
import BoatForm from "../components/BoatForm";
import { Card, CardHeader, CardContent } from "../components/ui/Card";

export default function AddBoat() {
  const nav = useNavigate();

  return (
    <div className='max-w-3xl mx-auto'>
      <h1 className='text-2xl md:text-3xl font-bold mb-4'>Lägg till båt</h1>
      <Card>
        <CardContent>
          <BoatForm
            mode='create'
            onSaved={(boat) => nav(`/boats/${boat._id}`)}
            onCancel={() => nav("/boats")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
