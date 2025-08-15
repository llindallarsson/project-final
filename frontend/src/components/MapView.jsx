import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import Recenter from "./Recenter";
import FitBounds from "./FitBounds";
import "leaflet/dist/leaflet.css";

// Fixar Leaflet-ikoner
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({ trips, currentPosition, tracking, route }) {
  return (
    <MapContainer
      center={[59.3293, 18.0686]}
      zoom={12}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      {currentPosition && tracking && (
        <>
          <Marker position={currentPosition}>
            <Popup>Du är här</Popup>
          </Marker>
          <Recenter position={currentPosition} />
        </>
      )}

      {route.length > 1 && <Polyline positions={route} color='red' />}

      {trips.map((trip, i) => (
        <div key={i}>
          {trip.startCoords && (
            <Marker position={[trip.startCoords.lat, trip.startCoords.lon]}>
              <Popup>Start: {trip.start}</Popup>
            </Marker>
          )}
          {trip.endCoords && (
            <Marker position={[trip.endCoords.lat, trip.endCoords.lon]}>
              <Popup>Slut: {trip.end}</Popup>
            </Marker>
          )}
          {trip.route && <Polyline positions={trip.route} color='green' />}
          {!tracking && trip.route && <FitBounds positions={trip.route} />}
        </div>
      ))}
    </MapContainer>
  );
}
