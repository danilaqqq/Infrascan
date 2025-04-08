import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { bounds, latLng } from "leaflet";
import "./App.css";
import HeatmapLayer from './HeatmapComponent'
import * as turf from '@turf/turf';
import { toast, ToastContainer } from 'react-toastify'

// PNG маркера с его тенью
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Радиусы для объектов
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

// Категории инфраструктуры и запросы для их поиска
const infrastructureCategories = [
  {
    key: "shops",
    radius: categoriesRadius.shops,
    query: (lat, lng, radius) => `
      node["shop"~"supermarket|convenience"](around:${radius}, ${lat}, ${lng});
    `,
    parser: (elements, lat, lng) => elements.map(el => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      name: el.tags.name || "Магазин",
      hours: el.tags.opening_hours || "Нет информации",
      distance: getDistance(lat, lng, el.lat, el.lon),
    })),
  },
  {
    key: "pharmacies",
    radius: categoriesRadius.pharmacies,
    query: (lat, lng, radius) => `
      node["amenity"="pharmacy"](around:${radius}, ${lat}, ${lng});
    `,
    parser: (elements, lat, lng) => elements.map(el => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      name: el.tags.name || "Аптека",
      hours: el.tags.opening_hours || "Нет информации",
      distance: getDistance(lat, lng, el.lat, el.lon),
    })),
  },
  {
    key: "transport",
    radius: categoriesRadius.transport_nodes,
    query: (lat, lng, radius) => `
      node["public_transport"="stop_position"](around:${radius}, ${lat}, ${lng});
    `,
    parser: (elements, lat, lng) => elements.map(el => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      name: el.tags.name || "Остановка",
      distance: getDistance(lat, lng, el.lat, el.lon),
    })),
  },
  {
    key: "clinics",
    radius: categoriesRadius.clinics,
    query: (lat, lng, radius) => `
      node["amenity"~"clinic|hospital"](around:${radius}, ${lat}, ${lng});
    `,
    parser: (elements, lat, lng) => elements.map(el => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      name: el.tags.name || "Поликлиника",
      hours: el.tags.opening_hours || "Нет информации",
      distance: getDistance(lat, lng, el.lat, el.lon),
    })),
  },
  {
    key: "malls",
    radius: categoriesRadius.malls,
    query: (lat, lng, radius) => `
      node["shop"="mall"](around:${radius},${lat},${lng});
      way["shop"="mall"](around:${radius},${lat},${lng});
      relation["shop"="mall"](around:${radius},${lat},${lng});
    `,
    parser: (elements, lat, lng) => elements.map(el => ({
      id: el.id,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      name: el.tags.name || "Торговый центр",
      hours: el.tags.opening_hours || "Нет информации",
      distance: getDistance(lat, lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
    })),
  },
  {
    key: "parks",
    radius: categoriesRadius.parks,
    query: (lat, lng, radius) => `
      way["leisure"="park"](around:${radius},${lat},${lng});
      relation["leisure"="park"](around:${radius},${lat},${lng});
    `,
    parser: (elements, lat, lng) => elements.map(el => ({
      id: el.id,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      name: el.tags.name || "Парк",
      distance: getDistance(lat, lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
    })),
  },
  {
    key: "banks",
    radius: categoriesRadius.banks,
    query: (lat, lng, radius) => `node["amenity"="bank"](around:${radius},${lat},${lng});`,
    parser: (elements, lat, lng) => elements.map(el => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      name: el.tags.name || "Банк",
      hours: el.tags.opening_hours || "Нет информации",
      distance: getDistance(lat, lng, el.lat, el.lon),
    })),
  },
  {
    key: "kindergartens",
    radius: categoriesRadius.kindergartens,
    query: (lat, lng, radius) => `
      node["amenity"="kindergarten"](around:${radius},${lat},${lng});
      way["amenity"="kindergarten"](around:${radius},${lat},${lng});
      relation["amenity"="kindergarten"](around:${radius},${lat},${lng});
    `,
    parser: (elements, lat, lng) => elements.map(el => ({
      id: el.id,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      name: el.tags.name || "Детский сад",
      hours: el.tags.opening_hours || "Нет информации",
      distance: getDistance(lat, lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
    })),
  },
  {
    key: "schools",
    radius: categoriesRadius.schools,
    query: (lat, lng, radius) => `
      node["amenity"="school"](around:${radius},${lat},${lng});
      way["amenity"="school"](around:${radius},${lat},${lng});
      relation["amenity"="school"](around:${radius},${lat},${lng});
    `,
    parser: (elements, lat, lng) => elements.map(el => ({
      id: el.id,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      name: el.tags.name || "Школа",
      hours: el.tags.opening_hours || "Нет информации",
      distance: getDistance(lat, lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
    })),
  },
];

// Таймаут для запросов
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// Отправка API запросов
const fetchOverpass = async (rawQuery) => {
  const cleanedQuery = rawQuery.replace(/\s+/g, ' ').trim();
  const finalQuery = `[out:json];(${cleanedQuery});out center;`;
  const encodedQuery = `data=${encodeURIComponent(finalQuery)}`;
  console.log("QUERY:", cleanedQuery);

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: encodedQuery
  });

  if (!response.ok) {
    const errorText = await response.text(); // для отладки
    console.error("Overpass error response:", errorText);
    throw new Error(`Overpass error: ${response.status}`);
  }

  const data = await response.json();
  return data.elements || [];
};

