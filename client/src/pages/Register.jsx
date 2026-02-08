import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Car, Wrench, Loader2, MapPin, CheckCircle, Mail, ArrowRight, Camera, Upload, Search, Fuel, BatteryCharging } from 'lucide-react';
import { auth, googleProvider, storage } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Autocomplete, Marker, useJsApiLoader } from '@react-google-maps/api';
import MapComponent from '../components/GoogleMaps/MapComponent';

const libraries = ['places', 'geometry'];

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    // Load Maps API for Autocomplete
    const { isLoaded: isMapsLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyDta1Z02aqGopcvuZTLPH1-AJRehMRDTAM",
        libraries
    });

    // Initial state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
        vehicleModel: '',
        vehicleFuel: 'Petrol',
        vehiclePlate: '',
        // Provider Fields
        shopName: '',
        providerCategory: [], // ['Mechanic', 'Fuel Delivery']
        services: [],
        address: '',
        location: null, // { lat, lng }
        shopPhotoUrl: ''
    });

    const fileInputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [mapCenter, setMapCenter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [googleUser, setGoogleUser] = useState(null);
    const [hasAuthenticated, setHasAuthenticated] = useState(false); // Track if user authenticated in this session

    const [availableServices, setAvailableServices] = useState([]);

    // Load data from Google Redirect & Fetch Services
    useEffect(() => {
        // Fetch Services (Mechanic Only)
        api.get('/api/admin-features/pricing')
            .then(res => setAvailableServices(res.data))
            .catch(err => console.error("Failed to load services", err));

        // Only prefill if coming from login redirect with googleData
        if (location.state?.googleData) {
            const { name, email, photoUrl } = location.state.googleData;
            setFormData(prev => ({ ...prev, name, email }));
            setGoogleUser({ photoUrl });
            setHasAuthenticated(true);
        }
    }, [location.state]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCategoryToggle = (category) => {
        const current = formData.providerCategory;
        if (current.includes(category)) {
            setFormData({ ...formData, providerCategory: current.filter(c => c !== category) });
        } else {
            setFormData({ ...formData, providerCategory: [...current, category] });
        }
    };

    const handleServiceToggle = (service) => {
        if (formData.services.includes(service)) {
            setFormData({ ...formData, services: formData.services.filter(s => s !== service) });
        } else {
            setFormData({ ...formData, services: [...formData.services, service] });
        }
    };

    const onLoadAutocomplete = (autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                setFormData(prev => ({
                    ...prev,
                    address: place.formatted_address,
                    location: { lat, lng }
                }));
                setMapCenter({ lat, lng });
            }
        }
    };

    const handleMarkerDragEnd = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setFormData(prev => ({ ...prev, location: { lat, lng } }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `shop-photos/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            setFormData(prev => ({ ...prev, shopPhotoUrl: downloadURL }));
        } catch (err) {
            console.error("Upload Error:", err);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const idToken = await user.getIdToken();

            // Check if user already exists
            try {
                const res = await api.post('/api/auth/login', { idToken });
                const userData = res.data.user;
                localStorage.setItem('user', JSON.stringify(userData));

                // Smart Redirection based on Role
                if (userData.role === 'provider') {
                    if (userData.isVerified) {
                        navigate('/provider-dashboard');
                    } else {
                        navigate('/verification-pending');
                    }
                } else if (userData.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } catch (loginErr) {
                if (loginErr.response && loginErr.response.status === 404) {
                    setFormData(prev => ({
                        ...prev,
                        name: user.displayName,
                        email: user.email
                    }));
                    setGoogleUser({ photoUrl: user.photoURL });
                    setHasAuthenticated(true);
                } else {
                    throw loginErr;

                }
            }
        } catch (err) {
            console.error("Google Signup Error:", err);
            alert("Signup Failed. " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("No authenticated user found. Please sign in with Google first.");
                await handleGoogleSignup();
                return;
            }

            const idToken = await user.getIdToken();

            // Build Payload
            let payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                photoUrl: googleUser?.photoUrl || '',
                idToken
            };

            if (formData.role === 'user') {
                payload.vehicleDetails = {
                    model: formData.vehicleModel,
                    fuelType: formData.vehicleFuel,
                    plateNumber: formData.vehiclePlate
                };
                // Fix: Include default location for users to satisfy GeoJSON index requirements
                // Or ensure backend default is used. Since the error says "got type missing", 
                // it implies we might be sending a partial object or the schema requires it.
                // Safest bet: Send a valid default point [0,0] if none exists.
                payload.location = {
                    type: "Point",
                    coordinates: [0, 0]
                };
                payload.liveLocation = {
                    type: "Point",
                    coordinates: [0, 0]
                };
            } else {
                // Provider Payload
                if (!formData.location) {
                    alert("Please select your shop location on the map.");
                    setLoading(false);
                    return;
                }
                if (!formData.shopPhotoUrl) {
                    alert("Please upload a photo of your shop.");
                    setLoading(false);
                    return;
                }
                if (formData.providerCategory.length === 0) {
                    alert("Please select at least one service category (Mechanic or Fuel Delivery).");
                    setLoading(false);
                    return;
                }
                if ((formData.providerCategory.includes('Mechanic') || formData.providerCategory.includes('EV Support')) && formData.services.length === 0) {
                    alert("Please select at least one specific service (e.g., Flat Tire, EV Charging) from the lists below.");
                    setLoading(false);
                    return;
                }

                payload.shopName = formData.shopName;
                payload.providerCategory = formData.providerCategory;
                payload.services = formData.services;
                payload.address = formData.address;
                payload.shopPhotoUrl = formData.shopPhotoUrl;
                payload.location = {
                    type: 'Point',
                    coordinates: [formData.location.lng, formData.location.lat]
                };
                payload.isVerified = false; // Force verification
            }

            console.log("Sending registration payload:", payload);
            const response = await api.post('/api/auth/register', payload);
            console.log("Registration successful:", response.data);

            toast.success("Account created successfully!");

            // Add a small delay regarding navigation to ensure toast is seen and state is settled
            setTimeout(() => {
                if (formData.role === 'provider') {
                    navigate('/verification-pending');
                } else {
                    navigate('/dashboard');
                }
            }, 1000);

        } catch (err) {
            console.error("Registration Error:", err);
            // Handle specifically if it's a 404 (which shouldn't happen for register, but just in case)
            if (err.response && err.response.status === 404) {
                alert("Server URL not found. Please check your connection or contact support.");
            } else {
                alert(err.response?.data?.message || err.message || 'Registration failed. Check console for details.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4 py-10 selection:bg-blue-500/30">
            {/* Ambient Background - Blue Theme */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse-slow"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl w-full bg-card/50 backdrop-blur-2xl border border-blue-500/10 rounded-[2.5rem] p-8 md:p-12 relative z-10 shadow-2xl shadow-blue-500/5"
            >
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 text-3xl font-black tracking-tighter justify-center mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <MapPin className="w-6 h-6 fill-current" />
                        </div>
                        <span>Fuel<span className="text-blue-500">N</span>Fix</span>
                    </Link>
                    <h2 className="text-2xl font-bold">Complete your Profile</h2>
                </div>

                {/* Profile Photo Preview */}
                {googleUser?.photoUrl && hasAuthenticated && (
                    <div className="flex justify-center mb-6">
                        <img src={googleUser.photoUrl} alt="Profile" className="w-20 h-20 rounded-full border-4 border-blue-500/20 shadow-xl" />
                    </div>
                )}
                {!hasAuthenticated && (
                    <div className="mb-8">
                        <button
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="w-full h-14 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            ) : (
                                <>
                                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                                    <span>Sign up with Google</span>
                                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all duration-300" />
                                </>
                            )}
                        </button>
                        <div className="relative mt-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background/0 backdrop-blur-sm px-2 text-muted-foreground font-bold">
                                    Or verify details below
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <form className="space-y-8" onSubmit={handleSubmit}>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 text-foreground/80">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                readOnly={!!formData.name}
                                className="block w-full px-4 h-14 rounded-2xl border border-border bg-background/50 text-foreground shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 text-foreground/80">Email</label>
                            <input
                                name="email"
                                type="email"
                                readOnly={!!formData.email}
                                className="block w-full px-4 h-14 rounded-2xl border border-border bg-background/50 text-foreground shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-6">
                        <div className="flex justify-center gap-4 py-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'user' })}
                                className={`flex-1 max-w-[200px] h-28 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${formData.role === 'user' ? 'bg-blue-500 text-white border-blue-500 shadow-xl shadow-blue-500/20 scale-105' : 'bg-background/50 border-border hover:border-blue-500/30 text-muted-foreground hover:bg-background/80'}`}
                            >
                                <Car className="w-8 h-8" />
                                <span className="font-bold">Motorist</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'provider' })}
                                className={`flex-1 max-w-[200px] h-28 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${formData.role === 'provider' ? 'bg-blue-500 text-white border-blue-500 shadow-xl shadow-blue-500/20 scale-105' : 'bg-background/50 border-border hover:border-blue-500/30 text-muted-foreground hover:bg-background/80'}`}
                            >
                                <Wrench className="w-8 h-8" />
                                <span className="font-bold">Provider</span>
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {formData.role === 'user' ? (
                                <motion.div
                                    key="user-form"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10 space-y-4"
                                >
                                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-blue-500">
                                        <Car className="w-4 h-4" /> Vehicle Details
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <input
                                                name="vehicleModel"
                                                type="text"
                                                placeholder="Vehicle Model (e.g. Honda City)"
                                                className="block w-full px-4 h-12 rounded-xl border border-border bg-background/80 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <select
                                                name="vehicleFuel"
                                                className="block w-full px-4 h-12 rounded-xl border border-border bg-background/80 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                onChange={handleChange}
                                            >
                                                <option value="Petrol">Petrol</option>
                                                <option value="Diesel">Diesel</option>
                                                <option value="CNG">CNG</option>
                                                <option value="Electric">Electric</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="provider-form"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Shop Details */}
                                    <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-blue-500">
                                            <Wrench className="w-4 h-4" /> Business Info
                                        </h3>
                                        <input
                                            name="shopName"
                                            type="text"
                                            placeholder="Shop / Business Name"
                                            className="block w-full px-4 h-14 rounded-2xl border border-border bg-background/80 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none font-bold transition-all"
                                            onChange={handleChange}
                                            required
                                        />

                                        {/* Category Selection */}
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground ml-1 mb-2 block">Service Category (Select at least one)</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCategoryToggle('Fuel Delivery')}
                                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold ${formData.providerCategory.includes('Fuel Delivery') ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-background border-border hover:border-blue-500/50'}`}
                                                >
                                                    <Fuel className="w-5 h-5" /> Fuel Delivery
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCategoryToggle('Mechanic')}
                                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold ${formData.providerCategory.includes('Mechanic') ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-background border-border hover:border-blue-500/50'}`}
                                                >
                                                    <Wrench className="w-5 h-5" /> Mechanic
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCategoryToggle('EV Support')}
                                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold ${formData.providerCategory.includes('EV Support') ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' : 'bg-background border-border hover:border-green-500/50'}`}
                                                >
                                                    <BatteryCharging className="w-5 h-5" /> EV Support
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mechanic Services - Only if Mechanic is selected */}
                                        {formData.providerCategory.includes('Mechanic') && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pt-2"
                                            >
                                                <label className="text-xs font-bold text-muted-foreground ml-1 mb-2 block">Mechanic Services Offered</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {availableServices.filter(s => s.category === 'Mechanic').map(service => (
                                                        <button
                                                            key={service._id}
                                                            type="button"
                                                            onClick={() => handleServiceToggle(service.serviceName)}
                                                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${formData.services.includes(service.serviceName)
                                                                ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                                                : 'bg-background border-border hover:border-blue-500/50'
                                                                }`}
                                                        >
                                                            {service.serviceName}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* EV Support Services - Only if EV Support is selected */}
                                        {formData.providerCategory.includes('EV Support') && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pt-2"
                                            >
                                                <label className="text-xs font-bold text-muted-foreground ml-1 mb-2 block">EV Support Services</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {availableServices.filter(s => s.category === 'EV Support').map(service => (
                                                        <button
                                                            key={service._id}
                                                            type="button"
                                                            onClick={() => handleServiceToggle(service.serviceName)}
                                                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${formData.services.includes(service.serviceName)
                                                                ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                                                                : 'bg-background border-border hover:border-green-500/50'
                                                                }`}
                                                        >
                                                            {service.serviceName}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Location Map */}
                                    {isMapsLoaded ? (
                                        <div className="bg-card/40 p-6 rounded-3xl border border-border space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-blue-500">
                                                <MapPin className="w-4 h-4" /> Location Verification
                                            </h3>

                                            {/* Autocomplete Search */}
                                            <div className="relative">
                                                <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Search className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Search your shop (e.g. Starbucks Mumbai)"
                                                            className="block w-full pl-12 pr-4 h-14 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                </Autocomplete>
                                            </div>

                                            <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border/50 relative">
                                                <MapComponent
                                                    center={mapCenter || { lat: 19.0760, lng: 72.8777 }}
                                                    zoom={mapCenter ? 15 : 11}
                                                >
                                                    {/* Draggable Marker */}
                                                    {formData.location && (
                                                        <Marker
                                                            position={formData.location}
                                                            draggable={true}
                                                            onDragEnd={handleMarkerDragEnd}
                                                            icon={{
                                                                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                                                            }}
                                                        />
                                                    )}
                                                </MapComponent>
                                                {!formData.location && (
                                                    <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                                                        <p className="text-white font-bold bg-black/50 px-4 py-2 rounded-full">Search your location above</p>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground text-center">
                                                Search for your address, then <strong>drag the blue marker</strong> to your exact shop entrance.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="h-32 flex items-center justify-center bg-card/50 rounded-3xl border border-border">
                                            <p className="text-muted-foreground animate-pulse">Loading Google Maps...</p>
                                        </div>
                                    )}

                                    {/* Photo Upload (Real) */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />

                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        className="border-2 border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center hover:bg-accent/5 transition-colors cursor-pointer group relative overflow-hidden"
                                    >
                                        {formData.shopPhotoUrl ? (
                                            <>
                                                <img src={formData.shopPhotoUrl} alt="Shop Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                                                <div className="relative z-10">
                                                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white mb-2 mx-auto">
                                                        <CheckCircle className="w-8 h-8" />
                                                    </div>
                                                    <h4 className="font-bold text-lg text-foreground">Photo Uploaded</h4>
                                                    <p className="text-sm text-foreground/80 font-medium">Click to change</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {uploading ? (
                                                    <div className="w-16 h-16 flex items-center justify-center">
                                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                        <Camera className="w-8 h-8" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-bold text-lg">{uploading ? 'Uploading...' : 'Upload Shop Photo'}</h4>
                                                    <p className="text-sm text-muted-foreground">Photo of your storefront with name board.</p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="w-full h-14 rounded-full bg-blue-500 text-white font-bold text-lg hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Complete Registration'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-muted-foreground text-sm font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-500 hover:text-blue-400 transition-colors font-bold ml-1">
                            Log in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
