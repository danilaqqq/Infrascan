import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png", // Иконка магазина
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const shopIconHighlighted = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45],
});

const MapComponent = () => {
  const [position, setPosition] = useState([51.505, -0.09]);
  const [location, setLocation] = useState({ country: "Неизвестно", region: "Неизвестно", city: "Неизвестно", countryCode: "xx" });
  const [shops, setShops] = useState([]);
  const [hoveredShopId, setHoveredShopId] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);

          
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

  
  const findShops = async () => {
    const [lat, lon] = position;
    const radius = 1000;

    const query = `
      [out:json];
      (
        node["shop"="supermarket"](around:${radius}, ${lat}, ${lon});
        node["shop"="convenience"](around:${radius}, ${lat}, ${lon});
      );
      out body;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.elements) {
        const foundShops = data.elements.map((shop) => ({
          id: shop.id,
          lat: shop.lat,
          lon: shop.lon,
          name: shop.tags.name || "Магазин",
          hours: shop.tags.opening_hours || "Нет информации",
          distance: getDistance(lat, lon, shop.lat, shop.lon),
        }));

        foundShops.sort((a, b) => a.distance - b.distance);
        setShops(foundShops.slice(0, 10));
        
        markerRefs.current = {};
      }
    } catch (error) {
      console.error("Ошибка при запросе магазинов:", error);
    }
  };

  
  const clearShops = () => {
      setShops([]);
  };
  
  //Формула Хаверсина
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
        <button className="shop-button" onClick={findShops}>
          Найти магазины
        </button>
        <hr className="dividerline"/>
         {shops.length > 0 && (
          <>
            <button className="clear-button" onClick={clearShops}>
              ✖ Очистить
            </button>
            <ul className="shop-list">
              {shops.map((shop) => (
                <li key={shop.id} 
                className="shop-item" 
                onMouseEnter={() => {setHoveredShopId(shop.id); if (markerRefs.current[shop.id]) {markerRefs.current[shop.id].openPopup();}}} 
                onMouseLeave={() => {setHoveredShopId(null); if (markerRefs.current[shop.id]) {markerRefs.current[shop.id].closePopup();}}}>
                  <strong>{shop.name}</strong>
                  <p>🕒 {shop.hours}</p>
                  <p>↔️ {shop.distance} метров</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <MapContainer center={position} zoom={13} className="map-container">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position} icon={customIcon}>
          <Popup>Вы здесь! 📍</Popup>
        </Marker>
        {shops.map((shop) => (
          <Marker key={shop.id} position={[shop.lat, shop.lon]} icon={hoveredShopId === shop.id ? shopIconHighlighted : shopIcon} ref={(ref) => (markerRefs.current[shop.id] = ref)} >
            <Popup>
              <strong>{shop.name}</strong> <br />
              🕒 {shop.hours}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
