import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';

// Fix for default marker icon issues in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Locate Button Component
const LocateControl = ({ userLocation }) => {
    const map = useMap();

    const handleLocate = (e) => {
        e.stopPropagation(); // Prevent map click propagation
        if (userLocation) {
            map.flyTo(userLocation, 15, {
                animate: true,
                duration: 1.5
            });
        }
    };

    return (
        <div className="leaflet-bottom leaflet-right">
            <div className="leaflet-control leaflet-bar !border-0 !shadow-xl">
                <button
                    onClick={handleLocate}
                    className="w-10 h-10 bg-white dark:bg-slate-900 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer text-primary"
                    title="Locate Me"
                >
                    <Crosshair className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const LeafletMap = ({ providers = [] }) => {
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        // Get user's current location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude]);
            },
            (error) => {
                console.error("Error getting location:", error);
                // Default to Mumbai if permission denied
                setUserLocation([19.0760, 72.8777]);
            }
        );
    }, []);

    if (!userLocation) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-card/40 text-muted-foreground animate-pulse rounded-[2.5rem]">
                Loading Map...
            </div>
        );
    }

    return (
        <MapContainer
            center={userLocation}
            zoom={13}
            scrollWheelZoom={false}
            className="w-full h-full rounded-[2.5rem] z-0"
            style={{ background: '#f8fafc' }} // Neutral bg
        >
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Street View">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Satellite">
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Dark Mode">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            {/* User Location */}
            <Circle
                center={userLocation}
                radius={500}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
            />
            <Marker position={userLocation}>
                <Popup>
                    You are here
                </Popup>
            </Marker>

            {/* Provider Markers */}
            {providers.map((provider) => (
                <Marker key={provider.id} position={provider.location}>
                    <Popup>
                        <div className="font-bold">{provider.name}</div>
                        <div className="text-xs">{provider.service}</div>
                    </Popup>
                </Marker>
            ))}

            {/* Controls */}
            <LocateControl userLocation={userLocation} />
        </MapContainer>
    );
};

export default LeafletMap;
