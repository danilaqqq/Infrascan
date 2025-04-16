import { useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "./App.css";

const customSearchIcon = new L.Icon({
  iconUrl: "/icons/bankIcon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function SearchBar({ setSearchResults }) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const fetchData = async (input) => {
    if (!input) return;

    const center = map.getCenter();
    const radius = 5000;

    const queryOverpass = `
      [out:json];
      (
        node["name"~"${input}", i](around:${radius},${center.lat},${center.lng});
        way["name"~"${input}", i](around:${radius},${center.lat},${center.lng});
        relation["name"~"${input}", i](around:${radius},${center.lat},${center.lng});
      );
      out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryOverpass)}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(queryOverpass);

      const results = data.elements.map((el) => ({
        id: el.id,
        name: el.tags?.name || "Без названия",
        position: el.type === "node"
          ? [el.lat, el.lon]
          : [el.center?.lat, el.center?.lon],
      })).filter(r => r.position[0] && r.position[1]);

      setSearchResults(results);
      setSuggestions(results.slice(0, 5));

      if (results.length > 0) {
        map.flyTo(results[0].position, 16);
      }
    } catch (error) {
      console.error("Ошибка запроса Overpass API:", error);
    }
  };

  return (
    <div className="map-searchbar-wrapper">
      <div className="searchbar-container">
        <input
          className="searchbar2"
          type="text"
          placeholder="Поиск..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-button" onClick={() => fetchData(query)}>
          🔍
        </button>
      </div>
      {suggestions.length > 0 && (
        <ul className="dropdown">
          {suggestions.map((item) => (
            <li key={item.id} onClick={() => {
              map.flyTo(item.position, 16);
              setQuery(item.name);
              setSuggestions([]);
            }}>
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
