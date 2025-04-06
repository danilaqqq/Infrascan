import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMapEvents} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { bounds } from "leaflet";
import "./App.css";
import HeatmapLayer from './HeatmapComponent'
import * as turf from '@turf/turf';

// PNG маркера с его тенью
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Настройка маркера
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Расчет площади выделенной области
const calculateArea = (bounds) => {
  if (!bounds) return 0;
  const [sw, ne] = bounds;
  const latDiff = Math.abs(sw.lat - ne.lat) * 111;
  const lngDiff = Math.abs(sw.lng - ne.lng) * (111 * Math.cos((sw.lat + ne.lat) / 2 * Math.PI / 180));
  return latDiff * lngDiff;
};

const MapInteraction = ({ analysisModeIsActive, setMarker, setPosition, setSelection, tempSelection, setTempSelection }) => {
  useMapEvents({
    click(e) {
      if (!analysisModeIsActive) return;
      setSelection(null);
      setMarker(e.latlng);
      setPosition(e.latlng);
      console.log(e.latlng);
    },
    contextmenu(e) {
      if (!analysisModeIsActive) return;
      setMarker(null);
      e.originalEvent.preventDefault();
      setTempSelection({
        bounds: [e.latlng, e.latlng],
        color: 'blue'
      });
    },
    mousemove(e) {
      if (!analysisModeIsActive || !tempSelection) return;
      setMarker(null);
      
      const newBounds = [tempSelection.bounds[0], e.latlng];
      const area = calculateArea(newBounds);
      const newColor = area > 2 ? 'red' : 'blue';
      if(newColor !== tempSelection.color) {
        setTempSelection({
          bounds: newBounds,
          color: newColor
        });
      }
      else {
        setTempSelection(prev => ({
          ...prev,
          bounds: newBounds
        }));
      }
      console.log('Area: ', area, ' Color: ', newColor);
    },
    mouseup(e) {
      if (!analysisModeIsActive || !tempSelection) return;
      setMarker(null);
      const area = calculateArea(tempSelection.bounds);
      console.log(area);
      if (area > 2) {
        setTempSelection(null);
        return;
      } else {
        setSelection(tempSelection.bounds);
      }

       // Генерация точек сетки
      const gridPoints = generateGridPoints(tempSelection.bounds);
      // Запрос к Overpass API для каждой точки
      checkPoints(gridPoints).then(results => {
        setSelection({
          bounds: tempSelection.bounds,
          points: results // Массив с результатами проверки
        });
      });

      setTempSelection(null);
    },
  });

  return null;
};

const generateGridPoints = (bounds) => {
  const [sw, ne] = bounds;
  
  const minLng = Math.min(sw.lng, ne.lng);
  const maxLng = Math.max(sw.lng, ne.lng);
  const minLat = Math.min(sw.lat, ne.lat);
  const maxLat = Math.max(sw.lat, ne.lat);
  const bbox = [minLng, minLat, maxLng, maxLat];

  // Сетка с шагом ~50 метров (0.05 км)
  const grid = turf.pointGrid(bbox, 0.05, { units: 'kilometers' });
  return grid.features.map(feature => ({
    lng: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1]
  }));
};

const checkPoints = async (points) => {
  console.log("Incoming points:", points);
  return Promise.all(points.map(async (point) => {
    try {
      const query = `[out:json];
        node[amenity](around:50,${point.lat},${point.lng});
        out count;`;

      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );
      
      const data = await response.json();
      const hasObjects = data.elements.length > 0;
      console.log("Point has objects ", hasObjects);
      return {
        ...point,
        hasObject: hasObjects,
        color: hasObjects ? 'green' : 'red',
        intensity: hasObjects ? 1 : 0.3
      };
    } catch (error) {
      return {
        ...point,
        hasObject: false,
        color: 'gray',
        intensity: 0.1
      };
    }
  }));
};

