import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Исправляем проблему с иконками маркеров в Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const QuestMap = ({ locations, centerLat = 55.751244, centerLng = 37.618423 }) => {
  if (!locations || locations.length === 0) {
    return <div style={{ height: '400px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Локации не добавлены</div>;
  }

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={12}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location, idx) => (
        <Marker
          key={idx}
          position={[location.latitude, location.longitude]}
        >
          <Popup>
            <b>{location.order_number}. {location.name}</b>
            <p>{location.description}</p>
            {location.points_award && <p>Очки: {location.points_award}</p>}
            {location.hint_text && <p><i>Подсказка: {location.hint_text}</i></p>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default QuestMap;