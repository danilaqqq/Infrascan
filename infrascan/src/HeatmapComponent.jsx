import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Преобразование точек в формат [lat, lng, intensity]
    const heatData = points.map(p => [
      p.lat,
      p.lng,
      p.hasObject ? 1 : 0.3 // Интенсивность: 1 для зелёного, 0.3 для красного
    ]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 75,          // Радиус точки
      blur: 40,            // Размытие
      maxZoom: 17,         // Макс. масштаб
      minOpacity: 0.6,     // Минимальная прозрачность
      gradient: {          // Цветовая шкала
        0.0: 'gray',
        0.3: 'red',
        0.6: 'orange',
        0.8: 'yellowgreen',
        1.0: 'green'       // Зелёный для найденных объектов
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [points, map]);

  return null;
};

export default HeatmapLayer;