// Формула Хаверсина
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000);
};

// Отправка и обработка API запросов
const sendAndGetAPIRequestResult = async (latlng) => {
  const { lat, lng } = latlng;
  const result = {};

  for (const category of infrastructureCategories) {
    await sleep(500); // задержка между запросами
    try {
      const query = category.query(lat, lng, category.radius);
      const elements = await fetchOverpass(query);
      result[category.key] = category.parser(elements, lat, lng);
    } catch (err) {
      console.error(`Ошибка при загрузке категории ${category.key}:`, err);
      result[category.key] = [];
    }
  }

  return result;
}

// Отправка и обработка конкретных API запросов
const sendAndGetAPIRequestResultSpecific = async (latlng, categoryKey) => {
  const { lat, lng } = latlng;
  const result = {};

  const category = infrastructureCategories.find((c) => c.key === categoryKey);

  if (!category) {
    throw new Error(`Категория "${categoryKey}" не найдена.`);
  }

  const query = category.query(lat, lng, category.radius);

  try {
    const elements = await fetchOverpass(query);
    const parsed = category.parser(elements, lat, lng);
    return parsed;
  } catch (error) {
    console.error(`Ошибка при загрузке категории - ${categoryKey}:`, error);
    return [];
  }
}

// Создание кастомного маркера
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Создание маркера с учётом типа и выделенности
const createCustomMarker = (type, isHighlighted = false) => {
  const iconSize = isHighlighted ? [45, 45] : [30, 30]; 
  const iconAnchor = [iconSize[0] / 2, iconSize[1]];
  const popupAnchor = [0, -iconSize[1]];

  return new L.Icon({
    iconUrl: `/icons/${type}Icon.png`,
    iconSize,
    iconAnchor,
    popupAnchor,
  });
};

// Расчет площади выделенной области
const calculateArea = (bounds) => {
  if (!bounds) return 0;
  const [sw, ne] = bounds;
  const latDiff = Math.abs(sw.lat - ne.lat) * 111;
  const lngDiff = Math.abs(sw.lng - ne.lng) * (111 * Math.cos((sw.lat + ne.lat) / 2 * Math.PI / 180));
  return latDiff * lngDiff;
};

