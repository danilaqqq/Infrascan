import { useRef, useState } from "react";
import L from "leaflet";
import "./SearchComponent.css";
import { toast, ToastContainer } from 'react-toastify'

export default function SearchBar({ map, setSearchResults }) {
  
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const fetchData = async (input) => {
    if (!input) return;

    const center = map.getCenter();
    const radius = 2000;

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
        hours: el.tags.opening_hours || "Нет информации",
      })).filter(r => r.position[0] && r.position[1]);

      setSearchResults(results);
      console.log(results);
      //setSuggestions(results.slice(0, 5));

      if (results.length > 0) {
        map.flyTo(results[0].position, 16);
      }
      else toast.info("К сожалению, не удалось найти объект с таким названием в радиусе " + radius + " метров");
    } catch (error) {
      console.error("Ошибка запроса Overpass API:", error);
    }
  };

  return (
    <div className="map-searchbar-wrapper">
      <div className="searchbar-container">
        <input
          className="searchbar"
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
              //setQuery(item.name);
              //setSuggestions([]);
            }}>
              {item.name}
            </li>
          ))}
        </ul>
      )}
      <ToastContainer autoClose={8000}/>
    </div>
  );
}