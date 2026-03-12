/**
 * LeafletMapComponent — Drop-in replacement for GoogleMaps MapComponent.
 *
 * Props:
 *   center: { lat, lng }
 *   zoom: number (default 13)
 *   children: NOT supported (use `markers` prop instead)
 *   markers: [{ position: {lat,lng}, icon?, draggable?, onDragEnd?, title?, popup? }]
 *   onClick: (e) => void
 *   showControls: boolean (default true)
 *   forceDark: boolean | null
 *   onIdle: (center) => void
 *   mapContainerStyle: object
 *   scrollWheelZoom: boolean
 *   draggable: boolean  (map draggable, default true)
 *   gestureHandling: string
 */

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { Crosshair, Moon, Sun, Satellite } from 'lucide-react';

// Fix default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// React 18 strict mode / fast unmount race condition patch for Leaflet markers
const originalRemoveIcon = L.Marker.prototype._removeIcon;
const originalRemoveShadow = L.Marker.prototype._removeShadow;
L.Marker.include({
    _removeIcon: function () {
        if (this._icon) {
            originalRemoveIcon.call(this);
        }
    },
    _removeShadow: function () {
        if (this._shadow) {
            originalRemoveShadow.call(this);
        }
    }
});

// --- Tile URLs ---
const TILES = {
    light: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
    },
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri'
    }
};