// Взаимодействие с картой при анализе - постановка точка или выделение области
const MapInteraction = ({ analysisModeIsActive, clearAllObjects, setMarker, setPosition, analyseNearbyInfrastructure, setSelection, tempSelection, setTempSelection }) => {
  useMapEvents({
    click(e) {
      //if (!analysisModeIsActive) return;
      clearAllObjects();
      setSelection(null);
      setMarker(e.latlng);
      setPosition(e.latlng);
      console.log(e.latlng);
      if (analysisModeIsActive) analyseNearbyInfrastructure(e.latlng);
    },
    contextmenu(e) {
      if (!analysisModeIsActive) return;
      clearAllObjects();
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
      if (newColor !== tempSelection.color) {
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
      if (area > 1) {
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

// Создание массива координат из выделенной области
const generateGridPoints = (bounds) => {
  const [sw, ne] = bounds;

  const minLng = Math.min(sw.lng, ne.lng);
  const maxLng = Math.max(sw.lng, ne.lng);
  const minLat = Math.min(sw.lat, ne.lat);
  const maxLat = Math.max(sw.lat, ne.lat);
  const bbox = [minLng, minLat, maxLng, maxLat];

  const grid = turf.pointGrid(bbox, 0.05, { units: 'kilometers' });
  return grid.features.map(feature => ({
    lng: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1]
  }));
};

// Анализ инфраструктуры в области для каждой точки массива
const checkPoints = async (points) => {
  console.log("Incoming points:", points);
  return Promise.all(points.map(async (point) => {
    try {

      const data = await sendAndGetAPIRequestResult(point);
      
      const hasShops = data.shops.length > 0;
      
      return {
        ...point,
        hasShops: hasShops,
        color: hasShops ? 'green' : 'red',
        intensity: hasShops ? 1 : 0.3
      };
    } catch (error) {
      return {
        ...point,
        hasShops: false,
        color: 'gray',
        intensity: 0.5
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

  const [isRemoving, setIsRemoving] = useState(false);

  const markerRefs = useRef({});
  
  const categorySetters = {
    shops: setShops,
    pharmacies: setPharmacies,
    transport: setTransportNodes,
    clinics: setClinics,
    malls: setMalls,
    parks: setParks,
    banks: setBanks,
    kindergartens: setKindergartens,
    schools: setSchools,
  };

  // Определение местоположения
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
              setLocation({
                country: data.country_name || "Неизвестно",
                region: data.region || "Неизвестно",
                city: data.city || "Неизвестно",
                countryCode: data.country_code.toLowerCase()
              });
            })
            .catch((error) => console.error("Ошибка API местоположения:", error));
        },
        (error) => console.error("Ошибка геолокации:", error)
      );
    }
  }, []);

  const analyseNearbyInfrastructure = async (latlng) => {

      const data = await sendAndGetAPIRequestResult(latlng);
      
      const foundShops = data.shops;
      foundShops.sort((a, b) => a.distance - b.distance);
      setShops(foundShops.slice(0, 1));

      const foundPharmacies = data.pharmacies;
      foundPharmacies.sort((a, b) => a.distance - b.distance);
      setPharmacies(foundPharmacies.slice(0, 1));

      const foundTransportNodes = data.transport;
      foundTransportNodes.sort((a, b) => a.distance - b.distance);
      setTransportNodes(foundTransportNodes.slice(0, 1));

      const foundClinics = data.clinics;
      foundClinics.sort((a, b) => a.distance - b.distance);
      setClinics(foundClinics.slice(0, 1));

      const foundMalls = data.malls;
      foundMalls.sort((a, b) => a.distance - b.distance);
      setMalls(foundMalls.slice(0, 1));

      const foundParks = data.parks;
      foundParks.sort((a, b) => a.distance - b.distance);
      setParks(foundParks.slice(0, 1));

      const foundBanks = data.banks;
      foundBanks.sort((a, b) => a.distance - b.distance);
      setBanks(foundBanks.slice(0, 1));

      const foundKindergartens = data.kindergartens;
      foundKindergartens.sort((a, b) => a.distance - b.distance);
      setKindergartens(foundKindergartens.slice(0, 1));

      const foundSchools = data.schools;
      foundSchools.sort((a, b) => a.distance - b.distance);
      setSchools(foundSchools.slice(0, 1));

      markerRefs.current = {};
  }

  const searchTypeOfObjects = async (latlng, category) => {
    const data = await sendAndGetAPIRequestResultSpecific(latlng, category);
    const setter = categorySetters[category];

    data.sort((a, b) => a.distance - b.distance);
    if (setter) {
      setter(data.slice(0, 10));
    } else {
      console.warn(`Нет функции setter для категории "${category}"`);
    }    

    markerRefs.current = {};
  }

  const clearSelections = () => {
    //setMarker(null);
    setSelection(null);
    setTempSelection(null);
    setAnalysisModeIsActive(false);
    clearAllObjects();
  };

  const clearAllObjects = () => {
    setIsRemoving(true);

    setTimeout(() => {
      setShops([]);
      setPharmacies([]);
      setTransportNodes([]);
      setClinics([]);
      setMalls([]);
      setParks([]);
      setBanks([]);
      setKindergartens([]);
      setSchools([]);

      setIsRemoving(false);
    }, 1000);
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
        <button
          className={`analysis-button ${analysisModeIsActive ? 'active' : ''}`}
          onClick={() => {
            if (analysisModeIsActive) { setAnalysisModeIsActive(false); clearSelections(); }
            else {setAnalysisModeIsActive(true); if(marker) analyseNearbyInfrastructure(position);}
          }}>
          {analysisModeIsActive ? 'Завершить анализ' : 'Анализ инфраструктуры'}
        </button>
        <hr className="dividerline" />

        {(shops.length > 0 || pharmacies.length > 0 || transportNodes.length > 0 || clinics.length > 0 || malls.length > 0 || parks.length > 0 || banks.length > 0 || kindergartens.length > 0 || schools.length > 0) && (
          <>
            <button className="clear-button" onClick={clearAllObjects}>
              ✖ Очистить
            </button>
            <ul className={`shop-list ${isRemoving ? "removing" : ""}`}>
              {shops.map((shop) => (
                <li key={shop.id}
                  className="shop-item"
                  onMouseEnter={() => { setHoveredShopId(shop.id); if (markerRefs.current[shop.id]) { markerRefs.current[shop.id].openPopup(); } }}
                  onMouseLeave={() => { setHoveredShopId(null); if (markerRefs.current[shop.id]) { markerRefs.current[shop.id].closePopup(); } }}>
                  <strong>{shop.name}</strong>
                  <p>🕒 {shop.hours}</p>
                  <p>↔️ {shop.distance} метров</p>
                </li>
              ))}
              {pharmacies.map((pharmacy) => (
                <li key={pharmacy.id}
                  className="shop-item"
                  onMouseEnter={() => { setHoveredPharmacyId(pharmacy.id); if (markerRefs.current[pharmacy.id]) { markerRefs.current[pharmacy.id].openPopup(); } }}
                  onMouseLeave={() => { setHoveredPharmacyId(null); if (markerRefs.current[pharmacy.id]) { markerRefs.current[pharmacy.id].closePopup(); } }}>
                  <strong>{pharmacy.name}</strong>
                  <p>🕒 {pharmacy.hours}</p>
                  <p>↔️ {pharmacy.distance} метров</p>
                </li>
              ))}
              {transportNodes.map((stop_position) => (
                <li key={stop_position.id}
                  className="shop-item"
                  onMouseEnter={() => { setHoveredTransportId(stop_position.id); if (markerRefs.current[stop_position.id]) { markerRefs.current[stop_position.id].openPopup(); } }}
                  onMouseLeave={() => { setHoveredTransportId(null); if (markerRefs.current[stop_position.id]) { markerRefs.current[stop_position.id].closePopup(); } }}>
                  <strong>{stop_position.name}</strong>
                  <p>↔️ {stop_position.distance} метров</p>
                </li>
              ))}
              {clinics.map((clinic) => (
                <li key={clinic.id}
                  className="shop-item"
                  onMouseEnter={() => { setHoveredClinicId(clinic.id); if (markerRefs.current[clinic.id]) { markerRefs.current[clinic.id].openPopup(); } }}
                  onMouseLeave={() => { setHoveredClinicId(null); if (markerRefs.current[clinic.id]) { markerRefs.current[clinic.id].closePopup(); } }}>
                  <strong>{clinic.name}</strong>
                  <p>🕒 {clinic.hours}</p>
                  <p>↔️ {clinic.distance} метров</p>
                </li>
              ))}
              {malls.map((mall) => (
                <li key={mall.id}
                  className="shop-item"
                  onMouseEnter={() => { setHoveredMallId(mall.id); if (markerRefs.current[mall.id]) { markerRefs.current[mall.id].openPopup(); } }}
                  onMouseLeave={() => { setHoveredMallId(null); if (markerRefs.current[mall.id]) { markerRefs.current[mall.id].closePopup(); } }}>
                  <strong>{mall.name}</strong>
                  <p>🕒 {mall.hours}</p>
                  <p>↔️ {mall.distance} метров</p>
                </li>
              ))}
              {parks.map((park) => (
                <li key={park.id}
                  className="shop-item"
                  onMouseEnter={() => { setHoveredParkId(park.id); if (markerRefs.current[park.id]) { markerRefs.current[park.id].openPopup(); } }}
                  onMouseLeave={() => { setHoveredParkId(null); if (markerRefs.current[park.id]) { markerRefs.current[park.id].closePopup(); } }}>
                  <strong>{park.name}</strong>
                  <p>↔️ {park.distance} метров</p>
                </li>
              ))}
              {banks.map((bank) => (
                <li key={bank.id}
                  className="shop-item"
                  onMouseEnter={() => { setHoveredBankId(bank.id); if (markerRefs.current[bank.id]) { markerRefs.current[bank.id].openPopup(); } }}
                  onMouseLeave={() => { setHoveredBankId(null); if (markerRefs.current[bank.id]) { markerRefs.current[bank.id].closePopup(); } }}>
                  <strong>{bank.name}</strong>
                  <p>🕒 {bank.hours}</p>
                  <p>↔️ {bank.distance} метров</p>
                </li>
              ))}
              {kindergartens.map((kindergarten) => (
                <li key={kindergarten.id}
                  className="shop-item"
                  onMouseEnter={() => { setHoveredKindergartenId(kindergarten.id); if (markerRefs.current[kindergarten.id]) { markerRefs.current[kindergarten.id].openPopup(); } }}
                  onMouseLeave={() => { setHoveredKindergartenId(null); if (markerRefs.current[kindergarten.id]) { markerRefs.current[kindergarten.id].closePopup(); } }}>
                  <strong>{kindergarten.name}</strong>
                  <p>🕒 {kindergarten.hours}</p>
                  <p>↔️ {kindergarten.distance} метров</p>
                </li>
              ))}
              {schools.map((school) => (
                <li key={school.id}
                  className="shop-item"
                  onMouseEnter={() => { setHoveredSchoolId(school.id); if (markerRefs.current[school.id]) { markerRefs.current[school.id].openPopup(); } }}
                  onMouseLeave={() => { setHoveredSchoolId(null); if (markerRefs.current[school.id]) { markerRefs.current[school.id].closePopup(); } }}>
                  <strong>{school.name}</strong>
                  <p>🕒 {school.hours}</p>
                  <p>↔️ {school.distance} метров</p>
                </li>
              ))}
            </ul>
            <hr className="dividerline" />
          </>
        )}

        <div className="category-buttons-grid">
          <div className="category-button-container"><button className="category-button"  onClick={() => {
            if (marker && !analysisModeIsActive) searchTypeOfObjects(position, "shops");
            if (!marker) {toast.error('Укажите точку на карте для поиска по категории');}
            if (analysisModeIsActive) {toast.error('Вы не можете проводить поиск по категории пока находитесь в режиме анализа');}
          }}><img src="icons/shopIcon.png" alt="Магазины"/></button><div className="category-label">Магазины</div></div>
          <div className="category-button-container"><button className="category-button" onClick={() => {
            if (marker && !analysisModeIsActive) searchTypeOfObjects(position, "pharmacies");
            if (!marker) {toast.error('Укажите точку на карте для поиска по категории');}
            if (analysisModeIsActive) {toast.error('Вы не можете проводить поиск по категории пока находитесь в режиме анализа');}
          }}><img src="icons/pharmacyIcon.png" alt="Аптеки" /></button><div className="category-label">Аптеки</div></div>
          <div className="category-button-container"><button className="category-button" onClick={() => {
            if (marker && !analysisModeIsActive) searchTypeOfObjects(position, "transport");
            if (!marker) {toast.error('Укажите точку на карте для поиска по категории');}
            if (analysisModeIsActive) {toast.error('Вы не можете проводить поиск по категории пока находитесь в режиме анализа');}
          }}><img src="icons/transportStopIcon.png" alt="Транспорт" /></button><div className="category-label">Транспорт</div></div>
          <div className="category-button-container"><button className="category-button" onClick={() => {
            if (marker && !analysisModeIsActive) searchTypeOfObjects(position, "clinics");
            if (!marker) {toast.error('Укажите точку на карте для поиска по категории');}
            if (analysisModeIsActive) {toast.error('Вы не можете проводить поиск по категории пока находитесь в режиме анализа');}
          }}><img src="icons/hospitalIcon.png" alt="Поликлиники" /></button><div className="category-label">Поликлиники</div></div>
          <div className="category-button-container"><button className="category-button" onClick={() => {
            if (marker && !analysisModeIsActive) searchTypeOfObjects(position, "malls");
            if (!marker) {toast.error('Укажите точку на карте для поиска по категории');}
            if (analysisModeIsActive) {toast.error('Вы не можете проводить поиск по категории пока находитесь в режиме анализа');}
          }}><img src="icons/mallIcon.png" alt="Торговые центры" /></button><div className="category-label">Торговые центры</div></div>
          <div className="category-button-container"><button className="category-button" onClick={() => {
            if (marker && !analysisModeIsActive) searchTypeOfObjects(position, "parks");
            if (!marker) {toast.error('Укажите точку на карте для поиска по категории');}
            if (analysisModeIsActive) {toast.error('Вы не можете проводить поиск по категории пока находитесь в режиме анализа');}
          }}><img src="icons/parkIcon.png" alt="Парки" /></button><div className="category-label">Парки</div></div>
          <div className="category-button-container"><button className="category-button" onClick={() => {
            if (marker && !analysisModeIsActive) searchTypeOfObjects(position, "banks");
            if (!marker) {toast.error('Укажите точку на карте для поиска по категории');}
            if (analysisModeIsActive) {toast.error('Вы не можете проводить поиск по категории пока находитесь в режиме анализа');}
          }}><img src="icons/bankIcon.png" alt="Банки" /></button><div className="category-label">Банки</div></div>
          <div className="category-button-container"><button className="category-button" onClick={() => {
            if (marker && !analysisModeIsActive) searchTypeOfObjects(position, "kindergartens");
            if (!marker) {toast.error('Укажите точку на карте для поиска по категории');}
            if (analysisModeIsActive) {toast.error('Вы не можете проводить поиск по категории пока находитесь в режиме анализа');}
          }}><img src="icons/kindergartenIcon.png" alt="Детские сады" /></button><div className="category-label">Детские сады</div></div>
          <div className="category-button-container"><button className="category-button" onClick={() => {
            if (marker && !analysisModeIsActive) searchTypeOfObjects(position, "schools");
            if (!marker) {toast.error('Укажите точку на карте для поиска по категории');}
            if (analysisModeIsActive) {toast.error('Вы не можете проводить поиск по категории пока находитесь в режиме анализа');}
          }}><img src="icons/schoolIcon.png" alt="Школы" /></button><div className="category-label">Школы</div></div>
        </div>
      </div>

      <MapContainer center={position} zoom={3} className="map-container">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapInteraction analysisModeIsActive={analysisModeIsActive} clearAllObjects={clearAllObjects} setMarker={setMarker} setPosition={setPosition} analyseNearbyInfrastructure={analyseNearbyInfrastructure} setSelection={setSelection} tempSelection={tempSelection} setTempSelection={setTempSelection} />
        {shops.map((shop) => (
          <Marker key={shop.id} position={[shop.lat, shop.lon]} icon={createCustomMarker("shop", hoveredShopId === shop.id)} ref={(ref) => (markerRefs.current[shop.id] = ref)} >
            <Popup>
              <strong>{shop.name}</strong> <br />
              🕒 {shop.hours}
            </Popup>
          </Marker>
        ))}
        {pharmacies.map((pharmacy) => (
          <Marker key={pharmacy.id} position={[pharmacy.lat, pharmacy.lon]} icon={createCustomMarker("pharmacy", hoveredPharmacyId === pharmacy.id)} ref={(ref) => (markerRefs.current[pharmacy.id] = ref)} >
            <Popup>
              <strong>{pharmacy.name}</strong> <br />
              🕒 {pharmacy.hours}
            </Popup>
          </Marker>
        ))}
        {transportNodes.map((stop_position) => (
          <Marker key={stop_position.id} position={[stop_position.lat, stop_position.lon]} icon={createCustomMarker("transportStop", hoveredTransportId === stop_position.id)} ref={(ref) => (markerRefs.current[stop_position.id] = ref)} >
            <Popup>
              <strong>{stop_position.name}</strong> <br />
            </Popup>
          </Marker>
        ))}
        {clinics.map((clinic) => (
          <Marker key={clinic.id} position={[clinic.lat, clinic.lon]} icon={createCustomMarker("hospital", hoveredClinicId === clinic.id)} ref={(ref) => (markerRefs.current[clinic.id] = ref)} >
            <Popup>
              <strong>{clinic.name}</strong> <br />
              🕒 {clinic.hours}
            </Popup>
          </Marker>
        ))}
        {malls.map((mall) => (
          <Marker key={mall.id} position={[mall.lat, mall.lon]} icon={createCustomMarker("mall", hoveredMallId === mall.id)} ref={(ref) => (markerRefs.current[mall.id] = ref)} >
            <Popup>
              <strong>{mall.name}</strong> <br />
              🕒 {mall.hours}
            </Popup>
          </Marker>
        ))}
        {parks.map((park) => (
          <Marker key={park.id} position={[park.lat, park.lon]} icon={createCustomMarker("park", hoveredParkId === park.id)} ref={(ref) => (markerRefs.current[park.id] = ref)} >
            <Popup>
              <strong>{park.name}</strong> <br />
            </Popup>
          </Marker>
        ))}
        {banks.map((bank) => (
          <Marker key={bank.id} position={[bank.lat, bank.lon]} icon={createCustomMarker("bank", hoveredBankId === bank.id)} ref={(ref) => (markerRefs.current[bank.id] = ref)} >
            <Popup>
              <strong>{bank.name}</strong> <br />
              🕒 {bank.hours}
            </Popup>
          </Marker>
        ))}
        {kindergartens.map((kindergarten) => (
          <Marker key={kindergarten.id} position={[kindergarten.lat, kindergarten.lon]} icon={createCustomMarker("kindergarten", hoveredKindergartenId === kindergarten.id)} ref={(ref) => (markerRefs.current[kindergarten.id] = ref)} >
            <Popup>
              <strong>{kindergarten.name}</strong> <br />
              🕒 {kindergarten.hours}
            </Popup>
          </Marker>
        ))}
        {schools.map((school) => (
          <Marker key={school.id} position={[school.lat, school.lon]} icon={createCustomMarker("school", hoveredSchoolId === school.id)} ref={(ref) => (markerRefs.current[school.id] = ref)} >
            <Popup>
              <strong>{school.name}</strong> <br />
              🕒 {school.hours}
            </Popup>
          </Marker>
        ))}
        {marker && (
          <Marker position={marker} icon={customIcon}>
            <Popup>Выбранная точка</Popup>
          </Marker>
        )}
        {tempSelection && (
          <Rectangle key={`react-${tempSelection.color}-${Date.now()}`} bounds={tempSelection.bounds} dashArray="4" color={tempSelection.color} fillColor={tempSelection.color} fillOpacity={0.2} />
        )}
        {selection && !selection?.bounds && (
          <Rectangle bounds={selection} color="blue" />
        )}
        {selection?.bounds && (
          <>
            <Rectangle bounds={selection.bounds} color="blue" />
            <HeatmapLayer points={selection.points} />
          </>
        )}
        {analysisModeIsActive && (
          <div className="map-tooltip">
            ℹ️ Анализ вокруг точки: Кликните ЛКМ, чтобы выбрать точку, вокруг которой будет проивзодиться анализ.
            ℹ️ Анализ в области: Нажмите ПКМ для выделения области, подтвердите ее с помощью ЛКМ. Слишком большая область будет выделена красным.
          </div>
        )}
        <ToastContainer />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
