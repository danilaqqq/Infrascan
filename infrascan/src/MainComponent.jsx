import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./SidebarComponent";
import MapComponent from "./MapComponent";
import {infrastructureCategories } from './InfrastructureCategories';
import "./MapComponent.css";
import L from "leaflet";
import { toast, ToastContainer } from 'react-toastify'
import "leaflet/dist/leaflet.css"

const MainComponent = () => {
    const [position, setPosition] = useState([23.3345, 9.0598]);
    const [location, setLocation] = useState({ country: "Неизвестно", region: "Неизвестно", city: "Неизвестно", countryCode: "xx" });
    const [weather, setWeather] = useState({temp: null, descriptiion: "", icon: ""});
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

    const [searchResults, setSearchResults] = useState([]);
    const [hoveredSearchResultsId, setHoveredSearchResultId] = useState(null);

    const [isRemoving, setIsRemoving] = useState(false);

    const [map, setMap] = useState(null);

    let analysisAbortController = null;
    let latestAnalysisRequestId = 0;
    const analysisAbortControllerRef = useRef(null);

    const [activeFilters, setActiveFilters] = useState([]);

    const markerRefs = useRef({});

    // Определение местоположения
    /*useEffect(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
            const { latitude, longitude } = pos.coords;

            fetch("https://ipwho.is/?lang=ru")
                .then((res) => res.json())
                .then((data) => {
                console.log(data.country, data.region, data.city, data.country_code);
                setLocation({
                    country: data.country || "Неизвестно",
                    region: data.region || "Неизвестно",
                    city: data.city || "Неизвестно",
                    countryCode: data.country_code.toLowerCase() || ""
                });
                })
                .catch((error) => console.error("Ошибка API местоположения:", error));
            },
            (error) => console.error("Ошибка геолокации:", error)
        );
      }
    }, []);*/

    useEffect(() => {
      const API_KEY = "8704b97c194f64383768b293c3022e0d";
    
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {
            // Получение геолокации
            fetch("https://ipwho.is/?lang=ru")
              .then((res) => res.json())
              .then((data) => {
                const { country, region, city, country_code, latitude, longitude } = data;
    
                setLocation({
                  country: country || "Неизвестно",
                  region: region || "Неизвестно",
                  city: city || "Неизвестно",
                  countryCode: country_code?.toLowerCase() || ""
                });
    
                // Запрос к погодному API
                return fetch(
                  `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=ru&appid=${API_KEY}`
                );
              })
              .then((res) => res.json())
              .then((weatherData) => {
                console.log("Погода:", weatherData);
    
                setWeather({
                  temp: Math.round(weatherData.main.temp),
                  description: weatherData.weather[0].description,
                  icon: weatherData.weather[0].icon
                });
              })
              .catch((error) => console.error("Ошибка при получении данных:", error));
          },
          (error) => console.error("Ошибка геолокации:", error)
        );
      }
    }, []);
    

    // Создание кастомного маркера
    const customIcon = new L.Icon({
        iconUrl: "/icons/marker-icon.png",
        shadowUrl: "/icons/marker-shadow.png",
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

    // Таймаут для запросов
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    // Отправка API запросов
    const fetchOverpass = async (rawQuery, signal) => {
      const cleanedQuery = rawQuery.replace(/\s+/g, ' ').trim();
      const finalQuery = `[out:json];(${cleanedQuery});out center;`;
      const encodedQuery = `data=${encodeURIComponent(finalQuery)}`;
      console.log("QUERY:", cleanedQuery);

      const response = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: {
          "Content-Type": "application/x-www-form-urlencoded"
          },
          body: encodedQuery,
          signal,
      });

      if (!response.ok) {
          const errorText = await response.text(); // для отладки
          console.error("Overpass error response:", errorText);
          throw new Error(`Overpass error: ${response.status}`);
      }

      const data = await response.json();
      return data.elements || [];
    };


    // Отправка и обработка API запросов
    const sendAndGetAPIRequestResult = async (latlng) => {
    const { lat, lng } = latlng;
    const result = {};
    
    if (analysisAbortControllerRef.current) {
      analysisAbortControllerRef.current.abort();
    }
    analysisAbortControllerRef.current = new AbortController();
    const { signal } = analysisAbortControllerRef.current;

    for (const category of infrastructureCategories) {
        await sleep(500); // задержка между запросами
        try {
        const query = category.query(lat, lng, category.radius);
        const elements = await fetchOverpass(query, signal);
        result[category.key] = category.parser(elements, lat, lng);
        } catch (error) {
        if (error.name === "AbortError") {
            console.log(`Запрос ${category.key} прерван`);
        } else {
            console.error(`Ошибка при загрузке категории - ${category.key}:`, error);
        }
        }
    }

    return result;
    }

    // Отправка и обработка конкретных API запросов
    const sendAndGetAPIRequestResultSpecific = async (latlng, categoryKey) => {
    const { lat, lng } = latlng;
    const result = {};

    if (analysisAbortControllerRef.current) {
      analysisAbortControllerRef.current.abort();
    }
    analysisAbortControllerRef.current = new AbortController();
    const { signal } = analysisAbortControllerRef.current;

    const category = infrastructureCategories.find((c) => c.key === categoryKey);

    if (!category) {
        throw new Error(`Категория "${categoryKey}" не найдена.`);
    }

    const query = category.query(lat, lng, category.radius);

    try {
        const elements = await fetchOverpass(query, signal);
        const parsed = category.parser(elements, lat, lng);
        return parsed;
    } catch (error) {
        console.error(`Ошибка при загрузке категории - ${categoryKey}:`, error);
        return [];
    }
    }

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
    
    const notFoundCategory = {
        shops: 'магазины',
        pharmacies: 'аптеки',
        transport: 'остановки транспорта',
        clinics: 'медучереждения',
        malls: 'торговые центры',
        parks: 'парки',
        banks: 'банки',
        kindergartens: 'детские сады',
        schools: 'школы',
      };
    
    const analyseNearbyInfrastructure = async (latlng) => {
    
          //clearAllObjects();
          
          const currentRequestId = ++latestAnalysisRequestId; // увеличиваем каждый раз
          let data;
          let notFoundErr = "";
    
          try {
            data = await sendAndGetAPIRequestResult(latlng);
          } catch (err) {
            if (err.name === "AbortError") {
              console.log("Анализ прерван пользователем");
            } else {
              console.error("Ошибка при анализе:", err);
            }
            return;
          }
    
          // Если в момент завершения запроса это уже неактуальный вызов — игнорируем
          if (currentRequestId !== latestAnalysisRequestId) {
            console.log("Результат анализа устарел, игнорируется");
            return;
          }

          const foundShops = data.shops;
          if(foundShops != null)
          {
            if(foundShops.length == 0) notFoundErr += ", " + notFoundCategory.shops;
            else
            {
              foundShops.sort((a, b) => a.distance - b.distance);
              setShops(foundShops.slice(0, 3));
            }
          }
    
          const foundPharmacies = data.pharmacies;
          if(foundPharmacies != null)
          {
            if(foundPharmacies.length == 0) notFoundErr += ", " + notFoundCategory.pharmacies;
            else
            {
              foundPharmacies.sort((a, b) => a.distance - b.distance);
              setPharmacies(foundPharmacies.slice(0, 3));
            }
          }
    
          const foundTransportNodes = data.transport;
          if(foundTransportNodes != null)
          {
            if(foundTransportNodes.length == 0) notFoundErr += ", " + notFoundCategory.transport;
            else
            {
              foundTransportNodes.sort((a, b) => a.distance - b.distance);
              setTransportNodes(foundTransportNodes.slice(0, 3));
            }
          }
    
          const foundClinics = data.clinics;
          if(foundClinics != null)
          {
            if(foundClinics.length == 0) notFoundErr += ", " + notFoundCategory.clinics;
            else
            {
              foundClinics.sort((a, b) => a.distance - b.distance);
              setClinics(foundClinics.slice(0, 3));
            }
          }
    
          const foundMalls = data.malls;
          if(foundMalls != null)
          {
            if(foundMalls.length == 0) notFoundErr += ", " + notFoundCategory.malls;
            else
            {
              foundMalls.sort((a, b) => a.distance - b.distance);
              setMalls(foundMalls.slice(0, 3));
            }
          }
    
          const foundParks = data.parks;
          if(foundParks != null)
          {
            if(foundParks.length == 0) notFoundErr += ", " + notFoundCategory.parks;
            else
            {
              foundParks.sort((a, b) => a.distance - b.distance);
              setParks(foundParks.slice(0, 3));
            }
          }
    
          const foundBanks = data.banks;
          if(foundBanks != null)
          {
            if(foundBanks.length == 0) notFoundErr += ", " + notFoundCategory.banks;
            else
            {
              foundBanks.sort((a, b) => a.distance - b.distance);
              setBanks(foundBanks.slice(0, 3));
            }
          }
    
          const foundKindergartens = data.kindergartens;
          if(foundKindergartens != null)
          {
            if(foundKindergartens.length == 0) notFoundErr += ", " + notFoundCategory.kindergartens;
            else
            {
              foundKindergartens.sort((a, b) => a.distance - b.distance);
              setKindergartens(foundKindergartens.slice(0, 3));
            }
          }
    
          const foundSchools = data.schools;
          if(foundSchools != null)
          {
            if(foundSchools.length == 0) notFoundErr += ", " + notFoundCategory.schools;
            else
            {
              foundSchools.sort((a, b) => a.distance - b.distance);
              setSchools(foundSchools.slice(0, 3));
            }
          }
          
          if(notFoundErr.length > 1) toast.info(`К сожалению${notFoundErr} не найдены поблизости.`);
          notFoundErr = "";
    
          markerRefs.current = {};
      }
    
    const fetchInfrastructureInBounds = async (bounds) => {
        const [sw, ne] = bounds;
        const result = {};
        const currentRequestId = ++latestAnalysisRequestId;
        let notFoundCounter = 0;
    
        const minLat = Math.min(sw.lat, ne.lat);
        const maxLat = Math.max(sw.lat, ne.lat);
        const minLng = Math.min(sw.lng, ne.lng);
        const maxLng = Math.max(sw.lng, ne.lng);
      
        const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;
      
        if (analysisAbortControllerRef.current) {
          analysisAbortControllerRef.current.abort();
        }
        analysisAbortControllerRef.current = new AbortController();
        const { signal } = analysisAbortControllerRef.current;
      
        if (currentRequestId !== latestAnalysisRequestId) {
          console.log("Результат анализа устарел, игнорируется");
          return;
        }
    
        for (const category of infrastructureCategories) {
          await sleep(500); // задержка между запросами
          try {
            const setter = categorySetters[category.key];
            const query = category.areaQuery(bbox);
            const elements = await fetchOverpass(query, signal);
            result[category.key] = category.areaParser(elements);
            setter(result[category.key]);
            console.log(result);
            if(!result[category.key] || result[category.key].length === 0) notFoundCounter++;
            console.log(notFoundCounter);
          } catch (error) {
            if (error.name === "AbortError") {
              console.log(`Запрос ${category.key} прерван`);
            } else {
              console.error(`Ошибка при загрузке категории - ${category.key}:`, error);
            }
          }
        }
        console.log(infrastructureCategories.length);
        if(notFoundCounter == infrastructureCategories.length) toast.info(`Не удалось найти никакую инфраструктуру в области.`);
      };
    
    const searchTypeOfObjects = async (latlng, category) => {
        clearAllObjects();
    
        const setter = categorySetters[category];
        const notFoundErr = notFoundCategory[category];
    
        const currentRequestId = ++latestAnalysisRequestId; // увеличиваем каждый раз
        let data;
    
        try {
          data = await sendAndGetAPIRequestResultSpecific(latlng, category);
        } catch (err) {
           if (err.name === "AbortError") {
            console.log("Анализ прерван пользователем");
          } else {
            console.error("Ошибка при анализе:", err);
          }
          return;
        }
    
        // Если в момент завершения запроса это уже неактуальный вызов — игнорируем
        if (currentRequestId !== latestAnalysisRequestId) {
          console.log("Результат анализа устарел, игнорируется");
          return;
        }
    
        if(data.length == 0) {
          toast.info(`К сожалению, ${notFoundErr} не найдены поблизости.`);
          return;
        }
        data.sort((a, b) => a.distance - b.distance);
        if (setter) {
          setter(data.slice(0, 10));
        } else {
          console.warn(`Нет функции setter для категории "${category}"`);
        }    
    
        markerRefs.current = {};
      }

    const toggleFilter = (category) => {
        setActiveFilters((prevFilters) => {
          if (prevFilters.includes(category)) {
            return prevFilters.filter((item) => item !== category);
          } else {
            return [...prevFilters, category];
          }
        });
      };

    const shouldShowCategory = (category) => {
        return activeFilters.length === 0 || activeFilters.includes(category);
      };

    const switchHoursToRus = (hours) => {
        const daysMap = {
          Mo: 'Пн',
          Tu: 'Вт',
          We: 'Ср',
          Th: 'Чт',
          Fr: 'Пт',
          Sa: 'Сб',
          Su: 'Вс'
        };
      
        return hours.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, match => daysMap[match]);
      }

    const clearSelections = () => {
    setSelection(null);
    setTempSelection(null);
    setAnalysisModeIsActive(false);
    clearAllObjects();

    if (analysisAbortControllerRef.current) {
      analysisAbortControllerRef.current.abort();
      analysisAbortControllerRef.current = null;
    }
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

      setSearchResults([]);

      setActiveFilters([]);
      setIsRemoving(false);
    }, 300);
  };
  
  
    return (
        <div className="container">
          <Sidebar
                location={location} 
                weather={weather}
                marker={marker}
                position={position}
                shops={shops}
                pharmacies={pharmacies}
                transportNodes={transportNodes}
                clinics={clinics}
                malls={malls}
                parks={parks}
                banks={banks}
                kindergartens={kindergartens}
                schools={schools}
                setHoveredShopId={setHoveredShopId}
                setHoveredPharmacyId={setHoveredPharmacyId}
                setHoveredTransportId={setHoveredTransportId}
                setHoveredClinicId={setHoveredClinicId}
                setHoveredMallId={setHoveredMallId}
                setHoveredParkId={setHoveredParkId}
                setHoveredBankId={setHoveredBankId}
                setHoveredKindergartenId={setHoveredKindergartenId}
                setHoveredSchoolId={setHoveredSchoolId}
                setHoveredSearchResultId={setHoveredSearchResultId}
                isRemoving={isRemoving}
                analysisModeIsActive={analysisModeIsActive}
                setAnalysisModeIsActive={setAnalysisModeIsActive}
                clearSelections={clearSelections}
                clearAllObjects={clearAllObjects}
                searchTypeOfObjects={searchTypeOfObjects}
                analyseNearbyInfrastructure={analyseNearbyInfrastructure}
                markerRefs={markerRefs}
                searchResults={searchResults}
                activeFilters={activeFilters}
                toggleFilter={toggleFilter}
                shouldShowCategory={shouldShowCategory}
                map={map}
                setSearchResults={setSearchResults}
                selection={selection}
                tempSelection={tempSelection}
                switchHoursToRus={switchHoursToRus}
          />
          <MapComponent
                position={position}
                marker={marker}
                searchResults={searchResults}
                shops={shops}
                pharmacies={pharmacies}
                transportNodes={transportNodes}
                clinics={clinics}
                malls={malls}
                parks={parks}
                banks={banks}
                kindergartens={kindergartens}
                schools={schools}
                selection={selection}
                tempSelection={tempSelection}
                createCustomMarker={createCustomMarker}
                customIcon={customIcon}
                hoveredShopId={hoveredShopId}
                hoveredPharmacyId={hoveredPharmacyId}
                hoveredTransportId={hoveredTransportId}
                hoveredClinicId={hoveredClinicId}
                hoveredMallId={hoveredMallId}
                hoveredParkId={hoveredParkId}
                hoveredBankId={hoveredBankId}
                hoveredKindergarten={hoveredKindergartenId}
                hoveredSchoolId={hoveredSchoolId}
                hoveredSearchResultId={hoveredSearchResultsId}
                markerRefs={markerRefs}
                analysisModeIsActive={analysisModeIsActive}
                clearAllObjects={clearAllObjects}
                setMarker={setMarker}
                setPosition={setPosition}
                analyseNearbyInfrastructure={analyseNearbyInfrastructure}
                setSelection={setSelection}
                setTempSelection={setTempSelection}
                fetchInfrastructureInBounds={fetchInfrastructureInBounds}
                setSearchResults={setSearchResults}
                shouldShowCategory={shouldShowCategory}
                setMap={setMap}
                switchHoursToRus={switchHoursToRus}
          />
        </div>
      );
};

export default MainComponent;