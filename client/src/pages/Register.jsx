import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Car, Wrench, Loader2, MapPin, CheckCircle, Mail, ArrowRight, Camera, Upload, Search, Fuel, BatteryCharging, Maximize, X } from 'lucide-react';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { useTheme } from '../components/theme-provider';
import LeafletMapComponent from '../components/LeafletMapComponent';

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const [step, setStep] = useState(1);
    const toast = useToast();



    // Initial state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        vehicleModel: '',
        vehicleFuel: 'Petrol',
        vehiclePlate: '',
        phone: '+91',
        shopName: '',
        providerCategory: [], // ['Mechanic', 'Fuel Delivery']
        services: [],
        address: '',
        location: null, // { lat, lng }
        shopPhotoUrl: ''
    });

    const fileInputRef = useRef(null);
    const [mapCenter, setMapCenter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [canRenderModalMap, setCanRenderModalMap] = useState(false);
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
        let newCategories;
        let newServices = [...formData.services];

        if (current.includes(category)) {
            newCategories = current.filter(c => c !== category);
            // If Fuel Delivery is removed, remove automatic services
            if (category === 'Fuel Delivery') {
                newServices = newServices.filter(s => s !== 'Petrol' && s !== 'Diesel');
            }
        } else {
            newCategories = [...current, category];
            // If Fuel Delivery is added, auto-add specific services if not already present
            if (category === 'Fuel Delivery') {
                if (!newServices.includes('Petrol')) newServices.push('Petrol');
                if (!newServices.includes('Diesel')) newServices.push('Diesel');
            }
        }
        setFormData({ ...formData, providerCategory: newCategories, services: newServices });
    };

    const handleServiceToggle = (service) => {
        if (formData.services.includes(service)) {
            setFormData({ ...formData, services: formData.services.filter(s => s !== service) });
        } else {
            setFormData({ ...formData, services: [...formData.services, service] });
        }
    };

    const handleManualSearch = async () => {
        if (!searchInput.trim()) return;
        setSearchLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setMapCenter({ lat, lng });
                setFormData(prev => ({
                    ...prev,
                    address: data[0].display_name,
                    location: { lat, lng }
                }));
                setIsMapModalOpen(true);
            } else {
                alert("Location not found. Please try to be more specific or drag the marker on the map.");
            }
        } catch (err) {
            console.error("Geocoding Error:", err);
            alert("Failed to search location. Please drag the pin on the map instead.");
        } finally {
            setSearchLoading(false);
        }
    };

    // Reset render flag when modal closes
    useEffect(() => {
        if (!isMapModalOpen) setCanRenderModalMap(false);
    }, [isMapModalOpen]);

    const handleMapClick = async (e) => {
        if (e && e.latlng) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            setMapCenter({ lat, lng });
            setFormData(prev => ({ ...prev, location: { lat, lng } }));

            // Reverse Geocode to get accurate address
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                if (data && data.display_name) {
                    setFormData(prev => ({ ...prev, address: data.display_name }));
                }
            } catch (err) {
                console.error("Reverse Geocoding Error:", err);
            }
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleManualSearch();
        }
    };

    const handleMarkerDragEnd = async (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setFormData(prev => ({ ...prev, location: { lat, lng } }));

        // Reverse Geocode to get accurate address
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
                setFormData(prev => ({ ...prev, address: data.display_name }));
            }
        } catch (err) {
            console.error("Reverse Geocoding Error:", err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const firebaseUser = auth.currentUser;
            const ownerUid = firebaseUser?.uid || 'unknown';

            const formDataUpload = new FormData();
            formDataUpload.append('photo', file);
            formDataUpload.append('ownerUid', ownerUid);

            const uploadRes = await api.post('/api/upload/shop-photo', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setFormData(prev => ({ ...prev, shopPhotoUrl: uploadRes.data.url }));
            console.info('Shop photo uploaded via Cloudinary:', uploadRes.data.url);
        } catch (err) {
            console.error('Upload Error:', err);
            alert(`Failed to upload image: ${err?.response?.data?.details || err.message}`);
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
            let idToken = null;
            const user = auth.currentUser;

            if (hasAuthenticated && user) {
                idToken = await user.getIdToken();
            } else if (!formData.password) {
                alert("Please enter a password or sign up with Google");
                setLoading(false);
                return;
            }

            // Build Payload
            let payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: formData.role,
                photoUrl: googleUser?.photoUrl || ''
            };
            if (idToken) payload.idToken = idToken;

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

            if (formData.role === 'provider') {
                toast.success("Registration successful! Your profile is pending verification.");
                setTimeout(() => {
                    navigate('/verification-pending');
                }, 2000);
            } else {
                toast.success("You have successfully registered. Now login to continue.");
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
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
                    <Link to="/" className="inline-flex items-center justify-center mb-2">
                        <img src="/logo1.png" alt="FuelNFix Logo" className="h-16 md:h-20 w-auto" />
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
                    {/* Role Selection */}
                    <div className="space-y-6">
                        <div className="flex justify-center gap-4 py-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'user' })}
                                className={`flex-1 max-w-[200px] h-28 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${formData.role === 'user' ? 'bg-blue-500 text-white border-blue-500 shadow-xl shadow-blue-500/20 scale-105' : 'bg-background/50 border-border hover:border-blue-500/30 text-muted-foreground hover:bg-background/80'}`}
                            >
                                <User className="w-8 h-8" />
                                <span className="font-bold">User</span>
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
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 text-foreground/80">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                readOnly={hasAuthenticated}
                                className={`block w-full px-4 h-14 rounded-2xl border border-border bg-background/50 text-foreground shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${hasAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 text-foreground/80">Email</label>
                            <input
                                name="email"
                                type="email"
                                readOnly={hasAuthenticated}
                                className={`block w-full px-4 h-14 rounded-2xl border border-border bg-background/50 text-foreground shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${hasAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <label className="text-sm font-bold ml-1 text-foreground/80">Phone Number</label>
                            <input
                                name="phone"
                                type="tel"
                                placeholder="+91 XXXXX XXXXX"
                                className="block w-full px-4 h-14 rounded-2xl border border-border bg-background/50 text-foreground shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {!hasAuthenticated && (
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-bold ml-1 text-foreground/80">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    className="block w-full px-4 h-14 rounded-2xl border border-border bg-background/50 text-foreground shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!hasAuthenticated}
                                    placeholder="Create a secure password"
                                />
                            </div>
                        )}
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
                                    <div className="bg-card/40 p-6 rounded-3xl border border-border space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-blue-500">
                                            <MapPin className="w-4 h-4" /> Location Verification
                                        </h3>

                                        {/* Manual Location Search */}
                                        <div className="relative flex gap-2">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Search className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search shop location (e.g. Pune Station)"
                                                    value={searchInput}
                                                    onChange={(e) => setSearchInput(e.target.value)}
                                                    onKeyDown={handleSearchKeyDown}
                                                    className="block w-full pl-12 pr-4 h-14 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleManualSearch}
                                                disabled={searchLoading}
                                                className="px-6 h-14 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center min-w-[100px]"
                                            >
                                                {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                                            </button>
                                        </div>

                                        <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border/50 relative">
                                            <LeafletMapComponent
                                                center={mapCenter || { lat: 19.0760, lng: 72.8777 }}
                                                zoom={mapCenter ? 15 : 11}
                                                showControls={true}
                                                onClick={handleMapClick}
                                                forceDark={theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)}
                                                markers={formData.location ? [{
                                                    position: formData.location,
                                                    draggable: true,
                                                    onDragEnd: handleMarkerDragEnd,
                                                    icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' },
                                                    key: 'shop-location'
                                                }] : []}
                                            />
                                            {/* Expand Button */}
                                            <button
                                                type="button"
                                                onClick={() => setIsMapModalOpen(true)}
                                                className="absolute top-4 right-4 z-[1000] p-3 bg-background/90 backdrop-blur rounded-xl shadow-lg border border-border hover:bg-accent text-foreground transition-all"
                                                title="Full Screen Map"
                                            >
                                                <Maximize className="w-5 h-5" />
                                            </button>
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

            {/* --- Full Screen Map Modal --- */}
            <AnimatePresence>
                {isMapModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onAnimationComplete={() => setCanRenderModalMap(true)}
                            className="relative flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 z-10 shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                                        <MapPin className="w-5 h-5 text-blue-500" />
                                        Pinpoint Location
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Drag the marker exactly to your shop's entrance.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMapModalOpen(false)}
                                    className="p-3 bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                                </button>
                            </div>

                            {/* Map */}
                            <div className="flex-1 relative z-0 bg-zinc-100 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
                                {canRenderModalMap ? (
                                    <LeafletMapComponent
                                        center={mapCenter || { lat: 19.0760, lng: 72.8777 }}
                                        zoom={17}
                                        showControls={true}
                                        onClick={handleMapClick}
                                        forceDark={theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)}
                                        markers={formData.location ? [{
                                            position: formData.location,
                                            draggable: true,
                                            onDragEnd: handleMarkerDragEnd,
                                            icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' },
                                            key: 'shop-location-fullscreen'
                                        }] : []}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        <p className="text-sm font-bold text-zinc-500 animate-pulse">Initializing Map Engine...</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer / Confirm */}
                            <div className="p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 z-10 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm font-medium line-clamp-2 w-full sm:flex-1 text-zinc-700 dark:text-zinc-300">
                                    <span className="text-zinc-500 dark:text-zinc-500 font-bold mr-2 uppercase tracking-wider text-[10px]">Current Selection</span>
                                    <br />
                                    {formData.address || "No location selected"}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMapModalOpen(false)}
                                    className="w-full sm:w-auto px-10 py-4 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-[0.15em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    Confirm Details
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Register;
