import { useState, useEffect, useRef, useMapEvents } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";
import ClickableMap from "./ClickableMap";

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


// Создание маркера с учётом типа и выделенности
const createCustomMarker = (type, isHighlighted = false) => {
  const iconSize = isHighlighted ? [45, 45] : [30, 30]; // Размер зависит от выделенности
  const iconAnchor = [iconSize[0] / 2, iconSize[1]];
  const popupAnchor = [0, -iconSize[1]]; 

  return new L.Icon({
    iconUrl: `/icons/${type}Icon.png`,
    iconSize,
    iconAnchor,
    popupAnchor,
  });
};

const MapComponent = () => {
  const [position, setPosition] = useState([23.3345, 9.0598]);
  const [location, setLocation] = useState({ country: "Неизвестно", region: "Неизвестно", city: "Неизвестно", countryCode: "xx" });
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

  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          //const { latitude, longitude } = pos.coords;
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
  

  const findShops = async () => {
    //clearAllObjects();
    const {lat, lng} = position;
    const radius = 1000;

    const query = `
      [out:json];
      (
        node["shop"="supermarket"](around:${radius}, ${lat}, ${lng});
        node["shop"="convenience"](around:${radius}, ${lat}, ${lng});
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
          distance: getDistance(lat, lng, shop.lat, shop.lon),
        }));

        foundShops.sort((a, b) => a.distance - b.distance);
        setShops(foundShops.slice(0, 10));
        
        markerRefs.current = {};
      }
    } catch (error) {
      console.error("Ошибка при запросе магазинов:", error);
    }
  };

  /*const findObjectsByCategory = async (objectsCategory) => {
    clearAllObjects();
    
    const [lat, lng] = position;
    searchRadius = categoriesRadius.objectsCategory;
    
    const categoriesQuery =
    {
      shops: 'node[shop=supermarket], node[shop=convenience]',
      pharmacies: 'node[amenity=pharmacy]',
      transport_nodes: 'node["public_transport"="stop_position"]',
      clinics: 'node["amenity"~"clinic|hospital"]',
      
    }

    const query = categoryQueries[category] || '';

    const overpassQuery = `
      [out:json];
      (
        ${query}(around:${searchRadius}, ${lat}, ${lng});
      );
      out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

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
          distance: getDistance(lat, lng, shop.lat, shop.lon),
        }));

        foundShops.sort((a, b) => a.distance - b.distance);
        setShops(foundShops.slice(0, 10));
        
        markerRefs.current = {};
      }
    } catch (error) {
      console.error("Ошибка при запросе магазинов:", error);
    }
  };*/


  const analyseNearbyInfrastructure = async () => {

    const {lat, lng} = position;
    console.log(lat, lng);

    const overpassQuery = `
        [out:json];
        (
            node["shop"="supermarket"](around:${categoriesRadius.shops}, ${lat}, ${lng});
            node["shop"="convenience"](around:${categoriesRadius.shops}, ${lat}, ${lng});
            
            node["amenity"="pharmacy"](around:${categoriesRadius.pharmacies},${lat},${lng});
            
            node["public_transport"="stop_position"](around:${categoriesRadius.transport_nodes},${lat},${lng});
            
            node["amenity"~"clinic|hospital"](around:${categoriesRadius.clinics},${lat},${lng});
            
            node["shop"="mall"](around:${categoriesRadius.malls},${lat},${lng});
            way["shop"="mall"](around:${categoriesRadius.malls},${lat},${lng});
            relation["shop"="mall"](around:${categoriesRadius.malls},${lat},${lng});

            way["leisure"="park"](around:${categoriesRadius.parks},${lat},${lng});
            relation["leisure"="park"](around:${categoriesRadius.parks},${lat},${lng});

            node["amenity"="bank"](around:${categoriesRadius.banks},${lat},${lng});

            node["amenity"="kindergarten"](around:${categoriesRadius.kindergartens},${lat},${lng});
            way["amenity"="kindergarten"](around:${categoriesRadius.kindergartens},${lat},${lng});
            relation["amenity"="kindergarten"](around:${categoriesRadius.kindergartens},${lat},${lng});

            node["amenity"="school"](around:${categoriesRadius.schools},${lat},${lng});
            way["amenity"="school"](around:${categoriesRadius.schools},${lat},${lng});
            relation["amenity"="school"](around:${categoriesRadius.schools},${lat},${lng});
        );
        out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Обрабатываем результаты
        if (data.elements) {
          console.log(data.elements)
          const foundShops = data.elements
          .filter((el) => el.tags.shop)
          .map((shop) => ({
            id: shop.id,
            lat: shop.lat,
            lon: shop.lon,
            name: shop.tags.name || "Магазин",
            hours: shop.tags.opening_hours || "Нет информации",
            distance: getDistance(lat, lng, shop.lat, shop.lon),
          }));
          const foundPharmacies = data.elements
          .filter((el) => el.tags.amenity === "pharmacy")
          .map((pharmacy) => ({
            id: pharmacy.id,
            lat: pharmacy.lat,
            lon: pharmacy.lon,
            name: pharmacy.tags.name || "Аптека",
            hours: pharmacy.tags.opening_hours || "Нет информации",
            distance: getDistance(lat, lng, pharmacy.lat, pharmacy.lon),
          }));
          const foundTransportNodes = data.elements
          .filter((el) => el.tags.public_transport === "stop_position")
          .map((stop_position) => ({
            id: stop_position.id,
            lat: stop_position.lat,
            lon: stop_position.lon,
            name: stop_position.tags.name || "Остановка",
            distance: getDistance(lat, lng, stop_position.lat, stop_position.lon),
          }));
          const foundClinics = data.elements
          .filter((el) => el.tags.amenity === "clinic")
          .map((clinic) => ({
            id: clinic.id,
            lat: clinic.lat,
            lon: clinic.lon,
            name: clinic.tags.name || "Поликлиника",
            hours: clinic.tags.opening_hours || "Нет информации",
            distance: getDistance(lat, lng, clinic.lat, clinic.lon),
          }));
          const foundMalls = data.elements
          .filter((el) => el.tags.shop === "mall")
          .map((mall) => ({
            id: mall.id,
            lat: mall.lat ?? mall.center?.lat,
            lon: mall.lon ?? mall.center?.lon,
            name: mall.tags.name || "Торговый центр",
            hours: mall.tags.opening_hours || "Нет информации",
            distance: getDistance(lat, lng, mall.lat ?? mall.center?.lat, mall.lon ?? mall.center?.lon),
          }));
          const foundParks = data.elements
          .filter((el) => el.tags.leisure === "park")
          .map((park) => ({
            id: park.id,
            lat: park.lat ?? park.center?.lat,
            lon: park.lon ?? park.center?.lon,
            name: park.tags.name || "Парк",
            distance: getDistance(lat, lng, park.lat ?? park.center?.lat, park.lon ?? park.center?.lon),
          }));
          const foundBanks = data.elements
          .filter((el) => el.tags.amenity === "bank")
          .map((bank) => ({
            id: bank.id,
            lat: bank.lat,
            lon: bank.lon,
            name: bank.tags.name || "Банк",
            hours: bank.tags.opening_hours || "Нет информации",
            distance: getDistance(lat, lng, bank.lat, bank.lon),
          }));
          
          const foundKindergartens = data.elements
          .filter((el) => el.tags.amenity === "kindergarten")
          .map((kindergarten) => ({
            id: kindergarten.id,
            lat: kindergarten.lat ?? kindergarten.center?.lat,
            lon: kindergarten.lon ?? kindergarten.center?.lon,
            name: kindergarten.tags.name || "Детский сад",
            hours: kindergarten.tags.opening_hours || "Нет информации",
            distance: getDistance(lat, lng, kindergarten.lat ?? kindergarten.center?.lat, kindergarten.lon ?? kindergarten.center?.lon),
          }));

          const foundSchools = data.elements
          .filter((el) => el.tags.amenity === "school")
          .map((school) => ({
            id: school.id,
            lat: school.lat ?? school.center?.lat,
            lon: school.lon ?? school.center?.lon,
            name: school.tags.name || "Школа",
            hours: school.tags.opening_hours || "Нет информации",
            distance: getDistance(lat, lng, school.lat ?? school.center?.lat, school.lon ?? school.center?.lon),
          }));

          foundShops.sort((a, b) => a.distance - b.distance);
          setShops(foundShops.slice(0, 1));
          console.log(foundShops);

          foundPharmacies.sort((a, b) => a.distance - b.distance);
          setPharmacies(foundPharmacies.slice(0, 1));

          foundTransportNodes.sort((a, b) => a.distance - b.distance);
          setTransportNodes(foundTransportNodes.slice(0, 1));

          foundClinics.sort((a, b) => a.distance - b.distance);
          setClinics(foundClinics.slice(0, 1));

          foundMalls.sort((a, b) => a.distance - b.distance);
          setMalls(foundMalls.slice(0, 1));

          foundParks.sort((a, b) => a.distance - b.distance);
          setParks(foundParks.slice(0, 1));
          
          foundBanks.sort((a, b) => a.distance - b.distance);
          setBanks(foundBanks.slice(0, 1));

          foundKindergartens.sort((a, b) => a.distance - b.distance);
          setKindergartens(foundKindergartens.slice(0, 1));

          foundSchools.sort((a, b) => a.distance - b.distance);
          setSchools(foundSchools.slice(0, 1));

          markerRefs.current = {};
        }
    } catch (error) {
        console.error("Ошибка загрузки данных Overpass:", error);
        return null;
    }
  }

  const clearAllObjects = (animation) => {
    setIsRemoving(true); // Добавляем класс `removing`
  
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
    }, 1000); // Ждем завершения fadeOut (0.5s)
  };

  //Формула Хаверсина
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dlng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dlng / 2) *
        Math.sin(dlng / 2);
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
        <button className="analysis-button" onClick={analyseNearbyInfrastructure}>
          Анализ инфраструктуры
        </button>
        <hr className="dividerline"/>
         {shops.length > 0 && (
          <>
            <button className="clear-button" onClick={clearAllObjects}>
              ✖ Очистить
            </button>
            <ul className={`shop-list ${isRemoving ? "removing" : ""}`}>
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
              {pharmacies.map((pharmacy) => (
                <li key={pharmacy.id} 
                className="shop-item" 
                onMouseEnter={() => {setHoveredPharmacyId(pharmacy.id); if (markerRefs.current[pharmacy.id]) {markerRefs.current[pharmacy.id].openPopup();}}} 
                onMouseLeave={() => {setHoveredPharmacyId(null); if (markerRefs.current[pharmacy.id]) {markerRefs.current[pharmacy.id].closePopup();}}}>
                  <strong>{pharmacy.name}</strong>
                  <p>🕒 {pharmacy.hours}</p>
                  <p>↔️ {pharmacy.distance} метров</p>
                </li>
              ))}
              {transportNodes.map((stop_position) => (
                <li key={stop_position.id} 
                className="shop-item" 
                onMouseEnter={() => {setHoveredTransportId(stop_position.id); if (markerRefs.current[stop_position.id]) {markerRefs.current[stop_position.id].openPopup();}}} 
                onMouseLeave={() => {setHoveredTransportId(null); if (markerRefs.current[stop_position.id]) {markerRefs.current[stop_position.id].closePopup();}}}>
                  <strong>{stop_position.name}</strong>
                  <p>↔️ {stop_position.distance} метров</p>
                </li>
              ))}
              {clinics.map((clinic) => (
                <li key={clinic.id} 
                className="shop-item" 
                onMouseEnter={() => {setHoveredClinicId(clinic.id); if (markerRefs.current[clinic.id]) {markerRefs.current[clinic.id].openPopup();}}} 
                onMouseLeave={() => {setHoveredClinicId(null); if (markerRefs.current[clinic.id]) {markerRefs.current[clinic.id].closePopup();}}}>
                  <strong>{clinic.name}</strong>
                  <p>🕒 {clinic.hours}</p>
                  <p>↔️ {clinic.distance} метров</p>
                </li>
              ))}
              {malls.map((mall) => (
                <li key={mall.id} 
                className="shop-item" 
                onMouseEnter={() => {setHoveredMallId(mall.id); if (markerRefs.current[mall.id]) {markerRefs.current[mall.id].openPopup();}}} 
                onMouseLeave={() => {setHoveredMallId(null); if (markerRefs.current[mall.id]) {markerRefs.current[mall.id].closePopup();}}}>
                  <strong>{mall.name}</strong>
                  <p>🕒 {mall.hours}</p>
                  <p>↔️ {mall.distance} метров</p>
                </li>
              ))}
              {parks.map((park) => (
                <li key={park.id} 
                className="shop-item" 
                onMouseEnter={() => {setHoveredParkId(park.id); if (markerRefs.current[park.id]) {markerRefs.current[park.id].openPopup();}}} 
                onMouseLeave={() => {setHoveredParkId(null); if (markerRefs.current[park.id]) {markerRefs.current[park.id].closePopup();}}}>
                  <strong>{park.name}</strong>
                  <p>↔️ {park.distance} метров</p>
                </li>
              ))}
              {banks.map((bank) => (
                <li key={bank.id} 
                className="shop-item" 
                onMouseEnter={() => {setHoveredBankId(bank.id); if (markerRefs.current[bank.id]) {markerRefs.current[bank.id].openPopup();}}} 
                onMouseLeave={() => {setHoveredBankId(null); if (markerRefs.current[bank.id]) {markerRefs.current[bank.id].closePopup();}}}>
                  <strong>{bank.name}</strong>
                  <p>🕒 {bank.hours}</p>
                  <p>↔️ {bank.distance} метров</p>
                </li>
              ))}
              {kindergartens.map((kindergarten) => (
                <li key={kindergarten.id} 
                className="shop-item" 
                onMouseEnter={() => {setHoveredKindergartenId(kindergarten.id); if (markerRefs.current[kindergarten.id]) {markerRefs.current[kindergarten.id].openPopup();}}} 
                onMouseLeave={() => {setHoveredKindergartenId(null); if (markerRefs.current[kindergarten.id]) {markerRefs.current[kindergarten.id].closePopup();}}}>
                  <strong>{kindergarten.name}</strong>
                  <p>🕒 {kindergarten.hours}</p>
                  <p>↔️ {kindergarten.distance} метров</p>
                </li>
              ))}
              {schools.map((school) => (
                <li key={school.id} 
                className="shop-item" 
                onMouseEnter={() => {setHoveredSchoolId(school.id); if (markerRefs.current[school.id]) {markerRefs.current[school.id].openPopup();}}} 
                onMouseLeave={() => {setHoveredSchoolId(null); if (markerRefs.current[school.id]) {markerRefs.current[school.id].closePopup();}}}>
                  <strong>{school.name}</strong>
                  <p>🕒 {school.hours}</p>
                  <p>↔️ {school.distance} метров</p>
                </li>
              ))}
            </ul>
            <hr className="dividerline"/>
          </>
        )}

        <div className="category-buttons-grid">
          <div className="category-button-container"><button className="category-button" onClick={findShops}><img src="icons/shopIcon.png" alt="Магазины"/></button><div className="category-label">Магазины</div></div>
          <div className="category-button-container"><button className="category-button" onClick={findShops}><img src="icons/pharmacyIcon.png" alt="Аптеки"/></button><div className="category-label">Аптеки</div></div>
          <div className="category-button-container"><button className="category-button" onClick={findShops}><img src="icons/transportStopIcon.png" alt="Транспорт"/></button><div className="category-label">Транспорт</div></div>
          <div className="category-button-container"><button className="category-button" onClick={findShops}><img src="icons/hospitalIcon.png" alt="Поликлиники"/></button><div className="category-label">Поликлиники</div></div>
          <div className="category-button-container"><button className="category-button" onClick={findShops}><img src="icons/mallIcon.png" alt="Торговые центры"/></button><div className="category-label">Торговые центры</div></div>
          <div className="category-button-container"><button className="category-button" onClick={findShops}><img src="icons/parkIcon.png" alt="Парки"/></button><div className="category-label">Парки</div></div>
          <div className="category-button-container"><button className="category-button" onClick={findShops}><img src="icons/bankIcon.png" alt="Банки"/></button><div className="category-label">Банки</div></div>
          <div className="category-button-container"><button className="category-button" onClick={findShops}><img src="icons/kindergartenIcon.png" alt="Детские сады"/></button><div className="category-label">Детские сады</div></div>
          <div className="category-button-container"><button className="category-button" onClick={findShops}><img src="icons/schoolIcon.png" alt="Школы"/></button><div className="category-label">Школы</div></div>
        </div>
      </div>

      <ClickableMap position={position} setPosition={setPosition} customIcon={customIcon}>
        
        {shops.map((shop) => (
          <Marker key={shop.id} position={[shop.lat, shop.lon]} icon={createCustomMarker("shop", hoveredShopId === shop.id)}  ref={(ref) => (markerRefs.current[shop.id] = ref)} >
            <Popup>
              <strong>{shop.name}</strong> <br />
              🕒 {shop.hours}
            </Popup>
          </Marker>
        ))}
        {pharmacies.map((pharmacy) => (
          <Marker key={pharmacy.id} position={[pharmacy.lat, pharmacy.lon]} icon={createCustomMarker("pharmacy", hoveredPharmacyId === pharmacy.id)}  ref={(ref) => (markerRefs.current[pharmacy.id] = ref)} >
            <Popup>
              <strong>{pharmacy.name}</strong> <br />
              🕒 {pharmacy.hours}
            </Popup>
          </Marker>
        ))}
        {transportNodes.map((stop_position) => (
          <Marker key={stop_position.id} position={[stop_position.lat, stop_position.lon]} icon={createCustomMarker("transportStop", hoveredTransportId === stop_position.id)}  ref={(ref) => (markerRefs.current[stop_position.id] = ref)} >
            <Popup>
              <strong>{stop_position.name}</strong> <br />
            </Popup>
          </Marker>
        ))}
        {clinics.map((clinic) => (
          <Marker key={clinic.id} position={[clinic.lat, clinic.lon]} icon={createCustomMarker("hospital", hoveredClinicId === clinic.id)}  ref={(ref) => (markerRefs.current[clinic.id] = ref)} >
            <Popup>
              <strong>{clinic.name}</strong> <br />
              🕒 {clinic.hours}
            </Popup>
          </Marker>
        ))}
        {malls.map((mall) => (
          <Marker key={mall.id} position={[mall.lat, mall.lon]} icon={createCustomMarker("mall", hoveredMallId === mall.id)}  ref={(ref) => (markerRefs.current[mall.id] = ref)} >
            <Popup>
              <strong>{mall.name}</strong> <br />
              🕒 {mall.hours}
            </Popup>
          </Marker>
        ))}
        {parks.map((park) => (
          <Marker key={park.id} position={[park.lat, park.lon]} icon={createCustomMarker("park", hoveredParkId === park.id)}  ref={(ref) => (markerRefs.current[park.id] = ref)} >
            <Popup>
              <strong>{park.name}</strong> <br />
            </Popup>
          </Marker>
        ))}
        {banks.map((bank) => (
          <Marker key={bank.id} position={[bank.lat, bank.lon]} icon={createCustomMarker("bank", hoveredBankId === bank.id)}  ref={(ref) => (markerRefs.current[bank.id] = ref)} >
            <Popup>
              <strong>{bank.name}</strong> <br />
              🕒 {bank.hours}
            </Popup>
          </Marker>
        ))}
        {kindergartens.map((kindergarten) => (
          <Marker key={kindergarten.id} position={[kindergarten.lat, kindergarten.lon]} icon={createCustomMarker("kindergarten", hoveredKindergartenId === kindergarten.id)}  ref={(ref) => (markerRefs.current[kindergarten.id] = ref)} >
            <Popup>
              <strong>{kindergarten.name}</strong> <br />
              🕒 {kindergarten.hours}
            </Popup>
          </Marker>
        ))}
        {schools.map((school) => (
          <Marker key={school.id} position={[school.lat, school.lon]} icon={createCustomMarker("school", hoveredSchoolId === school.id)}  ref={(ref) => (markerRefs.current[school.id] = ref)} >
            <Popup>
              <strong>{school.name}</strong> <br />
              🕒 {school.hours}
            </Popup>
          </Marker>
        ))}
      </ClickableMap>
    </div>
  );
};

export default MapComponent;