// --- Blue dot icon ---
const blueDotIcon = L.divIcon({
    className: 'leaflet-blue-dot',
    html: `<div style="width:14px;height:14px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(66,133,244,0.5);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

// --- Red dot icon ---
const redDotIcon = L.divIcon({
    className: 'leaflet-red-dot',
    html: `<div style="width:14px;height:14px;background:#EA4335;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(234,67,53,0.5);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

// --- Green dot icon ---
const greenDotIcon = L.divIcon({
    className: 'leaflet-green-dot',
    html: `<div style="width:14px;height:14px;background:#34A853;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(52,168,83,0.5);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

// --- Indigo circle icon (used in RequestHelpWizard) ---
const indigoCircleIcon = L.divIcon({
    className: 'leaflet-indigo-circle',
    html: `<div style="width:24px;height:24px;background:#4F46E5;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(79,70,229,0.4);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// --- Car icon (SVG-based for dashboard tracking) ---
const createCarIcon = (rotation = 0) => L.divIcon({
    className: 'leaflet-car-icon',
    html: `<div style="transform:rotate(${rotation}deg);width:28px;height:48px;display:flex;align-items:center;justify-content:center;">
        <svg viewBox="0 0 24 48" width="24" height="48" fill="#4285F4" stroke="white" stroke-width="1.5">
            <path d="M17.4,0H5.6C2.5,0,0,3.5,0,6.6v34.8c0,3.1,2.5,5.6,5.6,5.6h11.8c3.1,0,5.6-2.5,5.6-5.6V6.6C23,3.5,20.5,0,17.4,0z M22,14.2v11.7l-2.7,0.4v-4.8L22,14.2z M20.6,10.8c-1,3.9-2.2,8.5-2.2,8.5H4.6l-2.2-8.5C2.4,10.8,11.3,7.8,20.6,10.8z M3.7,21.7v4.5l-2.7-0.3V14.5L3.7,21.7z M1,37.9V27.6l2.7,0.3v8.2L1,37.9z M2.6,40.9l2.2-3.3h13.8l2.2,3.3H2.6z M19.3,35.8v-7.9l2.7-0.4v10L19.3,35.8z"/>
        </svg>
    </div>`,
    iconSize: [28, 48],
    iconAnchor: [14, 24],
});

// Helper to parse Google Maps icon URLs to Leaflet icons
const iconCache = new Map();

function resolveIcon(iconProp) {
    if (!iconProp) return new L.Icon.Default(); // default leaflet marker

    // Leaflet icon directly (cannot be stringified)
    if (iconProp instanceof L.Icon || iconProp instanceof L.DivIcon) {
        return iconProp;
    }

    // Check cache to avoid recreating L.divIcon on every render (prevents unmount crashes)
    const cacheKey = typeof iconProp === 'string' ? iconProp : JSON.stringify(iconProp);
    if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);

    let resultIcon;

    // String URL (e.g. "http://maps.google.com/mapfiles/ms/icons/blue-dot.png")
    if (typeof iconProp === 'string') {
        if (iconProp.includes('blue-dot')) resultIcon = blueDotIcon;
        else if (iconProp.includes('red-dot')) resultIcon = redDotIcon;
        else if (iconProp.includes('green-dot')) resultIcon = greenDotIcon;
        // Generic URL icon
        else resultIcon = L.icon({ iconUrl: iconProp, iconSize: [25, 41], iconAnchor: [12, 41] });
    }

    // Object with `url` property (Google Maps style)
    else if (iconProp.url) {
        if (iconProp.url.includes('blue-dot')) resultIcon = blueDotIcon;
        else if (iconProp.url.includes('red-dot')) resultIcon = redDotIcon;
        else if (iconProp.url.includes('green-dot')) resultIcon = greenDotIcon;
        else resultIcon = L.icon({ iconUrl: iconProp.url, iconSize: [25, 41], iconAnchor: [12, 41] });
    }

    // Object with SVG `path` property (CAR_SYMBOL style)
    else if (iconProp.path) {
        resultIcon = createCarIcon(iconProp.rotation || 0);
    }

    // Circle icon (e.g. SymbolPath.CIRCLE)
    else if (iconProp.fillColor) {
        const color = iconProp.fillColor || '#4F46E5';
        const scale = iconProp.scale || 10;
        const size = scale * 2;
        resultIcon = L.divIcon({
            className: 'leaflet-custom-circle',
            html: `<div style="width:${size}px;height:${size}px;background:${color};border:${iconProp.strokeWeight || 2}px solid ${iconProp.strokeColor || 'white'};border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
        });
    }

    if (resultIcon) {
        iconCache.set(cacheKey, resultIcon);
        return resultIcon;
    }

    return new L.Icon.Default();
}

// --- Internal map updater component ---
const MapUpdater = ({ center, zoom, onIdle, onClick }) => {
    const map = useMap();
    const prevCenter = useRef(null);
    const prevZoom = useRef(null);

    useEffect(() => {
        if (!center) return;
        const newLat = center.lat;
        const newLng = center.lng;

        // Only update if center actually changed significantly
        if (prevCenter.current) {
            const diff = Math.abs(prevCenter.current.lat - newLat) + Math.abs(prevCenter.current.lng - newLng);
            if (diff < 0.00001 && prevZoom.current === zoom) return;
        }

        prevCenter.current = { lat: newLat, lng: newLng };
        prevZoom.current = zoom;
        map.setView([newLat, newLng], zoom, { animate: true, duration: 0.3 });
    }, [center?.lat, center?.lng, zoom, map]);

    // Fire onIdle when map finishes moving
    useMapEvents({
        moveend: () => {
            if (onIdle) {
                const c = map.getCenter();
                onIdle({ lat: c.lat, lng: c.lng });
            }
        },
        click: (e) => {
            if (onClick) onClick(e);
        },
        locationfound: (e) => {
            const { lat, lng } = e.latlng;
            map.flyTo([lat, lng], 18, { animate: true, duration: 1.5 });
            if (onClick) {
                onClick({ latlng: { lat, lng } });
            }
        },
        locationerror: (e) => {
            console.error("Location error:", e.message);
            alert("Could not get accurate location. Please check your browser permissions.");
        }
    });

    return null;
};

// Locate control
const LocateControl = ({ onClick }) => {
    const map = useMap();

    const handleLocate = (e) => {
        e.stopPropagation();
        map.locate({
            setView: false,
            enableHighAccuracy: true,
            maxZoom: 18
        });
    };

    return (
        <button
            type="button"
            onClick={handleLocate}
            className="absolute bottom-8 right-8 z-[1000] w-12 h-12 bg-background/90 backdrop-blur-md flex items-center justify-center rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl border border-border cursor-pointer text-primary"
            title="Locate Me"
        >
            <Crosshair className="w-6 h-6" />
        </button>
    );
};

// Custom component to handle map resizing anomalies in Modals/Animations
const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        // Trigger a resize immediately and after CSS transition gaps 
        const timers = [10, 100, 300, 500].map(delay =>
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, delay)
        );

        const handleResize = () => { if (map) map.invalidateSize(); };
        window.addEventListener('resize', handleResize);

        let resizeObserver;
        if (typeof window.ResizeObserver !== 'undefined' && map.getContainer()) {
            resizeObserver = new window.ResizeObserver(() => {
                if (map) map.invalidateSize();
            });
            resizeObserver.observe(map.getContainer());
        }

        return () => {
            timers.forEach(clearTimeout);
            window.removeEventListener('resize', handleResize);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [map]);
    return null;
};

const LeafletMapComponent = ({
    center,
    zoom = 13,
    markers = [],
    onClick,
    showControls = true,
    forceDark = null,
    onIdle,
    mapContainerStyle = {},
    scrollWheelZoom = true,
    draggable = true,
    ...props
}) => {
    const [theme, setTheme] = useState(forceDark ? 'dark' : 'light');

    useEffect(() => {
        if (forceDark === true) setTheme('dark');
        else if (forceDark === false) setTheme('light');
    }, [forceDark]);

    const defaultCenter = { lat: 19.0760, lng: 72.8777 };
    const mapCenter = center || defaultCenter;
    const tile = TILES[theme] || TILES.light;

    return (
        <div className="relative w-full h-full z-0" style={mapContainerStyle}>
            <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={zoom}
                scrollWheelZoom={scrollWheelZoom}
                dragging={draggable}
                className="w-full h-full z-0"
                style={{ background: theme === 'dark' ? '#1a1a2e' : '#f8fafc', borderRadius: '2.5rem', overflow: 'hidden' }}
                zoomControl={false}
                attributionControl={false}
                fadeAnimation={false}
                markerZoomAnimation={false}
                preferCanvas={true}
            >
                <TileLayer
                    url={tile.url}
                    attribution={tile.attribution}
                    updateWhenIdle={false}
                    keepBuffer={8}
                />
                <MapUpdater center={mapCenter} zoom={zoom} onIdle={onIdle} onClick={onClick} />
                <MapResizer />

                {/* Render markers */}
                {markers.map((m, i) => {
                    const pos = m.position;
                    if (!pos) return null;
                    const leafletIcon = resolveIcon(m.icon);

                    return (
                        <Marker
                            key={m.key || `marker-${i}`}
                            position={[pos.lat, pos.lng]}
                            icon={leafletIcon}
                            draggable={m.draggable || false}
                            eventHandlers={{
                                dragend: (e) => {
                                    if (m.onDragEnd) {
                                        const latlng = e.target.getLatLng();
                                        // Mimic Google Maps event shape
                                        m.onDragEnd({
                                            latLng: {
                                                lat: () => latlng.lat,
                                                lng: () => latlng.lng,
                                            }
                                        });
                                    }
                                }
                            }}
                            title={m.title}
                        >
                            {m.popup && <Popup>{m.popup}</Popup>}
                        </Marker>
                    );
                })}

                {showControls && <LocateControl onClick={onClick} />}
            </MapContainer>

            {/* Theme Toolbar */}
            {showControls && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-none">
                    <div className="bg-background/90 backdrop-blur-md p-1.5 rounded-full border border-border shadow-2xl flex gap-1 pointer-events-auto">
                        <button
                            type="button"
                            onClick={() => setTheme('light')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${theme === 'light' ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                            <Sun className="w-3.5 h-3.5" /> Light
                        </button>
                        <button
                            type="button"
                            onClick={() => setTheme('dark')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${theme === 'dark' ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                            <Moon className="w-3.5 h-3.5" /> Dark
                        </button>
                        <button
                            type="button"
                            onClick={() => setTheme('satellite')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${theme === 'satellite' ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                            <Satellite className="w-3.5 h-3.5" /> Satellite
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Named exports so consumers can import icons
export { blueDotIcon, redDotIcon, greenDotIcon, indigoCircleIcon, createCarIcon, resolveIcon };
export default LeafletMapComponent;
