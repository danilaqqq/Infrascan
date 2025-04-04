import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';

function ClickableMap({ position, setPosition, customIcon }) {
    function LocationMarker() {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);  // Передаем координаты в родительский компонент
                console.log("Выбраны координаты:", e.latlng.lat, e.latlng.lng);
            },
        });

        return position === null ? null : (
            <Marker position={position} icon={customIcon}>
                <Popup>Вы выбрали эту точку! 📍</Popup>
            </Marker>
        );
    }

    return (
        <MapContainer center={position} zoom={3} className="map-container">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker />
        </MapContainer>
    );
}

export default ClickableMap;
