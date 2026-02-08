// Redesigned 5-Step Wizard
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { Camera, MapPin, ChevronLeft, ChevronRight, Loader2, Star, CheckCircle, Upload, Car, Search, Wrench, X, Plus, Minus, Crosshair, Map, Moon, Sun, Satellite } from 'lucide-react';
import api from '../lib/api';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Uber-style dark map theme
const UBER_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#212121" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
    { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
    { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

const RequestHelpWizard = ({ category, services, availableServices, userLocation, onCancel, onSuccess, onMapMode }) => {

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyDta1Z02aqGopcvuZTLPH1-AJRehMRDTAM",
        libraries: ['places', 'geometry']
    });

    const [step, setStep] = useState(services?.length > 0 ? 2 : 1);

    // ...

    useEffect(() => {
        if (onMapMode) onMapMode(step === 4 || step === 5);
    }, [step, onMapMode]);

    // State
    const [selectedServices, setSelectedServices] = useState(new Set(services?.map(s => s.name) || []));
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [userVehicles, setUserVehicles] = useState([]);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [confirmedLocation, setConfirmedLocation] = useState(userLocation);
    const [providers, setProviders] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mapZoom, setMapZoom] = useState(15);
    const [mapType, setMapType] = useState('dark'); // 'dark' | 'light' | 'satellite'
    const mapRef = useRef(null);

    const fileInputRef = useRef(null);

    // Fetch User Vehicles on Mount
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.vehicles) {
            setUserVehicles(user.vehicles);
            if (user.vehicles.length > 0) setSelectedVehicle(user.vehicles[0]); // Default to first
        }
    }, []);

    // Helper: Toggle Service
    const toggleService = (serviceName) => {
        const newSet = new Set(selectedServices);
        if (newSet.has(serviceName)) newSet.delete(serviceName);
        else newSet.add(serviceName);
        setSelectedServices(newSet);
    };

    // Step 1: Handle Photo Upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSearchProviders = async () => {
        if (!userLocation) {
            alert("Location not available.");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/request/search-providers', {
                serviceNames: Array.from(selectedServices),
                originLat: confirmedLocation.lat,
                originLng: confirmedLocation.lng,
                category: category // Pass category for rate logic
            });
            setProviders(res.data);
            setStep(5); // Go to Map Provider Selection
        } catch (err) {
            console.error(err);
            alert("No providers found nearby.");
        } finally {
            setLoading(false);
        }
    };

    const handleBookProvider = async () => {
        if (!selectedProvider) return;
        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            let uploadedPhotoUrl = "";

            // Upload Photo to Firebase if exists
            if (imageFile) {
                const storageRef = ref(storage, `problem_photos/${user.name}/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                uploadedPhotoUrl = await getDownloadURL(snapshot.ref);
            }

            const payload = {
                customerId: user._id,
                providerId: selectedProvider.provider.id,
                category: category, // Passed from prop
                fuelDetails: category === 'Fuel Delivery' ? {
                    fuelType: Array.from(selectedServices)[0] // 'Petrol' or 'Diesel'
                } : undefined,
                serviceTypes: Array.from(selectedServices),
                serviceType: Array.from(selectedServices)[0], // Legacy
                vehicle: selectedVehicle, // Attach Vehicle Info
                location: {
                    coordinates: [confirmedLocation.lng, confirmedLocation.lat],
                    address: "Confirmed Location"
                },
                problemPhotoUrl: uploadedPhotoUrl, // Use Real Firebase URL
                pricing: selectedProvider
            };

            await api.post('/api/request/create', payload);
            onSuccess();
        } catch (err) {
            console.error("Booking Error:", err);
            alert("Booking failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Wizard Render Map
    // Step 5 Map Config
    const fullMapStyle = { width: '100%', height: '100%' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            {/* Step 4 & 5 are Full Screen Map Mode */}
            {(step === 4 || step === 5) ? (
                <div className="absolute inset-0 bg-background">
                    {/* Step 4 - Location Confirmation Fullscreen */}
                    {step === 4 && isLoaded && window.google && (
                        <>
                            <GoogleMap
                                mapContainerStyle={fullMapStyle}
                                center={confirmedLocation}
                                zoom={mapZoom}
                                onLoad={(map) => { mapRef.current = map; }}
                                mapTypeId={mapType === 'satellite' ? 'hybrid' : 'roadmap'}
                                options={{
                                    disableDefaultUI: true,
                                    zoomControl: false,
                                    styles: mapType === 'dark' ? UBER_STYLE : mapType === 'light' ? [] : null,
                                }}
                            >
                                <Marker
                                    draggable
                                    position={confirmedLocation}
                                    onDragEnd={(e) => setConfirmedLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        scale: 12,
                                        fillColor: "#4F46E5",
                                        fillOpacity: 1,
                                        strokeColor: "#ffffff",
                                        strokeWeight: 3,
                                    }}
                                />
                            </GoogleMap>

                            {/* Top Bar */}
                            <div className="absolute top-0 left-0 right-0 p-8 pt-12 flex justify-between items-start bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none">
                                <button onClick={() => setStep(3)} className="pointer-events-auto p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 transition-all active:scale-95 shadow-lg">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="text-right">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-2 rounded-2xl inline-block"
                                    >
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-end">
                                            <MapPin className="w-4 h-4" />
                                            Confirm Location
                                        </h2>
                                        <p className="text-white/70 text-xs font-medium">Drag pin to adjust</p>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Map Controls - Right Side */}
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
                                <button
                                    onClick={() => setMapZoom(prev => Math.min(prev + 1, 20))}
                                    className="p-3 bg-card/90 backdrop-blur-md rounded-xl shadow-lg border border-border/50 text-foreground hover:bg-white hover:text-black transition-all active:scale-95"
                                    title="Zoom In"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setMapZoom(prev => Math.max(prev - 1, 10))}
                                    className="p-3 bg-card/90 backdrop-blur-md rounded-xl shadow-lg border border-border/50 text-foreground hover:bg-white hover:text-black transition-all active:scale-95"
                                    title="Zoom Out"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (mapRef.current) {
                                            mapRef.current.panTo(confirmedLocation);
                                            setMapZoom(16);
                                        }
                                    }}
                                    className="p-3 bg-card/90 backdrop-blur-md rounded-xl shadow-lg border border-border/50 text-foreground hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                    title="Recenter Map"
                                >
                                    <Crosshair className="w-5 h-5" />
                                </button>
                                <div className="h-px w-full bg-border/50"></div>
                                <button
                                    onClick={() => setMapType('satellite')}
                                    className={`p-3 backdrop-blur-md rounded-xl shadow-lg border border-border/50 transition-all active:scale-95 ${mapType === 'satellite' ? 'bg-blue-500 text-white' : 'bg-card/90 text-foreground hover:bg-white hover:text-black'}`}
                                    title="Satellite View"
                                >
                                    <Satellite className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setMapType('dark')}
                                    className={`p-3 backdrop-blur-md rounded-xl shadow-lg border border-border/50 transition-all active:scale-95 ${mapType === 'dark' ? 'bg-zinc-800 text-white' : 'bg-card/90 text-foreground hover:bg-white hover:text-black'}`}
                                    title="Dark Mode"
                                >
                                    <Moon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setMapType('light')}
                                    className={`p-3 backdrop-blur-md rounded-xl shadow-lg border border-border/50 transition-all active:scale-95 ${mapType === 'light' ? 'bg-yellow-400 text-black' : 'bg-card/90 text-foreground hover:bg-white hover:text-black'}`}
                                    title="Light Mode"
                                >
                                    <Sun className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Bottom Action Button */}
                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                                <button
                                    onClick={handleSearchProviders}
                                    disabled={loading}
                                    className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black rounded-3xl text-xl shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                        <>
                                            <Search className="w-6 h-6" />
                                            Search Providers
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 5 - Providers Found */}
                    {step === 5 && isLoaded && window.google && (
                        <GoogleMap
                            mapContainerStyle={fullMapStyle}
                            center={confirmedLocation}
                            zoom={mapZoom}
                            onLoad={(map) => { mapRef.current = map; }}
                            mapTypeId={mapType === 'satellite' ? 'hybrid' : 'roadmap'}
                            options={{
                                disableDefaultUI: true,
                                zoomControl: false,
                                styles: mapType === 'dark' ? UBER_STYLE : mapType === 'light' ? [] : null,
                            }}
                        >
                            {/* User Marker */}
                            <Marker
                                position={confirmedLocation}
                                icon={{
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: 10,
                                    fillColor: "#4F46E5", // Primary Color
                                    fillOpacity: 1,
                                    strokeColor: "#ffffff",
                                    strokeWeight: 3,
                                }}
                            />

                            {/* Provider Markers with Labels */}
                            {providers.map((p, index) => (
                                <OverlayView
                                    key={p.provider.id}
                                    position={{ lat: p.provider.location.coordinates[1], lng: p.provider.location.coordinates[0] }}
                                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                >
                                    <div
                                        onClick={() => setSelectedProvider(p)}
                                        className={`cursor-pointer transform -translate-x-1/2 -translate-y-full transition-all hover:scale-110 ${selectedProvider?.provider.id === p.provider.id ? 'scale-110 z-50' : ''}`}
                                    >
                                        {/* Blinking Label Card */}
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: index * 0.1, type: 'spring' }}
                                            className="relative"
                                        >
                                            <div className={`bg-white dark:bg-zinc-900 px-3 py-2 rounded-2xl shadow-xl border-2 ${selectedProvider?.provider.id === p.provider.id ? 'border-blue-500 shadow-blue-500/30' : 'border-white/50 dark:border-zinc-700'} min-w-[100px] text-center`}>
                                                {/* Pulse Animation */}
                                                <div className="absolute -top-1 -right-1 w-3 h-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                </div>

                                                {/* Provider Name */}
                                                <p className="font-bold text-xs text-zinc-900 dark:text-white truncate max-w-[90px]">
                                                    {p.provider.shopName || p.provider.name}
                                                </p>

                                                {/* Price & Rating Row */}
                                                <div className="flex items-center justify-center gap-2">
                                                    <p className="font-black text-sm text-blue-500">
                                                        ₹{Math.round(p.totalEstimate)}{category === 'Fuel Delivery' ? <span className="text-[10px] text-orange-500 ml-0.5">+Fuel</span> : ''}
                                                    </p>
                                                    {p.provider.rating > 0 && (
                                                        <div className="flex items-center text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-lg">
                                                            <Star className="w-2.5 h-2.5 fill-current mr-0.5" /> {p.provider.rating}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Distance */}
                                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                                    {Number(p.distance).toFixed(1)} km
                                                </p>
                                            </div>

                                            {/* Arrow pointing down */}
                                            <div className="w-0 h-0 mx-auto border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white dark:border-t-zinc-900"></div>

                                            {/* Marker Dot */}
                                            <div className="absolute left-1/2 -translate-x-1/2 -bottom-3">
                                                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </OverlayView>
                            ))}
                        </GoogleMap>
                    )}

                    {/* Top Bar - ONLY for Step 5 */}
                    {step === 5 && (
                        <div className="absolute top-0 left-0 right-0 p-8 pt-12 flex justify-between items-start bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none">
                            <button onClick={() => setStep(4)} className="pointer-events-auto p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 transition-all active:scale-95 shadow-lg">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="text-right">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-2 rounded-2xl inline-block"
                                >
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-end">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        {providers.length} Providers Nearby
                                    </h2>
                                    <p className="text-white/70 text-xs font-medium">Tap a card to view offer</p>
                                </motion.div>
                            </div>
                        </div>
                    )}


                    {/* Map Controls - Right Side */}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
                        {/* Zoom In */}
                        <button
                            onClick={() => setMapZoom(prev => Math.min(prev + 1, 20))}
                            className="p-3 bg-card/90 backdrop-blur-md rounded-xl shadow-lg border border-border/50 text-foreground hover:bg-white hover:text-black transition-all active:scale-95"
                            title="Zoom In"
                        >
                            <Plus className="w-5 h-5" />
                        </button>

                        {/* Zoom Out */}
                        <button
                            onClick={() => setMapZoom(prev => Math.max(prev - 1, 10))}
                            className="p-3 bg-card/90 backdrop-blur-md rounded-xl shadow-lg border border-border/50 text-foreground hover:bg-white hover:text-black transition-all active:scale-95"
                            title="Zoom Out"
                        >
                            <Minus className="w-5 h-5" />
                        </button>

                        {/* Recenter */}
                        <button
                            onClick={() => {
                                if (mapRef.current) {
                                    mapRef.current.panTo(confirmedLocation);
                                    setMapZoom(15);
                                }
                            }}
                            className="p-3 bg-card/90 backdrop-blur-md rounded-xl shadow-lg border border-border/50 text-foreground hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                            title="Recenter Map"
                        >
                            <Crosshair className="w-5 h-5" />
                        </button>

                        {/* Divider */}
                        <div className="h-px w-full bg-border/50"></div>

                        {/* Satellite Mode */}
                        <button
                            onClick={() => setMapType('satellite')}
                            className={`p-3 backdrop-blur-md rounded-xl shadow-lg border border-border/50 transition-all active:scale-95 ${mapType === 'satellite' ? 'bg-blue-500 text-white' : 'bg-card/90 text-foreground hover:bg-white hover:text-black'}`}
                            title="Satellite View"
                        >
                            <Satellite className="w-5 h-5" />
                        </button>

                        {/* Dark Mode */}
                        <button
                            onClick={() => setMapType('dark')}
                            className={`p-3 backdrop-blur-md rounded-xl shadow-lg border border-border/50 transition-all active:scale-95 ${mapType === 'dark' ? 'bg-zinc-800 text-white' : 'bg-card/90 text-foreground hover:bg-white hover:text-black'}`}
                            title="Dark Mode"
                        >
                            <Moon className="w-5 h-5" />
                        </button>

                        {/* Light Mode */}
                        <button
                            onClick={() => setMapType('light')}
                            className={`p-3 backdrop-blur-md rounded-xl shadow-lg border border-border/50 transition-all active:scale-95 ${mapType === 'light' ? 'bg-yellow-400 text-black' : 'bg-card/90 text-foreground hover:bg-white hover:text-black'}`}
                            title="Light Mode"
                        >
                            <Sun className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Bottom Sheet for Selected Provider */}
                    <AnimatePresence>
                        {selectedProvider && (
                            <motion.div
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="absolute bottom-0 left-0 right-0 bg-card/90 backdrop-blur-2xl border-t border-white/20 rounded-t-[3rem] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-20"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedProvider(null)}
                                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all z-30"
                                >
                                    <X className="w-5 h-5 text-foreground" />
                                </button>

                                <div className="w-12 h-1.5 bg-border/50 rounded-full mx-auto mb-8"></div>

                                <div className="flex gap-6 mb-8">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500/80 p-0.5 shadow-xl shadow-blue-500/20">
                                        <div className="w-full h-full bg-card rounded-[1.4rem] flex items-center justify-center">
                                            {/* Provider Avatar Placeholder */}
                                            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-blue-500 to-indigo-500">
                                                {selectedProvider.provider.name[0]}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight">{selectedProvider.provider.name}</h3>
                                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground mt-1">
                                                    {selectedProvider.provider.rating > 0 ? (
                                                        <span className="flex items-center text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-lg">
                                                            <Star className="w-3.5 h-3.5 fill-current mr-1" /> {selectedProvider.provider.rating}
                                                            <span className="text-[10px] ml-1 opacity-70">({selectedProvider.provider.totalReviews})</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic text-xs bg-muted/50 px-2 py-0.5 rounded-lg whitespace-nowrap">No reviews yet</span>
                                                    )}
                                                    <span>•</span>
                                                    <span>{Number(selectedProvider.distance).toFixed(1)} km away</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
                                                    ₹{Math.round(selectedProvider.totalEstimate)}{category === 'Fuel Delivery' && <span className="text-lg text-muted-foreground font-bold ml-1">+ Fuel</span>}
                                                </div>
                                                <p className="text-xs font-bold text-green-500 uppercase tracking-widest mt-1">Best Offer</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm font-medium text-muted-foreground bg-accent/30 p-4 rounded-2xl border border-border/50">
                                        {category === 'Fuel Delivery' ? (
                                            <>
                                                <div className="flex justify-between col-span-2">
                                                    <span>Delivery ({Number(selectedProvider.distance).toFixed(1)}km)</span>
                                                    <span className="text-foreground font-bold">₹{Math.round(selectedProvider.distanceFee)}</span>
                                                </div>
                                                <div className="flex justify-between col-span-2 border-t border-border/50 pt-2 mt-2">
                                                    <span className="text-orange-500 font-bold uppercase text-xs tracking-wider mt-0.5">{Array.from(selectedServices)[0] || 'Fuel'} Rate</span>
                                                    <span className="text-foreground font-black text-lg">₹{selectedProvider.pricePerLitre}/L</span>
                                                </div>
                                                <p className="text-[10px] col-span-2 text-center opacity-70">* Fuel cost will be added to bill</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>Base Fee</span>
                                                    <span className="text-foreground font-bold">₹{selectedProvider.baseFee}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Travel ({Number(selectedProvider.distance).toFixed(1)}km)</span>
                                                    <span className="text-foreground font-bold">₹{Math.round(selectedProvider.distanceFee)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleBookProvider}
                                        disabled={loading}
                                        className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black rounded-3xl text-xl shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-3xl"></div>
                                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                            <>Confirm Booking <ChevronRight className="w-6 h-6" /></>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                // Steps 1-4: Modal Wizard
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card w-full max-w-lg max-h-[90vh] flex flex-col rounded-[3rem] border border-border shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-border/50 flex items-center justify-between bg-accent/20">
                        <button onClick={() => {
                            if (category === 'Fuel Delivery' && step === 2) {
                                onCancel();
                            } else {
                                step > 1 ? setStep(step - 1) : onCancel();
                            }
                        }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-black">
                            {step === 1 ? 'Select Services' : step === 2 ? 'Which Vehicle?' : step === 3 ? 'Add a Photo' : 'Confirm Location'}
                        </h2>
                        <div className="w-10"></div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {step === 1 && (
                            <div className="grid grid-cols-2 gap-4">
                                {availableServices?.map(s => {
                                    const isSelected = selectedServices.has(s.name);
                                    return (
                                        <button
                                            key={s.name}
                                            onClick={() => toggleService(s.name)}
                                            className={`p-4 rounded-3xl border text-center flex flex-col items-center gap-3 transition-all ${isSelected ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500' : 'bg-card border-border hover:border-blue-500/50'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-500 text-white' : 'bg-accent'}`}>
                                                {s.icon}
                                            </div>
                                            <span className="font-bold">{s.name}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                {userVehicles.length === 0 ? (
                                    <div className="text-center py-10 opacity-60">
                                        <Car className="w-12 h-12 mx-auto mb-2" />
                                        <p>No vehicles added. Please add one in Settings.</p>
                                    </div>
                                ) : (
                                    userVehicles.map((v, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedVehicle(v)}
                                            className={`p-4 rounded-3xl border flex items-center gap-4 cursor-pointer transition-all ${selectedVehicle?.plateNumber === v.plateNumber ? 'bg-blue-500/10 border-blue-500' : 'bg-card border-border hover:border-blue-500/30'}`}
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                                                <Car className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">{v.model}</h4>
                                                <p className="text-sm text-muted-foreground">{v.plateNumber} • {v.fuelType}</p>
                                            </div>
                                            {selectedVehicle?.plateNumber === v.plateNumber && <CheckCircle className="ml-auto text-blue-500 w-6 h-6" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col gap-6">
                                <div onClick={() => fileInputRef.current.click()} className="aspect-video relative rounded-3xl border-2 border-dashed border-border hover:border-blue-500/50 cursor-pointer overflow-hidden group transition-all flex items-center justify-center bg-accent/20">
                                    {imagePreview ? (
                                        <img src={imagePreview} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-10 h-10 mx-auto mb-2" />
                                            <span className="font-bold">Tap to Upload Photo</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-md">
                        <button
                            disabled={
                                (step === 1 && selectedServices.size === 0) ||
                                (step === 2 && !selectedVehicle) ||
                                (step === 3 && !imageFile && false) // Photo Optional? Let's keep mandatory in UI but maybe code allows skip
                            }
                            onClick={() => setStep(step + 1)}
                            className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                        >
                            Continue
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default RequestHelpWizard;
