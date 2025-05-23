import React from "react";
import { toast, ToastContainer } from "react-toastify";
import "./SidebarComponent.css";
import { infrastructureCategories } from "./InfrastructureCategories";
import SearchBar from "./SearchComponent";

const Sidebar = ({
  location,
  weather,
  marker,
  position,
  shops,
  pharmacies,
  transportNodes,
  clinics,
  malls,
  parks,
  banks,
  kindergartens,
  schools,
  setHoveredShopId,
  setHoveredPharmacyId,
  setHoveredTransportId,
  setHoveredClinicId,
  setHoveredMallId,
  setHoveredParkId,
  setHoveredBankId,
  setHoveredKindergartenId,
  setHoveredSchoolId,
  setHoveredSearchResultId,
  isRemoving,
  analysisModeIsActive,
  setAnalysisModeIsActive,
  clearSelections,
  clearAllObjects,
  searchTypeOfObjects,
  analyseNearbyInfrastructure,
  markerRefs,
  searchResults,
  activeFilters,
  toggleFilter,
  shouldShowCategory,
  map,
  setSearchResults,
  selection,
  tempSelection,
  switchHoursToRus
}) => {
  return(
    <div className="sidebar">
        <img
          src="/icons/logo1.png"
          alt="Логотип"
          width="350" 
          height="160"
        />
        <h2 className="yourlocationtext"></h2>
        {(location.country != 'Неизвестно') &&
          <p className="location">
            Погода в городе&nbsp;
            <img
              src={
                location.countryCode==="ru"
                ? "/icons/ru.png"
                : `https://flagcdn.com/w40/${location.countryCode}.png`}
              alt="Флаг"
              className="flag"
            />
            {location.city}:
          </p>
        }
        {weather.temp && location.country != 'Неизвестно' && (
          <p className="weather">
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
            />
          {weather.temp}°C, {weather.description}</p>
        )}
        {(location.country == 'Неизвестно') &&
          <p>Местоположение не определено</p>
        }
        {map && <SearchBar map={map} setSearchResults={setSearchResults}/>}
        <button
          className={`analysis-button ${analysisModeIsActive ? 'active' : ''}`}
          onClick={() => {
            if (analysisModeIsActive) { setAnalysisModeIsActive(false); clearSelections(); }
            else {setAnalysisModeIsActive(true); if(marker) analyseNearbyInfrastructure(position);}
          }}>
          {analysisModeIsActive ? 'Завершить анализ' : 'Анализ инфраструктуры'}
        </button>
        <hr className="dividerline" />

        {(shops.length > 0 || pharmacies.length > 0 || transportNodes.length > 0 || clinics.length > 0 || malls.length > 0 || parks.length > 0 || banks.length > 0 || kindergartens.length > 0 || schools.length > 0 || searchResults.length > 0) && (
          <>
            <div className="search-header">
              <h2 className="yourlocationtext">Результаты поиска</h2>
              <button className="clear-button" onClick={clearAllObjects}>
                  <img src="icons/removeSearchResults.png" alt="Очистить"/>
              </button>
            </div>
          <div className="sidebar-results-container">
            {analysisModeIsActive &&
              <div className="icons-column">
              <button
                className={`icon-button ${activeFilters.includes("shops") ? "active" : ""}`}
                data-count={shops.length}
                onClick={() => {if(shops.length != 0) toggleFilter("shops")}}>
                <img src="icons/shopIcon.png" alt="Магазины" />
              </button>
              <button 
                className={`icon-button ${activeFilters.includes("pharmacies") ? "active" : ""}`}
                data-count={pharmacies.length}
                onClick={() => {if(pharmacies.length != 0) toggleFilter("pharmacies")}}>
                <img src="icons/pharmacyIcon.png" alt="Аптеки" />
              </button>
              <button 
                className={`icon-button ${activeFilters.includes("transportNodes") ? "active" : ""}`}
                data-count={transportNodes.length}
                onClick={() => {if(transportNodes.length != 0) toggleFilter("transportNodes")}}>
                <img src="icons/transportStopIcon.png" alt="Остановки транспорта" />
              </button>
              <button 
                className={`icon-button ${activeFilters.includes("clinics") ? "active" : ""}`}
                data-count={clinics.length}
                onClick={() => {if(clinics.length != 0) toggleFilter("clinics")}}>
                <img src="icons/hospitalIcon.png" alt="Поликлиники" />
              </button>
              <button 
                className={`icon-button ${activeFilters.includes("malls") ? "active" : ""}`}
                data-count={malls.length}
                onClick={() => {if(malls.length != 0) toggleFilter("malls")}}>
                <img src="icons/mallIcon.png" alt="Торговые центры" />
              </button>
              <button 
                className={`icon-button ${activeFilters.includes("parks") ? "active" : ""}`}
                data-count={parks.length}
                onClick={() => {if(parks.length != 0) toggleFilter("parks")}}>
                <img src="icons/parkIcon.png" alt="Парки" />
              </button>
              <button 
                className={`icon-button ${activeFilters.includes("banks") ? "active" : ""}`}
                data-count={banks.length}
                onClick={() => {if(banks.length != 0) toggleFilter("banks")}}>
                <img src="icons/bankIcon.png" alt="Банк" />
              </button>
              <button 
                className={`icon-button ${activeFilters.includes("kindergartens") ? "active" : ""}`}
                data-count={kindergartens.length}
                onClick={() => {if(kindergartens.length != 0) toggleFilter("kindergartens")}}>
                <img src="icons/kindergartenIcon.png" alt="Детские сады" />
              </button>
              <button 
                className={`icon-button ${activeFilters.includes("schools") ? "active" : ""}`}
                data-count={schools.length}
                onClick={() => {if(schools.length != 0) toggleFilter("schools")}}>
                <img src="icons/schoolIcon.png" alt="Школы" />
              </button>
            </div>}
            <div className="objects-column">
              <ul className={`shop-list ${isRemoving ? "removing" : ""}`}>
                {shouldShowCategory("shops") && shops.length > 0 && (
                  <>
                    <hr className="littledividerline" />
                    <p className="category-name-text">Продовольственные магазины</p>
                  </>
                )}
                {shouldShowCategory("shops") && shops.map((shop) => (
                  <li key={shop.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredShopId(shop.id); if (markerRefs.current[shop.id]) { markerRefs.current[shop.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredShopId(null); if (markerRefs.current[shop.id]) { markerRefs.current[shop.id].closePopup(); } }}>
                    <strong>{shop.name}</strong>
                    <p>🕒 {switchHoursToRus(shop.hours)}</p>
                    {(!selection && !tempSelection) &&
                      <p>↔️ {shop.distance} метров</p>
                    }
                  </li>
                ))}
                {shouldShowCategory("pharmacies") && pharmacies.length > 0 && (
                  <>
                    <hr className="littledividerline" />
                    <p className="category-name-text">Аптеки</p>
                  </>
                )}
                {shouldShowCategory("pharmacies") && pharmacies.map((pharmacy) => (
                  <li key={pharmacy.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredPharmacyId(pharmacy.id); if (markerRefs.current[pharmacy.id]) { markerRefs.current[pharmacy.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredPharmacyId(null); if (markerRefs.current[pharmacy.id]) { markerRefs.current[pharmacy.id].closePopup(); } }}>
                    <strong>{pharmacy.name}</strong>
                    <p>🕒 {switchHoursToRus(pharmacy.hours)}</p>
                    {(!selection && !tempSelection) &&
                      <p>↔️ {pharmacy.distance} метров</p>
                    }
                  </li>
                ))}
                {shouldShowCategory("transportNodes") && transportNodes.length > 0 && (
                  <>
                    <hr className="littledividerline" />
                    <p className="category-name-text">Остановки транспорта</p>
                  </>
                )}
                {shouldShowCategory("transportNodes") && transportNodes.map((stop_position) => (
                  <li key={stop_position.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredTransportId(stop_position.id); if (markerRefs.current[stop_position.id]) { markerRefs.current[stop_position.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredTransportId(null); if (markerRefs.current[stop_position.id]) { markerRefs.current[stop_position.id].closePopup(); } }}>
                    <strong>{stop_position.name}</strong>
                    {(!selection && !tempSelection) &&
                      <p>↔️ {stop_position.distance} метров</p>
                    }
                  </li>
                ))}
                {shouldShowCategory("clinics") && clinics.length > 0 && (
                  <>
                    <hr className="littledividerline" />
                    <p className="category-name-text">Поликлиники и больницы</p>
                  </>
                )}
                {shouldShowCategory("clinics") && clinics.map((clinic) => (
                  <li key={clinic.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredClinicId(clinic.id); if (markerRefs.current[clinic.id]) { markerRefs.current[clinic.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredClinicId(null); if (markerRefs.current[clinic.id]) { markerRefs.current[clinic.id].closePopup(); } }}>
                    <strong>{clinic.name}</strong>
                    <p>🕒 {switchHoursToRus(clinic.hours)}</p>
                    {(!selection && !tempSelection) &&
                      <p>↔️ {clinic.distance} метров</p>
                    }
                  </li>
                ))}
                {shouldShowCategory("malls") && malls.length > 0 && (
                  <>
                    <hr className="littledividerline" />
                    <p className="category-name-text">Торговые центры</p>
                  </>
                )}
                {shouldShowCategory("malls") && malls.map((mall) => (
                  <li key={mall.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredMallId(mall.id); if (markerRefs.current[mall.id]) { markerRefs.current[mall.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredMallId(null); if (markerRefs.current[mall.id]) { markerRefs.current[mall.id].closePopup(); } }}>
                    <strong>{mall.name}</strong>
                    <p>🕒 {switchHoursToRus(mall.hours)}</p>
                    {(!selection && !tempSelection) &&
                      <p>↔️ {mall.distance} метров</p>
                    }
                  </li>
                ))}
                {shouldShowCategory("parks") && parks.length > 0 && (
                  <>
                    <hr className="littledividerline" />
                    <p className="category-name-text">Парки и скверы</p>
                  </>
                )}
                {shouldShowCategory("parks") && parks.map((park) => (
                  <li key={park.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredParkId(park.id); if (markerRefs.current[park.id]) { markerRefs.current[park.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredParkId(null); if (markerRefs.current[park.id]) { markerRefs.current[park.id].closePopup(); } }}>
                    <strong>{park.name}</strong>
                    {(!selection && !tempSelection) &&
                      <p>↔️ {park.distance} метров</p>
                    }
                  </li>
                ))}
                {shouldShowCategory("banks") && banks.length > 0 && (
                  <>
                    <hr className="littledividerline" />
                    <p className="category-name-text">Отделения банков</p>
                  </>
                )}
                {shouldShowCategory("banks") && banks.map((bank) => (
                  <li key={bank.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredBankId(bank.id); if (markerRefs.current[bank.id]) { markerRefs.current[bank.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredBankId(null); if (markerRefs.current[bank.id]) { markerRefs.current[bank.id].closePopup(); } }}>
                    <strong>{bank.name}</strong>
                    <p>🕒 {switchHoursToRus(bank.hours)}</p>
                    {(!selection && !tempSelection) &&
                      <p>↔️ {bank.distance} метров</p>
                    }
                  </li>
                ))}
                {shouldShowCategory("kindergartens") && kindergartens.length > 0 && (
                  <>
                    <hr className="littledividerline" />
                    <p className="category-name-text">Детские сады</p>
                  </>
                )}
                {shouldShowCategory("kindergartens") && kindergartens.map((kindergarten) => (
                  <li key={kindergarten.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredKindergartenId(kindergarten.id); if (markerRefs.current[kindergarten.id]) { markerRefs.current[kindergarten.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredKindergartenId(null); if (markerRefs.current[kindergarten.id]) { markerRefs.current[kindergarten.id].closePopup(); } }}>
                    <strong>{kindergarten.name}</strong>
                    <p>🕒 {switchHoursToRus(kindergarten.hours)}</p>
                    {(!selection && !tempSelection) &&
                      <p>↔️ {kindergarten.distance} метров</p>
                    }
                  </li>
                ))}
                {shouldShowCategory("schools") && schools.length > 0 && (
                  <>
                    <hr className="littledividerline" />
                    <p className="category-name-text">Школы</p>
                  </>
                )}
                {shouldShowCategory("schools") && schools.map((school) => (
                  <li key={school.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredSchoolId(school.id); if (markerRefs.current[school.id]) { markerRefs.current[school.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredSchoolId(null); if (markerRefs.current[school.id]) { markerRefs.current[school.id].closePopup(); } }}>
                    <strong>{school.name}</strong>
                    <p>🕒 {switchHoursToRus(school.hours)}</p>
                    {(!selection && !tempSelection) &&
                      <p>↔️ {school.distance} метров</p>
                    }
                  </li>
                ))}
                {searchResults.length > 0 &&
                  <hr className="littledividerline" />
                }
                {searchResults.map((result) => (
                  <li key={result.id}
                    className="shop-item"
                    onMouseEnter={() => { setHoveredSearchResultId(result.id); if (markerRefs.current[result.id]) { markerRefs.current[result.id].openPopup(); } }}
                    onMouseLeave={() => { setHoveredSearchResultId(null); if (markerRefs.current[result.id]) { markerRefs.current[result.id].closePopup(); } }}>
                    <strong>{result.name}</strong>
                    <p>🕒 {switchHoursToRus(result.hours)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
  );
};

export default Sidebar;