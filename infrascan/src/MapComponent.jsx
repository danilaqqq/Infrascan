import { React, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMapEvents, useMap } from "react-leaflet";
import { toast, ToastContainer } from 'react-toastify'
import "./App.css";
import SearchBar from "./SearchComponent"


const MapComponent = ({
  position,
  marker,
  searchResults,
  shops,
  pharmacies,
  transportNodes,
  clinics,
  malls,
  parks,
  banks,
  kindergartens,
  schools,
  selection,
  tempSelection,
  createCustomMarker,
  customIcon,
  hoveredShopId,
  hoveredPharmacyId,
  hoveredTransportId,
  hoveredClinicId,
  hoveredMallId,
  hoveredParkId,
  hoveredBankId,
  hoveredKindergartenId,
  hoveredSchoolId,
  markerRefs,
  analysisModeIsActive,
  clearAllObjects,
  setMarker,
  setPosition,
  analyseNearbyInfrastructure,
  setSelection,
  setTempSelection,
  fetchInfrastructureInBounds,
  setSearchResults,
  shouldShowCategory
}) => {
  
  // Взаимодействие с картой при анализе - постановка точка или выделение области
const MapInteraction = ({ analysisModeIsActive, clearAllObjects, setMarker, setPosition, analyseNearbyInfrastructure, setSelection, tempSelection, setTempSelection, fetchInfrastructureInBounds }) => {
  useMapEvents({
    click(e) {
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
      const newColor = area > 1 ? 'red' : 'blue';
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
        fetchInfrastructureInBounds(tempSelection.bounds);
      }

      setTempSelection(null);
    },
  });
  return null;
};

// Расчет площади выделенной области
const calculateArea = (bounds) => {
  if (!bounds) return 0;
  const [sw, ne] = bounds;
  const latDiff = Math.abs(sw.lat - ne.lat) * 111;
  const lngDiff = Math.abs(sw.lng - ne.lng) * (111 * Math.cos((sw.lat + ne.lat) / 2 * Math.PI / 180));
  return latDiff * lngDiff;
};

  return (
    <MapContainer center={position} zoom={3} className="map-container">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <MapInteraction
        analysisModeIsActive={analysisModeIsActive}
        clearAllObjects={clearAllObjects}
        setMarker={setMarker}
        setPosition={setPosition}
        analyseNearbyInfrastructure={analyseNearbyInfrastructure}
        setSelection={setSelection}
        tempSelection={tempSelection}
        setTempSelection={setTempSelection}
        fetchInfrastructureInBounds={fetchInfrastructureInBounds}
      />

        {shouldShowCategory("shops") && shops.map((shop) => (
          <Marker key={shop.id} position={[shop.lat, shop.lon]} icon={createCustomMarker("shop", hoveredShopId === shop.id)} ref={(ref) => (markerRefs.current[shop.id] = ref)} >
            <Popup>
              <strong>{shop.name}</strong> <br />
              🕒 {shop.hours}
            </Popup>
          </Marker>
        ))}
        {shouldShowCategory("pharmacies") && pharmacies.map((pharmacy) => (
          <Marker key={pharmacy.id} position={[pharmacy.lat, pharmacy.lon]} icon={createCustomMarker("pharmacy", hoveredPharmacyId === pharmacy.id)} ref={(ref) => (markerRefs.current[pharmacy.id] = ref)} >
            <Popup>
              <strong>{pharmacy.name}</strong> <br />
              🕒 {pharmacy.hours}
            </Popup>
          </Marker>
        ))}
        {shouldShowCategory("transportNodes") && transportNodes.map((stop_position) => (
          <Marker key={stop_position.id} position={[stop_position.lat, stop_position.lon]} icon={createCustomMarker("transportStop", hoveredTransportId === stop_position.id)} ref={(ref) => (markerRefs.current[stop_position.id] = ref)} >
            <Popup>
              <strong>{stop_position.name}</strong> <br />
            </Popup>
          </Marker>
        ))}
        {shouldShowCategory("clinics") && clinics.map((clinic) => (
          <Marker key={clinic.id} position={[clinic.lat, clinic.lon]} icon={createCustomMarker("hospital", hoveredClinicId === clinic.id)} ref={(ref) => (markerRefs.current[clinic.id] = ref)} >
            <Popup>
              <strong>{clinic.name}</strong> <br />
              🕒 {clinic.hours}
            </Popup>
          </Marker>
        ))}
        {shouldShowCategory("malls") && malls.map((mall) => (
          <Marker key={mall.id} position={[mall.lat, mall.lon]} icon={createCustomMarker("mall", hoveredMallId === mall.id)} ref={(ref) => (markerRefs.current[mall.id] = ref)} >
            <Popup>
              <strong>{mall.name}</strong> <br />
              🕒 {mall.hours}
            </Popup>
          </Marker>
        ))}
        {shouldShowCategory("parks") && parks.map((park) => (
          <Marker key={park.id} position={[park.lat, park.lon]} icon={createCustomMarker("park", hoveredParkId === park.id)} ref={(ref) => (markerRefs.current[park.id] = ref)} >
            <Popup>
              <strong>{park.name}</strong> <br />
            </Popup>
          </Marker>
        ))}
        {shouldShowCategory("banks") && banks.map((bank) => (
          <Marker key={bank.id} position={[bank.lat, bank.lon]} icon={createCustomMarker("bank", hoveredBankId === bank.id)} ref={(ref) => (markerRefs.current[bank.id] = ref)} >
            <Popup>
              <strong>{bank.name}</strong> <br />
              🕒 {bank.hours}
            </Popup>
          </Marker>
        ))}
        {shouldShowCategory("kindergartens") && kindergartens.map((kindergarten) => (
          <Marker key={kindergarten.id} position={[kindergarten.lat, kindergarten.lon]} icon={createCustomMarker("kindergarten", hoveredKindergartenId === kindergarten.id)} ref={(ref) => (markerRefs.current[kindergarten.id] = ref)} >
            <Popup>
              <strong>{kindergarten.name}</strong> <br />
              🕒 {kindergarten.hours}
            </Popup>
          </Marker>
        ))}
        {shouldShowCategory("schools") && schools.map((school) => (
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
        {searchResults.length > 0 && searchResults.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={customIcon}
          >
            <Popup>{marker.name}</Popup>
          </Marker>
        ))}
        {tempSelection && (
          <Rectangle key={`react-${tempSelection.color}-${Date.now()}`} bounds={tempSelection.bounds} dashArray="4" color={tempSelection.color} fillColor={tempSelection.color} fillOpacity={0.2} />
        )}
        {selection && !selection?.bounds && (
          <Rectangle bounds={selection} color="blue" />
        )}
        {selection?.bounds && (
          <>
            <Rectangle bounds={selection.bounds} color="blue" />
          </>
        )}
        {analysisModeIsActive && (
          <div className="map-tooltip">
            ℹ️ Анализ вокруг точки: Кликните ЛКМ, чтобы выбрать точку, вокруг которой будет проивзодиться анализ.
            ℹ️ Анализ в области: Нажмите ПКМ для выделения области, подтвердите ее с помощью ЛКМ. Слишком большая область будет выделена красным.
          </div>
        )}
        <SearchBar setSearchResults={setSearchResults}/>
        <ToastContainer autoClose={8000}/>
    </MapContainer>
  );
};

export default MapComponent;
