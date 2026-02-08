import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useMemo, useCallback, useState } from 'react';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '2.5rem',
    overflow: 'hidden'
};

// Center of India (adjusted for better visual centering)
const indiaCenter = {
    lat: 21.0,
    lng: 78.5
};

const libraries = ['places', 'geometry'];

// Clean light map style
const lightMapStyle = [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f3f4f6" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfdbfe" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#9ca3af" }] },
    { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#d1d5db" }] },
];

// City data with exact coordinates
const cities = [
    { name: "Nagpur", lat: 21.1458, lng: 79.0882, highlight: true, providers: "45+" },
    { name: "Amravati", lat: 20.9374, lng: 77.7796, highlight: true, providers: "32+" },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, highlight: false, providers: "120+" },
    { name: "Pune", lat: 18.5204, lng: 73.8567, highlight: false, providers: "85+" },
    { name: "Indore", lat: 22.7196, lng: 75.8577, highlight: false, providers: "40+" },
    { name: "Bhopal", lat: 23.2599, lng: 77.4126, highlight: false, providers: "35+" },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867, highlight: false, providers: "75+" },
];

// Modern City Marker Component
const CityMarker = ({ city }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <OverlayView
            position={{ lat: city.lat, lng: city.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div
                className="relative flex flex-col items-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Hover Card */}
                <div className={`absolute bottom-full mb-2 transition-all duration-200 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
                    <div className="bg-white rounded-xl shadow-xl px-3 py-2 border border-gray-100 whitespace-nowrap">
                        <p className="text-xs font-bold text-gray-900">{city.name}</p>
                        <p className="text-[10px] text-gray-500">{city.providers} providers</p>
                    </div>
                    <div className="w-2 h-2 bg-white border-b border-r border-gray-100 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                </div>

                {/* Ripple Effect */}
                <div className={`absolute w-8 h-8 rounded-full ${city.highlight ? 'bg-emerald-500' : 'bg-blue-500'} opacity-20 animate-ping`}></div>

                {/* Main Marker */}
                <div className={`relative w-5 h-5 rounded-full ${city.highlight ? 'bg-emerald-500' : 'bg-blue-500'} shadow-lg flex items-center justify-center transition-transform duration-200 ${isHovered ? 'scale-125' : 'scale-100'}`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>

                {/* City Name Label (always visible) */}
                <div className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-sm whitespace-nowrap ${city.highlight
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                    }`}>
                    {city.name}
                </div>
            </div>
        </OverlayView>
    );
};

const CoverageMap = () => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyDta1Z02aqGopcvuZTLPH1-AJRehMRDTAM",
        libraries
    });

    const onLoad = useCallback((map) => {
        // Set bounds to show entire India, perfectly centered
        const indiaBounds = {
            north: 35.5,
            south: 6.5,
            east: 97.5,
            west: 68.0,
        };

        map.fitBounds(indiaBounds, {
            top: 10,
            right: 10,
            bottom: 60,
            left: 10
        });
    }, []);

    const mapOptions = useMemo(() => ({
        styles: lightMapStyle,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        scrollwheel: false,
        draggable: false,
        gestureHandling: 'none',
        clickableIcons: false,
        minZoom: 4,
        maxZoom: 6,
    }), []);

    if (loadError) {
        return (
            <div className="w-full h-full bg-red-500/10 flex items-center justify-center text-red-500 rounded-[2.5rem]">
                Map Error
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 animate-pulse rounded-[2.5rem] flex items-center justify-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Loading Map...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={indiaCenter}
                zoom={5}
                options={mapOptions}
                onLoad={onLoad}
            >
                {/* City Markers */}
                {cities.map((city, index) => (
                    <CityMarker key={index} city={city} />
                ))}
            </GoogleMap>
        </div>
    );
};

export default CoverageMap;