const MapComponent = () => {
  const [position, setPosition] = useState([23.3345, 9.0598]);
  const [location, setLocation] = useState({ country: "Неизвестно", region: "Неизвестно", city: "Неизвестно", countryCode: "xx" });
  const [marker, setMarker] = useState(null);
  const [selection, setSelection] = useState(null);
  const [tempSelection, setTempSelection] = useState(null);
  const [analysisModeIsActive, setAnalysisModeIsActive] = useState(false);

  const [shops, setShops] = useState([]);
  const [hoveredShopId, setHoveredShopId] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [hoveredPharmacyId, setHoveredPharmacyId] = useState(null);
  const [transportNodes, setTransportNodes] = useState([]);
  const [hoveredTransportId, setHoveredTransportId] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [hoveredClinicId, setHoveredClinicId] = useState(null);
  const [malls, setMalls] = useState([]);
  const [hoveredMallId, setHoveredMallId] = useState(null);
  const [parks, setParks] = useState([]);
  const [hoveredParkId, setHoveredParkId] = useState(null);
  const [banks, setBanks] = useState([]);
  const [hoveredBankId, setHoveredBankId] = useState(null);
  const [kindergartens, setKindergartens] = useState([]);
  const [hoveredKindergartenId, setHoveredKindergartenId] = useState(null);
  const [schools, setSchools] = useState([]);
  const [hoveredSchoolId, setHoveredSchoolId] = useState(null);
  const markerRefs = useRef({});
  
  const categoriesRadius = {
    shops: 500,
    pharmacies: 600,
    transport_nodes: 700,
    clinics: 2000,
    malls: 3000,
    parks: 1500,
    banks: 1000,
    kindergartens: 1000,
    schools: 1500,
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          //setPosition([59.9847, 30.344]);
          //setPosition([latitude, longitude]);

          
          fetch("https://ipapi.co/json/")
            .then((res) => res.json())
            .then((data) => {
                console.log(data.country_name, data.region, data.city, data.country_code);
                setLocation({ country: data.country_name || "Неизвестно", 
                            region: data.region || "Неизвестно", 
                            city: data.city || "Неизвестно",
                            countryCode: data.country_code.toLowerCase() });
            })
            .catch((error) => console.error("Ошибка API местоположения:", error));
        },
        (error) => console.error("Ошибка геолокации:", error)
      );
    }
  }, []);

  const clearSelections = () => {
    setMarker(null);
    setSelection(null);
    setTempSelection(null);
    setAnalysisModeIsActive(false);
  };


  return (
    <div className="container">
      <div className="sidebar">
        <h1 className="title">📍nfrascan</h1>
        <h2 className="yourlocationtext">Ваше местоположение:</h2>
        <p className="location">
          <img 
            src={`https://flagcdn.com/w40/${location.countryCode}.png`} 
            alt="Флаг страны" 
            className="flag"
          /> 
          {location.country}, {location.region}, {location.city}
        </p>
        <input className="searchbar" type="text" placeholder="Поиск.."></input>
        <button className={`analysis-button ${analysisModeIsActive ? 'active' : ''}`} onClick={() => setAnalysisModeIsActive(true)}>Анализ инфраструктуры</button>
        <button className="analysis-button" onClick={clearSelections}>Очистить</button>
        <hr className="dividerline"/>
         
            
        

        <div className="category-buttons-grid">
          <div className="category-button-container"><button className="category-button" ><img src="icons/shopIcon.png" alt="Магазины"/></button><div className="category-label">Магазины</div></div>
          <div className="category-button-container"><button className="category-button" ><img src="icons/pharmacyIcon.png" alt="Аптеки"/></button><div className="category-label">Аптеки</div></div>
          <div className="category-button-container"><button className="category-button" ><img src="icons/transportStopIcon.png" alt="Транспорт"/></button><div className="category-label">Транспорт</div></div>
          <div className="category-button-container"><button className="category-button" ><img src="icons/hospitalIcon.png" alt="Поликлиники"/></button><div className="category-label">Поликлиники</div></div>
          <div className="category-button-container"><button className="category-button" ><img src="icons/mallIcon.png" alt="Торговые центры"/></button><div className="category-label">Торговые центры</div></div>
          <div className="category-button-container"><button className="category-button" ><img src="icons/parkIcon.png" alt="Парки"/></button><div className="category-label">Парки</div></div>
          <div className="category-button-container"><button className="category-button" ><img src="icons/bankIcon.png" alt="Банки"/></button><div className="category-label">Банки</div></div>
          <div className="category-button-container"><button className="category-button" ><img src="icons/kindergartenIcon.png" alt="Детские сады"/></button><div className="category-label">Детские сады</div></div>
          <div className="category-button-container"><button className="category-button" ><img src="icons/schoolIcon.png" alt="Школы"/></button><div className="category-label">Школы</div></div>
        </div>
      </div>

      <MapContainer center={position} zoom={3} className="map-container">
      <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapInteraction analysisModeIsActive={analysisModeIsActive} setMarker={setMarker} setPosition={setPosition} setSelection={setSelection} tempSelection={tempSelection} setTempSelection={setTempSelection} />
        {marker && (
          <Marker position={marker} icon={customIcon}>
            <Popup>Выбранная точка</Popup>
          </Marker>
        )}
        {tempSelection && (
          <Rectangle key={`react-${tempSelection.color}-${Date.now()}`} bounds={tempSelection.bounds} dashArray="4" color={tempSelection.color} fillColor={tempSelection.color} fillOpacity={0.2}/>
        )}
        {selection && !selection?.bounds && (
            <Rectangle bounds={selection} color="blue" />
        )}
        {selection?.bounds && (
          <>
            <Rectangle bounds={selection.bounds} color="blue" />
            <HeatmapLayer points={selection.points}/>
          </>
        )}
        {analysisModeIsActive && (
        <div className="map-tooltip">
          ℹ️ Анализ вокруг точки: Кликните ЛКМ, чтобы выбрать точку, вокруг которой будет проивзодиться анализ.
          ℹ️ Анализ в области: Нажмите ПКМ для выделения области, подтвердите ее с помощью ЛКМ. Слишком большая область будет выделена красным.
        </div>
        )}
        </MapContainer>
    </div>
  );
};

export default MapComponent;
