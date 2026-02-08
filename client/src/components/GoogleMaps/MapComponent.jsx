import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { Crosshair, Map as MapIcon, Satellite, Moon, Sun } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '2.5rem',
    overflow: 'hidden'
};

const defaultCenter = {
    lat: 19.0760,
    lng: 72.8777
};

const libraries = ['places', 'geometry'];

const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

const MapComponent = ({
    center,
    zoom = 13,
    heading = 0,
    tilt = 0,
    children,
    onClick,
    options,
    showControls = true,
    forceDark = null, // Prop to sync with parent theme
    customDarkStyle = null, // Prop for custom style (Uber)
    ...props
}) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyDta1Z02aqGopcvuZTLPH1-AJRehMRDTAM",
        libraries
    });

    const [map, setMap] = useState(null);
    const [mapTypeId, setMapTypeId] = useState('roadmap'); // roadmap, satellite
    const [isDark, setIsDark] = useState(false);
    const [myLocation, setMyLocation] = useState(null);

    // Sync internal state with external forceDark prop if provided
    useEffect(() => {
        if (forceDark !== null && forceDark !== undefined) {
            setIsDark(forceDark);
        }
    }, [forceDark]);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const handleLocateMe = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (navigator.geolocation && map) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setMyLocation(pos);
                    map.panTo(pos);
                    map.setZoom(15);
                },
                () => console.error("Error fetching location")
            );
        }
    };

    const mapOptions = useMemo(() => ({
        styles: isDark && mapTypeId === 'roadmap' ? (customDarkStyle || darkMapStyle) : [],
        mapTypeId: mapTypeId,
        disableDefaultUI: true, // We build our own controls
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        heading: heading,
        tilt: tilt,
        ...options
    }), [isDark, mapTypeId, heading, tilt, options, customDarkStyle]);

    if (loadError) {
        return <div className="w-full h-full bg-red-500/10 flex items-center justify-center text-red-500">Map Error: {loadError.message}</div>;
    }

    if (!isLoaded || !window.google) {
        return <div className="w-full h-full bg-card/50 animate-pulse rounded-[2.5rem] flex items-center justify-center text-muted-foreground">Loading Maps...</div>;
    }


    return (
        <div className="relative w-full h-full px-1 py-1">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center || defaultCenter}
                zoom={zoom}
                onClick={onClick}
                options={mapOptions}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onIdle={() => {
                    if (map && props.onIdle) {
                        props.onIdle(map.getCenter().toJSON());
                    }
                }}
                {...props}
            >
                {/* User's "Blue Dot" Location Marker */}
                {myLocation && (
                    <Marker
                        position={myLocation}
                        icon={{
                            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                        }}
                        title="You are here"
                    />
                )}
                {children}
            </GoogleMap>

            {/* Custom Toolbar (Top Center) */}
            {showControls && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
                    <div className="bg-background/90 backdrop-blur-md p-1.5 rounded-full border border-border shadow-2xl flex gap-1 pointer-events-auto">
                        <button
                            onClick={() => { setMapTypeId('roadmap'); setIsDark(false); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${mapTypeId === 'roadmap' && !isDark ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                            <Sun className="w-3.5 h-3.5" /> Light
                        </button>
                        <button
                            onClick={() => { setMapTypeId('roadmap'); setIsDark(true); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${mapTypeId === 'roadmap' && isDark ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                            <Moon className="w-3.5 h-3.5" /> Dark
                        </button>
                        <button
                            onClick={() => setMapTypeId('satellite')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${mapTypeId === 'satellite' ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                            <Satellite className="w-3.5 h-3.5" /> Satellite
                        </button>
                    </div>
                </div>
            )}

            {/* Locate Button (Bottom Right - Safe Zone) */}
            <button
                onClick={handleLocateMe}
                className="absolute bottom-8 right-8 z-10 w-12 h-12 bg-background/90 backdrop-blur-md flex items-center justify-center rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl border border-border cursor-pointer text-primary"
                title="Locate Me"
            >
                <Crosshair className="w-6 h-6" />
            </button>
        </div>
    );
};

export default MapComponent;
