import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapComponent = () => {
  const [position, setPosition] = useState([51.505, -0.09]);
  const [location, setLocation] = useState({ country: "Неизвестно", region: "Неизвестно", city: "Неизвестно" });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);

          
          fetch("https://ipapi.co/json/")
            .then((res) => res.json())
            .then((data) => {
                console.log(data.country_name, data.region, data.city);
                setLocation({ country: data.country_name || "Неизвестно", 
                            region: data.region || "Неизвестно", 
                            city: data.city || "Неизвестно" });
            })
            .catch((error) => console.error("Ошибка API местоположения:", error));
        },
        (error) => console.error("Ошибка геолокации:", error)
      );
    }
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      {/* Левое белое поле */}
      <div style={{ width: "25%", backgroundColor: "white", padding: "20px", boxShadow: "2px 0px 5px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>📍nfrascan</h1>
        <h2 style={{ fontSize: "16px", marginBottom: "1px", fontWeight: "bold" }}>Ваше местоположение:</h2>
        <p style={{ fontSize: "16px", fontWeight: "bold" }}>
          {location.country}, {location.region}, {location.city}
        </p>
      </div>

      {/* Карта */}
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "75%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position} icon={customIcon}>
          <Popup>Вы здесь! 📍</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapComponent;
