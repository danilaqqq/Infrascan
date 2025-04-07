/*import { useEffect } from 'react';
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

export default HeatmapLayer;*/
import { Rectangle } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';

const HeatmapLayer = ({ points }) => {
  if (!points) return null;

  return (
    <>
      {points.map((point, i) => {
        const { lat, lng, cellSize = 0.05, color, intensity } = point;

        // Перевод из километров в градусы
        const deltaLat = cellSize / 111; // всегда примерно одинаково

        // Для долготы учтём сжатие к полюсам:
        const metersPerDegreeLon = 111.32 * Math.cos(lat * Math.PI / 180);
        const deltaLng = cellSize / metersPerDegreeLon;

        const bounds = [
          [lat - deltaLat / 2, lng - deltaLng / 2],
          [lat + deltaLat / 2, lng + deltaLng / 2]
        ];
        
        return (
          <Rectangle
            key={i}
            bounds={bounds}
            pathOptions={{
              color: color,
              weight: 0,
              fillOpacity: 0.5
            }}
          />
        );
      })}
    </>
  );
};

export default HeatmapLayer;
