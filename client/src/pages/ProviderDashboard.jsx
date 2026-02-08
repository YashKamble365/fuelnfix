import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, List, Wrench, Settings, LogOut, Menu, Bell,
    MapPin, CheckCircle, XCircle, Clock, Star, Activity, DollarSign,
    Power, Navigation, ChevronRight, User, Plus, Trash2, Edit2, Save, X, IndianRupee, ChevronDown, Check,
    Phone, Shield, ImageIcon, Car, PlayCircle, History, Fuel, Megaphone
} from 'lucide-react';
import { io } from 'socket.io-client';
import { load } from '@cashfreepayments/cashfree-js';
import api, { API_BASE_URL } from '../lib/api';
import MapComponent from '../components/GoogleMaps/MapComponent';
import { auth } from '../firebaseConfig';
import { Marker } from '@react-google-maps/api';
import LiveChat from '../components/LiveChat';
import PhoneInput from '../components/PhoneInput';
import { ModeToggle } from '../components/mode-toggle';
import { useTheme } from '../components/theme-provider';
import FeedbackModal from '../components/FeedbackModal';
import polyline from '@mapbox/polyline';
import { useToast } from '../components/Toast';
const CAR_SYMBOL = {
    path: "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z",
    fillColor: "#4285F4",
    fillOpacity: 1,
    scale: 0.6,
    strokeColor: "white",
    strokeWeight: 2,
    anchor: { x: 12, y: 25 },
};

const ProviderDashboard = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState(null);
    const userIdRef = useRef(null); // Ref to hold user ID for stable access in effects
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);

    // Mock Data
    const [stats, setStats] = useState({
        earnings: 0,
        todayEarnings: 0,
        jobsCompleted: 0,
        rating: 5.0,
        activeRequests: 0
    });

    const [requests, setRequests] = useState([]);
    const [myServices, setMyServices] = useState([]);
    const [newService, setNewService] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Request Handling
    const [activeJob, setActiveJob] = useState(null);
    const [availableServices, setAvailableServices] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null); // For detailed view modal
    const [requestFilter, setRequestFilter] = useState('All');
    const [serviceFilter, setServiceFilter] = useState('All');

    // Settings
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [updateData, setUpdateData] = useState({ shopName: '', address: '', phone: '', location: null });
    const [mapCenter, setMapCenter] = useState(null); // For location picker

    // Real-Time Request State
    const [incomingRequest, setIncomingRequest] = useState(null);
    const [socket, setSocket] = useState(null);

    // Job Completion State
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [materialCost, setMaterialCost] = useState('');
    const [assignmentDetails, setAssignmentDetails] = useState({ name: '', phone: '' });

    // Bill Modal State
    const [showBillModal, setShowBillModal] = useState(false);
    const [billItems, setBillItems] = useState([{ name: '', cost: '' }]);
    const [fuelQuantity, setFuelQuantity] = useState(''); // New State for Fuel
    const [billSending, setBillSending] = useState(false);

    // Feedback Modal State
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackData, setFeedbackData] = useState(null);
    const [myReviews, setMyReviews] = useState([]);

    // OTP Verification State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpInput, setOtpInput] = useState(['', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [otpVerifying, setOtpVerifying] = useState(false);

    // History State
    const [requestHistory, setRequestHistory] = useState([]);
    const [historyView, setHistoryView] = useState('services'); // 'services' or 'requests'
    const [historyLoading, setHistoryLoading] = useState(false);

    // Announcement State
    const [announcements, setAnnouncements] = useState([]);
    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

    // Fetch Announcements
    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/api/admin-features/announcements');
            const filtered = res.data.filter(a => a.target === 'all' || a.target === 'providers');
            setAnnouncements(filtered);
            setUnreadAnnouncements(filtered.length);
        } catch (err) {
            console.error("Failed to fetch announcements", err);
        }
    };

    const fetchProviderHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const res = await api.get(`/api/request/provider/history/${user._id}`);
            setRequestHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [user?._id]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchProviderHistory();
        }
        fetchAnnouncements();
    }, [activeTab, fetchProviderHistory]);

    // Simulation & Navigation State
    const [isSimulating, setIsSimulating] = useState(false);
    const [isNavigationActive, setIsNavigationActive] = useState(false);
    const [simulationData, setSimulationData] = useState({ heading: 0, tilt: 0, zoom: 15 });
    const simulationRef = useRef(null);
    const [simulationSpeed, setSimulationSpeed] = useState(30); // km/h (default speed)
    const speedRef = useRef(30); // Ref to hold latest speed for animation loop
    const joinedRooms = useRef(new Set()); // Track joined rooms to prevent flooding
    const [simPath, setSimPath] = useState(null); // Valid OSRM route points

    // Sync speedRef with state
    useEffect(() => {
        speedRef.current = simulationSpeed;
    }, [simulationSpeed]);

    // DEV TOOL STATE - REMOVED
    // const [showForceMapModal, setShowForceMapModal] = useState(false);
    // const [forceMapCenter, setForceMapCenter] = useState(null);
    // const [forceLocationTarget, setForceLocationTarget] = null);

    const toggleStatus = async () => {
        const newStatus = !isOnline;
        // Optimistic update
        setIsOnline(newStatus);
        try {
            await api.put('/api/auth/provider/status', { userId: user._id, isOnline: newStatus });
            toast.success(newStatus ? "You are now Online" : "You are now Offline");
        } catch (err) {
            console.error('Error toggling status:', err);
            setIsOnline(!newStatus); // Revert
            toast.error("Failed to update status");
        }
    };

    // Socket Connection
    useEffect(() => {
        const SOCKET_URL = API_BASE_URL;
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (socket && user?._id && !joinedRooms.current.has(user._id)) {
            socket.emit('join_room', user._id);
            joinedRooms.current.add(user._id);
            console.log('[Provider Socket] Joined user room:', user._id);
        }

        if (!socket) return;

        const onNewRequest = (request) => {
            console.log("New Request Received:", request);
            setIncomingRequest(request);
        };

        socket.on('new_request', onNewRequest);

        // Listen for payment confirmation to trigger feedback
        const onPaymentConfirmed = (data) => {
            console.log("[Provider] Payment Confirmed:", data);
            // data should contain: requestId, customerId, customerName
            if (data) {
                // EV Support Fallback: If no serviceTypes, check category
                let types = data.serviceTypes || activeJob?.serviceTypes;
                if (!types || types.length === 0) {
                    if (activeJob?.category === 'EV Support') types = ['EV Support'];
                    else if (activeJob?.category === 'Fuel Delivery') types = ['Fuel Delivery'];
                    else types = ['Mechanic Service'];
                }

                setFeedbackData({
                    requestId: data.requestId,
                    reviewerId: user?._id,
                    reviewerType: 'Provider',
                    revieweeId: data.customerId,
                    revieweeType: 'User',
                    revieweeName: data.customerName || 'Customer',
                    serviceTypes: types
                });
                setShowFeedback(true);

                // Clear active job ONLY after modal is definitely open
                setTimeout(() => {
                    setActiveJob(null);
                    fetchProviderJobs(user?._id);
                }, 5000);
            }
        };
        socket.on('payment_confirmed', onPaymentConfirmed);

        const onNewAnnouncement = (announcement) => {
            if (announcement.target === 'all' || announcement.target === 'providers') {
                setAnnouncements(prev => [announcement, ...prev]);
                setUnreadAnnouncements(prev => prev + 1);
            }
        };
        socket.on('new_announcement', onNewAnnouncement);

        return () => {
            socket.off('new_request', onNewRequest);
            socket.off('payment_confirmed', onPaymentConfirmed);
            socket.off('new_announcement', onNewAnnouncement);
        };
    }, [socket, user?._id, activeJob]);

    // Ensure provider joins the active job room (Fix for Chat on Refresh) - DEDUPLICATED
    useEffect(() => {
        const roomId = activeJob?.id || activeJob?._id;
        if (socket && roomId && !joinedRooms.current.has(roomId)) {
            console.log("[Provider Socket] Joining Active Job Room:", roomId);
            socket.emit('join_room', roomId);
            joinedRooms.current.add(roomId);
        }
    }, [socket, activeJob?.id, activeJob?._id]);

    // Provider Location Tracking (Active Job OR Online)
    useEffect(() => {
        if (user?._id) userIdRef.current = user._id;
    }, [user?._id]);

    useEffect(() => {
        let watchId;
        // Only track if active job dictates or if online
        const shouldTrack = (activeJob && ['Accepted', 'Arrived'].includes(activeJob.status)) || isOnline;

        if (shouldTrack && socket && navigator.geolocation) {
            console.log("Starting location tracking listener...");
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    // BLOCK UPDATES IF SIMULATING
                    if (isSimulating) return;

                    const { latitude, longitude } = position.coords;
                    const locationData = { lat: latitude, lng: longitude };

                    // Sync local state: Update LIVE location
                    // NOTE: This causes re-renders. If map performance is still bad, consider removing this
                    // and only using the socket to update a separate map marker component.
                    setUser(prev => ({
                        ...prev,
                        liveLocation: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        }
                    }));

                    // Use Ref for ID to avoid dependency loop
                    const payload = {
                        location: locationData,
                        userId: userIdRef.current
                    };

                    if (activeJob && ['Accepted', 'Arrived'].includes(activeJob.status)) {
                        payload.roomId = activeJob.id || activeJob._id;
                        socket.emit('provider_location_update', payload);
                    } else {
                        socket.emit('update_location', payload);
                    }
                },
                (error) => console.error("Tracking Error:", error),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );

            // Request Screen Wake Lock
            if ('wakeLock' in navigator) {
                navigator.wakeLock.request('screen').catch(err => console.error("Wake Lock Error:", err));
            }
        }
        return () => {
            if (watchId) console.log("Stopping location tracking...");
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [activeJob?.status, activeJob?.id, socket, isOnline, isSimulating]); // REMOVED 'user' from dependency

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'provider') {
            navigate('/dashboard');
            return;
        }

        // Optimistically set user from local storage
        setUser(parsedUser);
        userIdRef.current = parsedUser._id;

        // Fetch fresh data to ensure verification status is current
        const verifyUserStatus = async () => {
            try {
                const res = await api.get(`/api/auth/profile/${parsedUser._id}`);
                const freshUser = res.data;

                if (!freshUser.isVerified) {
                    toast.error("Your verification has been revoked.");
                    localStorage.setItem('user', JSON.stringify(freshUser)); // Update local storage
                    navigate('/verification-pending');
                    return;
                }

                // Update state with fresh data
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
            } catch (err) {
                console.error("Failed to verify user status:", err);
            }
        };

        verifyUserStatus();
    }, [navigate, toast]);

    const fetchDashboardData = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // setUser(parsedUser); // Don't reset to local storage if we have state

            try {
                const [userRes, pricingRes, activeRes, statsRes] = await Promise.all([
                    api.get(`/api/auth/provider/dashboard/${parsedUser._id}`),
                    api.get('/api/admin-features/pricing'),
                    api.get(`/api/request/provider/${parsedUser._id}`),
                    api.get(`/api/request/provider/stats/${parsedUser._id}`)
                ]);

                const { user: updatedUser } = userRes.data;
                const statsData = statsRes.data;

                setIsOnline(updatedUser.isOnline);
                setMyServices(updatedUser.services);

                // Use real-time stats
                setStats({
                    earnings: statsData.earnings,
                    todayEarnings: statsData.todayEarnings, // Added this line
                    jobsCompleted: statsData.jobsCompleted,
                    rating: statsData.rating,
                    totalReviews: statsData.totalReviews
                });

                // Set reviews from the stats endpoint (recent ones)
                setMyReviews(statsData.recentReviews || []);


                // Format active requests from DB
                const formattedRequests = activeRes.data.map(req => ({
                    ...req,
                    id: req._id,
                    type: req.serviceType, // Keep for legacy
                    serviceTypes: req.serviceTypes || [req.serviceType],
                    customer: req.customer, // Keep full object
                    customerName: req.customer?.name || "Unknown",
                    customerPhoto: req.customer?.photoUrl,
                    distance: req.pricing?.distanceMetric ? `${req.pricing.distanceMetric} km` : '0 km',
                    location: {
                        coordinates: req.location?.coordinates || [0, 0], // Keep original structure
                        lat: req.location?.coordinates ? parseFloat(req.location.coordinates[1]) : 0,
                        lng: req.location?.coordinates ? parseFloat(req.location.coordinates[0]) : 0
                    },
                    status: req.status,
                    pricing: req.pricing ? {
                        ...req.pricing,
                        totalEstimate: req.pricing.totalAmount || req.pricing.totalEstimate || 0,
                    } : { totalEstimate: 0, distanceMetric: 0, baseFee: 0, distanceFee: 0 },
                    problemPhotoUrl: req.problemPhoto || req.problemPhotoUrl, // Handle both potential keys
                    vehicle: req.vehicle || { model: 'Unknown', plateNumber: 'N/A', fuelType: 'N/A' }
                }));

                setRequests(formattedRequests);
                const currentJob = formattedRequests.find(r => ['Accepted', 'Arrived'].includes(r.status));
                if (currentJob) setActiveJob(currentJob);

                setAvailableServices(pricingRes.data);
                // reviewsRes was removed, using statsData.recentReviews directly above
                // setMyReviews(reviewsRes.data.reviews || []); <--- Removed this legacy line causing crash

                setUser(updatedUser);
                // Update local storage to keep it fresh
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
                if (err.response && err.response.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        } else {
            navigate('/login');
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleLogout = async () => {
        await auth.signOut();
        localStorage.removeItem('user');
        setUser(null); // Clear component state
        navigate('/login');
    };

    const toggleOnlineStatus = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        try {
            await api.put('/api/auth/provider/status', { userId: user._id, isOnline: newStatus });
            toast.success(newStatus ? "You are now Online" : "You are now Offline");
        } catch (err) {
            setIsOnline(!newStatus); // Revert
            toast.error("Failed to update status");
        }
    };


    // --- SMOOTH ANIMATION LOGIC (Uber-like) ---

    const handleAutoArrive = async () => {
        try {
            await api.put('/api/request/status', { requestId: activeJob._id, status: 'Arrived' });
            // Update local state
            setRequests(prev => prev.map(r => r._id === activeJob._id ? { ...r, status: 'Arrived' } : r));
            setActiveJob(prev => ({ ...prev, status: 'Arrived' }));
            setShowOtpModal(true);
            setIsSimulating(false);
            if (simulationRef.current) cancelAnimationFrame(simulationRef.current);
            toast.success("Arrived at location!");
        } catch (err) {
            console.error("Auto-arrive failed", err);
            toast.error("Failed to update status");
        }
    };

    const startSimulation = async (restartPath = null) => {
        if (!activeJob || !user?.location) {
            toast.warning("No active job or location data.");
            return;
        }

        setIsSimulating(true);
        // "Ghost Driver" Mode: Activates 3D view for demo purposes
        setSimulationData(prev => ({ ...prev, tilt: 45, zoom: 19 }));

        const origin = { lat: user.location.coordinates[1], lng: user.location.coordinates[0] };
        const dest = { lat: activeJob.location.coordinates[1], lng: activeJob.location.coordinates[0] };

        // Zero-Distance Check: If provider is already there, skip simulation
        const distSq = Math.pow(dest.lat - origin.lat, 2) + Math.pow(dest.lng - origin.lng, 2);
        if (distSq < 0.00000001) {
            console.log("Already at location. Auto-arriving.");
            handleAutoArrive();
            return;
        }

        // 1. INSTANTLY Set Location to Origin (Fix "Arrived" initial state bug)
        const startLoc = { type: 'Point', coordinates: [origin.lng, origin.lat] };
        setUser(prev => ({ ...prev, liveLocation: startLoc }));

        let pathPoints = [];

        // Validate restartPath: Must be array and have at least 2 points
        if (restartPath && Array.isArray(restartPath) && restartPath.length > 1) {
            pathPoints = restartPath;
            console.log("Simulating with CACHED path:", pathPoints.length);
        } else {
            try {
                // Use FREE OSRM API (no API key needed!)
                const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full`;
                const res = await fetch(osrmUrl);
                const json = await res.json();

                if (json.code === 'Ok' && json.routes && json.routes[0]) {
                    // Decode polyline into array of [lat, lng] points
                    const decodedPoints = polyline.decode(json.routes[0].geometry);
                    pathPoints = decodedPoints.map(([lat, lng]) => ({ lat, lng }));
                    console.log(`Ghost Driver: Route loaded with ${pathPoints.length} points.`);
                } else {
                    throw new Error("OSRM returned no route");
                }
            } catch (err) {
                console.warn("OSRM failed, using linear fallback:", err);
                // Fallback: Linear interpolation
                const steps = 50;
                for (let i = 0; i <= steps; i++) {
                    const lat = origin.lat + (dest.lat - origin.lat) * (i / steps);
                    const lng = origin.lng + (dest.lng - origin.lng) * (i / steps);
                    pathPoints.push({ lat, lng });
                }
            }
        }

        // Ensure we really have points
        if (!pathPoints || pathPoints.length < 2) {
            console.error("No valid path generated.");
            toast.error("Could not generate simulation path.");
            setIsSimulating(false);
            return;
        }

        setSimPath(pathPoints); // Save path for reset
        runAnimationLoop(pathPoints);
    };

    const runAnimationLoop = (pathPoints) => {
        if (!pathPoints || pathPoints.length < 2) return;

        let currentIndex = 0;
        let progress = 0;
        let lastTime = performance.now();

        // Cancel any existing loop
        if (simulationRef.current) cancelAnimationFrame(simulationRef.current);

        const animate = async (time) => {
            // Check ref existence as "Simulating Check" 
            // since 'isSimulating' state might be stale in closure
            // We rely on stopSimulation setting ref to null to kill this loop.

            const deltaTime = (time - lastTime) / 1000; // Seconds
            lastTime = time;

            const p1 = pathPoints[currentIndex];
            const p2 = pathPoints[currentIndex + 1];


            if (!p2) {
                stopSimulation();
                handleAutoArrive();
                return;
            }

            // Calculate distance
            const dist = Math.sqrt(Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2));
            const distMeters = dist * 111000;

            // Speed from Ref (Real-time updates)
            const currentSpeed = speedRef.current || 60;
            const speedMetersPerSec = (currentSpeed * 1000) / 3600;

            const step = (speedMetersPerSec * deltaTime) / distMeters;

            progress += step || 0.01;

            if (progress >= 1) {
                progress = 0;
                currentIndex++;
                if (currentIndex >= pathPoints.length - 1) {
                    stopSimulation();
                    handleAutoArrive();
                    return;
                }
            }

            // LERP
            const currentLat = p1.lat + (p2.lat - p1.lat) * progress;
            const currentLng = p1.lng + (p2.lng - p1.lng) * progress;

            // Heading
            const dLng = (p2.lng - p1.lng) * Math.PI / 180;
            const lat1 = p1.lat * Math.PI / 180;
            const lat2 = p2.lat * Math.PI / 180;
            const y = Math.sin(dLng) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
            const heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

            const newLocation = { type: 'Point', coordinates: [currentLng, currentLat] };

            setUser(prev => ({ ...prev, liveLocation: newLocation }));
            setSimulationData({ heading: heading, tilt: 45, zoom: 19 });

            if (socket) {
                socket.emit('provider_location_update', {
                    roomId: activeJob._id,
                    userId: user._id,
                    location: { lat: currentLat, lng: currentLng, heading: heading }
                });
            }

            // Continue loop
            if (simulationRef.current) {
                simulationRef.current = requestAnimationFrame(animate);
            }
        };

        simulationRef.current = requestAnimationFrame(animate);
    };

    // Reset Simulation
    const resetSimulation = () => {
        // 1. Kill Loop
        setIsSimulating(false);
        if (simulationRef.current) {
            cancelAnimationFrame(simulationRef.current);
            simulationRef.current = null;
        }

        // 2. Reset Position
        if (user.location && user.location.coordinates) {
            const startLoc = {
                type: 'Point',
                coordinates: [user.location.coordinates[0], user.location.coordinates[1]]
            };
            setUser(prev => ({ ...prev, liveLocation: startLoc }));
        }

        // 3. Reset View
        setSimulationData(prev => ({ ...prev, heading: 0 }));

        // 4. Restart
        setTimeout(() => {
            // Pass the cached path if it exists and looks valid
            const path = (simPath && simPath.length > 1) ? simPath : null;
            startSimulation(path);
        }, 100);
    };

    const stopSimulation = () => {
        setIsSimulating(false);
        setIsNavigationActive(false); // Exit navigation view on stop
        setIsSimulating(false);
        setIsNavigationActive(false); // Exit navigation view on stop
        if (simulationRef.current) cancelAnimationFrame(simulationRef.current);
        setSimulationData({ heading: 0, tilt: 0, zoom: 15 });
    };


    const toggleService = async (serviceName) => {
        try {
            const res = await api.put('/api/auth/provider/service', { userId: user._id, serviceName });
            setUser(prev => ({ ...prev, services: res.data.user.services }));
            toast.success("Service Added");
        } catch (err) {
            console.error("Service Toggle Error:", err);
            toast.error("Failed to update service");
        }
    };

    const addService = async (e) => {
        if (e) e.preventDefault();
        if (!newService.trim()) return;
        try {
            const res = await api.post('/api/auth/provider/service', { userId: user._id, serviceName: newService });
            setUser(prev => ({ ...prev, services: res.data.user.services }));
            setNewService('');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add service");
        }
    };

    const handleRemoveService = async (serviceName) => {
        if (!window.confirm(`Stop providing ${serviceName}?`)) return;
        try {
            const res = await api.delete('/api/auth/provider/service', { data: { userId: user._id, serviceName } });
            setUser(prev => ({ ...prev, services: res.data.user.services }));
            toast.success("Service Removed");
        } catch (err) {
            toast.error("Failed to delete service");
        }
    };

    const handleRequestAction = async (requestId, status, confirm = true) => {
        if (confirm) {
            try {
                const res = await api.put('/api/request/status', { requestId, status });
                // update local state
                setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status } : r));

                if (status === 'Accepted' || status === 'Arrived') {
                    setActiveJob(requests.find(r => r._id === requestId));
                } else {
                    setActiveJob(null);
                }
            } catch (err) {
                toast.error("Action failed");
            }
        }
    };



    const handleAcceptRequest = async () => {
        if (!incomingRequest) return;
        try {
            const res = await api.put('/api/request/accept', {
                requestId: incomingRequest._id,
                providerId: user._id,
                estimatedArrival: 15, // minutes
                assignedName: assignmentDetails.name || user.name,
                assignedPhone: assignmentDetails.phone || user.phone
            });
            console.log("Request Accepted:", res.data);
            setIncomingRequest(null);
            // Refresh dashboard to show active job
            // Ideally we should just set activeJob(res.data) but fetching fresh data is safer
            // window.location.reload(); // Too harsh
            // We'll rely on a fetch or direct state update
            setActiveJob(res.data);

            // Join the specific request room for chat/tracking
            if (socket) {
                socket.emit('join_room', res.data._id);
            }

        } catch (err) {
            console.error("Failed to accept request", err);
            toast.error("Failed to accept request. It might have been cancelled.");
        }
    };

    const handleCompleteJob = async (e) => {
        e.preventDefault();
        try {
            await api.put('/api/request/complete', {
                requestId: activeJob._id
            });
            setRequests(prev => prev.map(r => r._id === activeJob._id ? { ...r, status: 'Completed', completedAt: new Date() } : r));
            setShowCompleteModal(false);
            setActiveJob(null);
            setMaterialCost('');
            toast.success("Job Completed Successfully!");
            // Refresh stats
            window.location.reload();
        } catch (err) {
            console.error("Failed to complete job", err);
        }
    };

    const handleRejectRequest = async () => {
        if (!incomingRequest) return;
        try {
            await api.put('/api/request/cancel', {
                requestId: incomingRequest._id,
                reason: 'Provider Cancelled'
            });
            setRequests(prev => prev.map(r => r._id === incomingRequest._id ? { ...r, status: 'Cancelled' } : r));
            setIncomingRequest(null);
        } catch (err) {
            console.error("Failed to reject request", err);
            setIncomingRequest(null);
        }
    };

    const handleCancelJob = async () => {
        if (!activeJob) return;
        const reason = prompt("Enter cancellation reason:");
        if (!reason && reason !== "") return; // User pressed cancel on prompt

        try {
            const res = await api.put('/api/request/cancel', {
                requestId: activeJob._id || activeJob.id,
                reason: 'Provider Cancelled'
            });
            toast.error("Job Cancelled");
            setActiveJob(null);
            if (user?._id) fetchProviderJobs(user._id);
            // Leave room
            if (socket && activeJob) {
                const roomId = activeJob._id || activeJob.id;
                socket.emit('leave_room', roomId);
                if (joinedRooms.current) joinedRooms.current.delete(roomId);
            }
        } catch (err) {
            console.error("Failed to cancel job", err);
            toast.error("Failed to cancel job: " + (err.response?.data?.message || err.message));
        }
    };

    // Bill Item Management
    const addBillItem = () => {
        setBillItems([...billItems, { name: '', cost: '' }]);
    };

    const updateBillItem = (index, field, value) => {
        const updated = [...billItems];
        updated[index][field] = value;
        setBillItems(updated);
    };

    const removeBillItem = (index) => {
        if (billItems.length > 1) {
            setBillItems(billItems.filter((_, i) => i !== index));
        }
    };

    const getBillTotal = () => {
        if (activeJob?.category === 'Fuel Delivery') {
            // Use the actual rate from database, not hardcoded values
            const rate = activeJob.fuelDetails?.rate || ((activeJob.fuelDetails?.fuelType === 'Diesel') ? 92 : 100);
            return (Number(fuelQuantity) || 0) * rate;
        }
        return billItems.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    };

    // OTP Verification Functions
    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Only allow single digit
        const newOtp = [...otpInput];
        newOtp[index] = value;
        setOtpInput(newOtp);
        setOtpError('');

        // Auto-focus next input
        if (value && index < 3) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const verifyServiceOtp = async () => {
        const otpCode = otpInput.join('');
        console.log("--- OTP VERIFICATION START ---");
        console.log("Active Job State:", activeJob);
        console.log("OTP Input:", otpInput);
        console.log("Joined OTP Code:", otpCode);

        if (otpCode.length !== 4) {
            console.warn("Validation Failed: OTP length is not 4");
            setOtpError('Please enter complete 4-digit OTP');
            return;
        }

        if (!activeJob || !activeJob._id) {
            console.error("CRITICAL ERROR: activeJob is missing or has no _id", activeJob);
            toast.error("System Error: No active job found");
            return;
        }

        setOtpVerifying(true);
        setOtpError('');

        const payload = { requestId: activeJob._id, otp: otpCode };
        console.log("Preparing API Call with payload:", payload);

        try {
            console.log("Sending Request...");
            const res = await api.post('/api/request/verify-otp', payload);
            console.log("API Response Success:", res.data);

            if (res.data.success) {
                setShowOtpModal(false);
                setOtpInput(['', '', '', '']);
                setActiveJob(prev => ({ ...prev, otpVerified: true }));
                toast.success('OTP Verified! You can now generate the bill.');
            } else {
                console.warn("API returned success: false", res.data);
            }
        } catch (err) {
            console.error("--- OTP VERIFICATION ERROR ---");
            console.error("Full Error Object:", err);

            setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
            setOtpInput(['', '', '', '']);
            document.getElementById('otp-0')?.focus();
        } finally {
            console.log("--- OTP VERIFICATION END ---");
            setOtpVerifying(false);
        }
    };

    const handleSendBill = async () => {
        let payload = { requestId: activeJob._id };

        if (activeJob?.category === 'Fuel Delivery') {
            if (!fuelQuantity || Number(fuelQuantity) <= 0) {
                toast.warning("Please enter a valid fuel quantity.");
                return;
            }
            payload.fuelQuantity = Number(fuelQuantity);
        } else {
            const validItems = billItems.filter(item => item.name.trim() && Number(item.cost) > 0);
            if (validItems.length === 0) {
                toast.warning("Please add at least one valid item with name and cost.");
                return;
            }
            payload.billItems = validItems.map(item => ({ name: item.name, cost: Number(item.cost) }));
        }

        setBillSending(true);
        try {
            await api.post('/api/request/send-bill', payload);
            toast.success("Bill Sent to Customer");
            setShowBillModal(false); // Close Modal immediately
            setBillItems([{ name: '', cost: '' }]);
            setFuelQuantity('');
            toast.success("Bill sent to customer! Waiting for payment.");
        } catch (err) {
            console.error("Failed to send bill", err);
            toast.error("Failed to send bill. Please try again.");
        } finally {
            setBillSending(false);
        }
    };

    const handleRequestUpdate = async (e) => {
        e.preventDefault();
        // Submit to backend
        try {
            const res = await api.put('/api/auth/request-profile-update', {
                userId: user._id,
                ...updateData
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setShowSettingsModal(false);
            toast.info("Update requested! Waiting for admin approval.");
        } catch (err) {
            toast.error("Failed to request update");
        }
    };

    if (!user) return null;

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'active_job', label: 'Active Job', icon: PlayCircle }, // New Dedicated Tab
        { id: 'services', label: 'My Services', icon: Wrench },
        { id: 'reviews', label: 'My Reviews', icon: Star },
        { id: 'history', label: 'Service History', icon: History },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden relative selection:bg-blue-500/30">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 w-80 !bg-white dark:!bg-card/50 !backdrop-blur-none dark:!backdrop-blur-2xl border-r border-border z-40 transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${showSettingsModal ? 'lg:hidden' : ''} ${selectedRequest ? 'hidden' : 'flex'} flex-col`}>
                <div className="p-8 pb-4 flex-1 overflow-y-auto scrollbar-hide bg-white dark:bg-transparent">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-500/80 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                            <Wrench className="w-6 h-6 fill-current" />
                        </div>
                        <div className="text-2xl font-black tracking-tighter">
                            Fuel<span className="text-blue-500">N</span>Fix <span className="text-xs align-top bg-blue-500/10 text-blue-500 px-1 py-0.5 rounded ml-1">PRO</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className={`p-4 rounded-2xl border transition-all ${isOnline ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                                    {isOnline ? 'You are Online' : 'You are Offline'}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            </div>
                            <button
                                onClick={toggleStatus}
                                className={`w-full py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isOnline
                                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                                    : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                                    }`}
                            >
                                <Power className="w-4 h-4" /> {isOnline ? 'Go Offline' : 'Go Online'}
                            </button>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === item.id
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'hover:bg-accent/50 text-foreground/80'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 opacity-90" /> {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-border/50 bg-white dark:bg-background/20">
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-card dark:to-background border border-border shadow-sm">
                        {user.photoUrl ? (
                            <img src={user.photoUrl} alt="User" className="w-11 h-11 rounded-xl object-cover border-2 border-blue-500/10" />
                        ) : (
                            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 text-lg">
                                {user?.name ? user.name.charAt(0) : '?'}
                            </div>
                        )}
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-bold truncate text-foreground">{user?.name || 'Provider'}</p>
                            <p className="text-xs text-muted-foreground capitalize font-medium">{user?.role || 'Provider'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 text-sm text-destructive font-bold hover:bg-destructive/10 p-3.5 rounded-2xl transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 w-full">
                <div className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    {/* Header */}
                    <header className="flex flex-col-reverse gap-4 lg:flex-row justify-between items-start lg:items-center mb-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-card border border-border text-foreground">
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">
                                    Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-500">{user?.name ? user.name.split(' ')[0] : 'Provider'}</span> 👋
                                </h1>
                                <p className="text-muted-foreground font-medium text-lg">Ready to save the day?</p>
                            </div>
                        </div>
                        <div className="self-end lg:self-auto flex items-center gap-3">
                            <ModeToggle />
                            <div
                                onClick={() => { setShowAnnouncements(true); setUnreadAnnouncements(0); }}
                                className="p-2.5 rounded-xl bg-card border border-border relative cursor-pointer hover:bg-accent transition-colors"
                            >
                                <Bell className="w-5 h-5 text-muted-foreground" />
                                {unreadAnnouncements > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">

                            {/* Alert Banner for Active Job */}
                            {(activeJob || requests.filter(r => r.status === 'Pending').length > 0) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-between mb-8"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                                            <Activity className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Action Required</h3>
                                            <p className="text-sm text-muted-foreground">You have {activeJob ? 'an active job' : 'incoming requests'}. Go to Mission Control.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('active_job')} // Switch to Active Job Tab
                                        className="px-6 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                                    >
                                        Go to Active Job
                                    </button>
                                </motion.div>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Earnings', value: `₹${Math.floor(stats.earnings)}`, icon: IndianRupee, color: 'text-green-500', bg: 'bg-green-500/10' },
                                    { label: 'Today\'s Earnings', value: `₹${Math.floor(stats.todayEarnings)}`, icon: TrendingUpIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { label: 'Jobs Completed', value: stats.jobsCompleted, icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                    { label: 'Rating', value: stats.rating, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden shadow-lg shadow-blue-500/5"
                                    >
                                        <div className="absolute top-0 right-0 p-24 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                                    <stat.icon className="w-6 h-6" />
                                                </div>
                                                {stat.label === 'Rating' && <span className="text-xs font-bold bg-accent px-2 py-1 rounded-lg">Top Rated</span>}
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Active Map */}
                                <div className="lg:col-span-3 h-[400px] rounded-[2.5rem] overflow-hidden border border-border relative group shadow-2xl">
                                    <MapComponent
                                        center={user?.location?.coordinates ? { lat: user.location.coordinates[1], lng: user.location.coordinates[0] } : undefined}
                                        heading={isNavigationActive ? simulationData.heading : 0}
                                        tilt={isNavigationActive ? simulationData.tilt : 0}
                                        zoom={isNavigationActive ? simulationData.zoom : 13}
                                    >
                                        {user?.location?.coordinates && (
                                            <Marker
                                                position={{ lat: user.location.coordinates[1], lng: user.location.coordinates[0] }}
                                                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
                                            />
                                        )}
                                        {/* Show Request Markers */}
                                        {requests.filter(r => r.status === 'Pending').map(r => (
                                            <Marker
                                                key={r.id}
                                                position={r.location}
                                                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
                                            />
                                        ))}
                                    </MapComponent>
                                    <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-4 py-2 rounded-full border border-border text-sm font-bold shadow-lg flex items-center gap-2 relative z-50">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        Live Status
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                    }

                    {/* NEW ACTIVE JOB TAB */}
                    {activeTab === 'active_job' && (
                        <div className="max-w-6xl mx-auto h-full flex flex-col p-4 md:p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-4xl font-black text-blue-500 drop-shadow-sm flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
                                            <PlayCircle className="w-8 h-8 text-blue-500" />
                                        </div>
                                        Mission Control
                                    </h2>
                                    <p className="text-muted-foreground font-medium mt-2 ml-1">Manage your active assignments and incoming requests.</p>
                                </div>
                                <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-card/50 border border-border/50 rounded-full backdrop-blur-md shadow-sm">
                                    <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="font-bold text-sm tracking-wide">{user.isOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</span>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 bg-gradient-to-b from-card/40 to-background/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-1 shadow-2xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none"></div>
                                <div className="absolute top-0 right-0 p-48 bg-blue-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none transition-all duration-1000 group-hover:bg-blue-500/20"></div>
                                <div className="absolute bottom-0 left-0 p-48 bg-purple-500/10 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none transition-all duration-1000 group-hover:bg-purple-500/20"></div>

                                <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 relative z-10">
                                    {activeJob ? (
                                        <div className="h-full flex flex-col max-w-3xl mx-auto space-y-6">
                                            {/* Mission Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/50">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2.5 py-1 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md">Active</span>
                                                        <span className="text-xs font-medium text-muted-foreground">ID: {activeJob._id?.slice(-6)}</span>
                                                    </div>
                                                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">{activeJob.serviceTypes?.join(' + ') || activeJob.type}</h3>
                                                </div>
                                                <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Est. Earnings</p>
                                                        <p className="text-xl font-bold text-blue-500">
                                                            ₹{(activeJob.pricing?.baseFee || 0) + (activeJob.pricing?.distanceFee || 0)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer & Vehicle Info */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Customer */}
                                                <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
                                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center overflow-hidden shrink-0">
                                                        {activeJob.customer?.photoUrl ? (
                                                            <img src={activeJob.customer.photoUrl} className="w-full h-full object-cover" alt="Customer" />
                                                        ) : (
                                                            <User className="w-6 h-6 text-blue-500" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer</p>
                                                        <p className="font-semibold text-foreground truncate">{activeJob.customer?.name || 'Unknown'}</p>
                                                        <p className="text-sm text-muted-foreground font-mono">{activeJob.customer?.phone || '—'}</p>
                                                    </div>
                                                </div>

                                                {/* Vehicle or Fuel Details */}
                                                {activeJob.category === 'Fuel Delivery' ? (
                                                    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
                                                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                                            <Fuel className="w-6 h-6 text-amber-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fuel Details</p>
                                                            <p className="font-semibold text-foreground">₹{activeJob.fuelDetails?.rate}/L</p>
                                                            <p className="text-sm text-muted-foreground">+ ₹{Math.ceil(activeJob.pricing?.distanceFee || 0)} delivery</p>
                                                        </div>
                                                    </div>
                                                ) : activeJob.vehicle && (
                                                    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
                                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                            <Car className="w-6 h-6 text-blue-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle</p>
                                                            <p className="font-semibold text-foreground truncate">{activeJob.vehicle.model}</p>
                                                            <p className="text-sm text-muted-foreground font-mono">{activeJob.vehicle.plateNumber}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <a
                                                    href={`tel:${activeJob.customer?.phone}`}
                                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-xl transition-all group shadow-md"
                                                >
                                                    <Phone className="w-5 h-5 fill-current" />
                                                    <span className="text-xs font-bold">Call</span>
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        if (activeJob?.location?.coordinates) {
                                                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeJob.location.coordinates[1]},${activeJob.location.coordinates[0]}&travelmode=driving`, '_blank');
                                                        }
                                                    }}
                                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl transition-all group shadow-md"
                                                >
                                                    <Navigation className="w-5 h-5 fill-current" />
                                                    <span className="text-xs font-bold">Navigate</span>
                                                </button>
                                                <button
                                                    onClick={handleCancelJob}
                                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-xl transition-all group shadow-md"
                                                >
                                                    <XCircle className="w-5 h-5 fill-current" />
                                                    <span className="text-xs font-bold">Cancel</span>
                                                </button>
                                            </div>

                                            {/* Simulation Panel */}
                                            <div className="p-5 bg-card border border-border rounded-xl">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-purple-500" />
                                                        <span className="text-sm font-semibold">Trip Simulation</span>
                                                    </div>
                                                    {isSimulating && (
                                                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase rounded-md animate-pulse">Running</span>
                                                    )}
                                                </div>

                                                {!isSimulating ? (
                                                    <button
                                                        onClick={startSimulation}
                                                        className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <PlayCircle className="w-4 h-4" /> Start Simulation
                                                    </button>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
                                                                <span>Speed</span>
                                                                <span className="text-purple-500 font-semibold">{simulationSpeed} km/h</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="10"
                                                                max="500"
                                                                step="10"
                                                                value={simulationSpeed}
                                                                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                                                                className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-purple-500"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <button onClick={resetSimulation} className="py-2.5 bg-secondary hover:bg-blue-500 hover:text-white text-foreground font-medium rounded-lg text-sm transition-colors">
                                                                Reset
                                                            </button>
                                                            <button onClick={stopSimulation} className="py-2.5 bg-secondary hover:bg-red-500 hover:text-white text-foreground font-medium rounded-lg text-sm transition-colors">
                                                                Stop
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>



                                            {/* Create Bill Button - Only show after OTP verified */}
                                            {activeJob.otpVerified && (
                                                <button
                                                    onClick={() => setShowBillModal(true)}
                                                    className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-green-500/20"
                                                >
                                                    <CheckCircle className="w-6 h-6" />
                                                    Create Bill & Complete
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        requests.filter(r => r.status === 'Pending').length > 0 ? (
                                            <div className="flex-1 flex flex-col gap-6 max-w-3xl mx-auto pb-20">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                                    <div className="flex items-center gap-4">
                                                        <h3 className="font-black text-xl">Incoming Requests</h3>
                                                        <span className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20 animate-pulse">
                                                            {requests.filter(r => r.status === 'Pending').length} Pending
                                                        </span>
                                                    </div>
                                                    {/* Category Filter */}
                                                    <div className="flex bg-card/50 p-1 rounded-xl border border-border/50 self-start">
                                                        {['All', 'Mechanic', 'Fuel Delivery'].map(filter => (
                                                            <button
                                                                key={filter}
                                                                onClick={() => setRequestFilter(filter)}
                                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${requestFilter === filter ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                                            >
                                                                {filter === 'Fuel Delivery' ? 'Fuel' : filter}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {requests
                                                    .filter(r => r.status === 'Pending')
                                                    .filter(r => requestFilter === 'All' || r.category === requestFilter)
                                                    .map(req => (
                                                        <motion.div
                                                            key={req.id}
                                                            layoutId={`req-card-${req.id}`}
                                                            onClick={() => setSelectedRequest(req)}
                                                            className="bg-card/80 backdrop-blur-xl border border-blue-500/20 rounded-[2.5rem] p-1 shadow-lg cursor-pointer hover:border-blue-500/50 transition-all group hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
                                                        >
                                                            <div className="bg-background/40 rounded-[2.2rem] p-6 relative overflow-hidden">
                                                                {/* Blinking Indicator */}
                                                                <div className="absolute top-6 right-6 flex items-center gap-2">
                                                                    <span className="relative flex h-3 w-3">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-6">
                                                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-pink-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                                                        {req.customerPhoto ? <img src={req.customerPhoto} className="w-full h-full object-cover rounded-3xl" /> : <User className="w-10 h-10" />}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            {req.serviceTypes.map(s => (
                                                                                <span key={s} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-wider rounded-lg">
                                                                                    {s}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                        <h3 className="font-black text-2xl text-foreground leading-tight mb-1 group-hover:text-blue-500 transition-colors">{req.customerName}</h3>

                                                                        {req.category === 'Fuel Delivery' ? (
                                                                            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                                                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                                                <span className="text-foreground">Delivery: ₹{Math.ceil(req.pricing?.distanceFee || 0)}</span>
                                                                                <span className="w-1 h-1 bg-border rounded-full"></span>
                                                                                <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-600 rounded border border-yellow-500/20">
                                                                                    + Fuel @ ₹{req.fuelDetails?.rate}/L
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                                                                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-blue-500" /> {req.distance}</span>
                                                                                <span className="w-1 h-1 bg-border rounded-full"></span>
                                                                                <span>{req.vehicle?.model || 'Vehicle Unknown'}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                                        <ChevronRight className="w-6 h-6" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-extreme text-center py-20 opacity-50">
                                                <div className="w-32 h-32 bg-secondary/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                                    <Clock className="w-12 h-12 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-2xl font-black text-muted-foreground">All Clear</h3>
                                                <p className="font-medium text-muted-foreground/70 max-w-xs mx-auto mt-2">No active jobs or incoming requests at the moment. Stay online to receive new missions.</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REQUEST DETAIL MODAL */}
                    <AnimatePresence>
                        {selectedRequest && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                                <motion.div
                                    layoutId={`req-card-${selectedRequest.id}`}
                                    className="bg-card w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[3rem] border border-border shadow-2xl overflow-hidden relative"
                                >
                                    <button
                                        onClick={() => setSelectedRequest(null)}
                                        className="absolute top-6 right-6 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>

                                    <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                                        {/* Map Header */}
                                        <div className="h-64 relative w-full">
                                            <MapComponent center={selectedRequest.location} zoom={15}>
                                                <Marker
                                                    position={selectedRequest.location}
                                                    animation={window.google?.maps?.Animation?.BOUNCE}
                                                    icon={{
                                                        path: window.google?.maps?.SymbolPath?.CIRCLE,
                                                        scale: 10,
                                                        fillColor: "#EF4444",
                                                        fillOpacity: 1,
                                                        strokeColor: "white",
                                                        strokeWeight: 3,
                                                    }}
                                                />
                                            </MapComponent>
                                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                                        </div>

                                        <div className="px-8 pb-8 -mt-12 relative z-10">
                                            <div className="flex items-end justify-between mb-6">
                                                <div className="flex items-end gap-4">
                                                    <div className="w-24 h-24 rounded-3xl bg-card p-1 shadow-2xl">
                                                        <div className="w-full h-full rounded-[1.2rem] bg-gradient-to-br from-blue-500/20 to-blue-500/20 flex items-center justify-center text-blue-500 font-black text-4xl overflow-hidden">
                                                            {selectedRequest.customerPhoto ? <img src={selectedRequest.customerPhoto} className="w-full h-full object-cover" /> : selectedRequest.customerName?.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <h2 className="text-3xl font-black tracking-tighter">{selectedRequest.customerName}</h2>
                                                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                                            <MapPin className="w-4 h-4 text-blue-500" /> {selectedRequest.distance} away
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Requested Services</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedRequest.serviceTypes.map(s => (
                                                            <span key={s} className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-sm font-bold flex items-center gap-2">
                                                                <Wrench className="w-4 h-4" /> {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Vehicle Details</h3>
                                                    <div className="bg-accent/50 p-4 rounded-2xl flex items-center gap-4">
                                                        <Car className="w-8 h-8 text-foreground/50" />
                                                        <div>
                                                            <p className="font-bold text-lg">{selectedRequest.vehicle?.model || 'Model Not Specified'}</p>
                                                            <p className="text-xs font-mono text-muted-foreground">
                                                                {selectedRequest.vehicle?.plateNumber || 'No Plate'} • {selectedRequest.vehicle?.fuelType || 'No Fuel Info'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedRequest.problemPhotoUrl && (
                                                <div className="mb-8">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2 mb-4">Problem Photo</h3>
                                                    <div className="rounded-3xl overflow-hidden border border-border shadow-lg bg-black">
                                                        <img src={selectedRequest.problemPhotoUrl} className="w-full h-auto max-h-[400px] object-contain mx-auto" alt="Problem" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-accent/30 p-6 rounded-3xl border border-border/50 flex justify-between items-center mb-8">
                                                {selectedRequest.category === 'Fuel Delivery' ? (
                                                    <>
                                                        <div>
                                                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Delivery Fee</p>
                                                            <p className="text-3xl font-black text-foreground">
                                                                ₹{Math.ceil(selectedRequest.pricing?.distanceFee || 0)} <span className="text-lg text-muted-foreground font-bold">+ Fuel Cost</span>
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 text-[10px] font-black uppercase rounded-md border border-yellow-500/20">
                                                                    Rate: ₹{selectedRequest.fuelDetails?.rate || 'N/A'}/L
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Trip Details</p>
                                                            <p className="font-medium text-sm">{selectedRequest.pricing?.distanceMetric || 0} km Trip</p>
                                                            <p className="text-xs text-muted-foreground">@ ₹{selectedRequest.pricing?.pricePerKm}/km</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Estimated Earnings</p>
                                                            <p className="text-3xl font-black text-foreground">
                                                                ₹{typeof selectedRequest.pricing?.totalEstimate === 'number' ? Math.ceil(selectedRequest.pricing.totalEstimate) : '0'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Base + Distance</p>
                                                            <p className="font-medium text-sm">Includes {selectedRequest.pricing?.distanceMetric || 0} km travel</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Assignment Details */}
                                            <div className="bg-secondary/30 rounded-2xl p-4 space-y-3 mb-6">
                                                <p className="text-xs font-bold uppercase text-muted-foreground">Assign Technician / Driver</p>
                                                <input
                                                    type="text"
                                                    placeholder="Name (Optional - Defaults to You)"
                                                    className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm"
                                                    value={assignmentDetails.name}
                                                    onChange={(e) => setAssignmentDetails({ ...assignmentDetails, name: e.target.value })}
                                                />
                                                <PhoneInput
                                                    value={assignmentDetails.phone}
                                                    onChange={(val) => setAssignmentDetails({ ...assignmentDetails, phone: val })}
                                                    placeholder="Phone (Optional - Defaults to You)"
                                                />
                                            </div>

                                        </div>
                                    </div>

                                    {/* Fixed Footer for Actions */}
                                    <div className="p-6 border-t border-border/50 bg-background/95 backdrop-blur-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => { handleRequestAction(selectedRequest.id, 'Cancelled'); setSelectedRequest(null); }} className="py-4 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-black rounded-2xl transition-all text-lg">
                                                Decline
                                            </button>
                                            <button onClick={async () => {
                                                try {
                                                    const res = await api.put('/api/request/accept', {
                                                        requestId: selectedRequest.id,
                                                        assignedName: assignmentDetails.name || user.name,
                                                        assignedPhone: assignmentDetails.phone || user.phone
                                                    });
                                                    // Update local state
                                                    const updatedRequests = requests.map(r => r.id === selectedRequest.id ? { ...r, status: 'Accepted' } : r);
                                                    setRequests(updatedRequests);
                                                    setActiveJob(res.data);
                                                    setSelectedRequest(null);
                                                    // Join room
                                                    if (socket) socket.emit('join_room', res.data._id);
                                                } catch (err) {
                                                    toast.error("Failed to accept request");
                                                }
                                            }} className="py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all text-lg">
                                                Accept Job
                                            </button>
                                        </div>
                                    </div>

                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>


                    {/* Completion Modal */}
                    <AnimatePresence>
                        {showCompleteModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gradient-to-br from-card/95 to-background border border-border/50 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <h2 className="text-2xl font-black mb-1">Compute Bill</h2>
                                        <p className="text-muted-foreground mb-6">Enter additional costs to generate receipt.</p>

                                        <form onSubmit={handleCompleteJob}>
                                            <div className="space-y-4 mb-8">
                                                <div className="flex justify-between items-center text-sm p-3 bg-accent/50 rounded-xl">
                                                    <span>Service Base Fee</span>
                                                    <span className="font-bold">₹{activeJob?.pricing.baseFee}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm p-3 bg-accent/50 rounded-xl">
                                                    <span>Distance Fee ({activeJob?.pricing.distanceMetric} km)</span>
                                                    <span className="font-bold">₹{activeJob?.pricing.distanceFee}</span>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Material / Fuel Cost (₹)</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        min="0"
                                                        value={materialCost}
                                                        onChange={(e) => setMaterialCost(e.target.value)}
                                                        className="w-full h-14 rounded-xl bg-background border border-border px-4 font-bold text-xl outline-none focus:border-blue-500 mt-2"
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-xl text-blue-500 font-black pt-4 border-t border-border">
                                                    <span>Total Bill</span>
                                                    <span>₹{(activeJob?.pricing.baseFee || 0) + (activeJob?.pricing.distanceFee || 0) + (Number(materialCost) || 0)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <button type="button" onClick={() => setShowCompleteModal(false)} className="flex-1 py-4 font-bold text-muted-foreground hover:bg-accent rounded-2xl">Cancel</button>
                                                <button type="submit" className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-transform">
                                                    Generate Bill
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* OTP Verification Modal */}
                    <AnimatePresence>
                        {showOtpModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-gradient-to-br from-card/95 to-background border border-border/50 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                                <Shield className="w-8 h-8 text-blue-500" />
                                            </div>
                                            <h2 className="text-2xl font-black mb-1">Verify Service OTP</h2>
                                            <p className="text-muted-foreground">Ask the customer for the 4-digit OTP shown on their app</p>
                                        </div>

                                        {/* OTP Input Boxes */}
                                        <div className="flex justify-center gap-3 mb-6">
                                            {[0, 1, 2, 3].map((index) => (
                                                <input
                                                    key={index}
                                                    id={`otp-${index}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={otpInput[index]}
                                                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                    className={`w-16 h-20 text-center text-3xl font-black rounded-2xl bg-background border-2 ${otpError ? 'border-red-500 animate-shake' : 'border-border focus:border-blue-500'} outline-none transition-all`}
                                                />
                                            ))}
                                        </div>

                                        {/* Error Message */}
                                        {otpError && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-center text-red-500 text-sm font-bold mb-4"
                                            >
                                                {otpError}
                                            </motion.p>
                                        )}

                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => { setShowOtpModal(false); setOtpInput(['', '', '', '']); setOtpError(''); }}
                                                className="flex-1 py-4 font-bold text-muted-foreground hover:bg-accent rounded-2xl"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={verifyServiceOtp}
                                                disabled={otpVerifying}
                                                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Bill Creation Modal */}
                    <AnimatePresence>
                        {showBillModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gradient-to-br from-card/95 to-background border border-border/50 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
                                    <div className="absolute top-0 right-0 p-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <h2 className="text-2xl font-black mb-1">Create Bill</h2>
                                        <p className="text-muted-foreground mb-6">Add all materials/services to the bill.</p>

                                        <div className="mb-6">
                                            {activeJob?.category === 'Fuel Delivery' ? (
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                                        <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                                                            <Fuel className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Fuel Type</p>
                                                            <p className="text-xl font-black">{activeJob.fuelDetails?.fuelType || 'Petrol'}</p>
                                                        </div>
                                                        <div className="ml-auto text-right">
                                                            <p className="text-xs font-bold text-muted-foreground uppercase">Rate</p>
                                                            <p className="font-bold">₹{activeJob.fuelDetails?.rate || (activeJob.fuelDetails?.fuelType === 'Petrol' ? 100 : 92)}/L</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Quantity (Litres)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="0.0"
                                                            step="0.01"
                                                            value={fuelQuantity}
                                                            onChange={(e) => setFuelQuantity(e.target.value)}
                                                            className="w-full h-16 text-3xl font-black px-6 rounded-2xl bg-background border border-border focus:border-blue-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {billItems.map((item, index) => (
                                                        <div key={index} className="flex gap-3 items-center">
                                                            <input
                                                                type="text"
                                                                placeholder="Item name"
                                                                value={item.name}
                                                                onChange={(e) => updateBillItem(index, 'name', e.target.value)}
                                                                className="flex-1 h-12 rounded-xl bg-background border border-border px-4 outline-none focus:border-blue-500"
                                                            />
                                                            <input
                                                                type="number"
                                                                placeholder="₹ Cost"
                                                                value={item.cost}
                                                                onChange={(e) => updateBillItem(index, 'cost', e.target.value)}
                                                                className="w-28 h-12 rounded-xl bg-background border border-border px-4 font-bold outline-none focus:border-blue-500"
                                                            />
                                                            {billItems.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeBillItem(index)}
                                                                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center"
                                                                >
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={addBillItem}
                                                        className="w-full py-3 mt-2 border-2 border-dashed border-border hover:border-blue-500 text-muted-foreground hover:text-blue-500 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                        Add Another Item
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-secondary/30 rounded-2xl p-4 space-y-2 mb-6 border border-border/50">
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span>Base Fee</span>
                                                <span className="font-bold">₹{activeJob?.pricing?.baseFee || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span>Delivery/Distance Fee</span>
                                                <span className="font-bold">₹{activeJob?.pricing?.distanceFee || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span>{activeJob?.category === 'Fuel Delivery' ? 'Fuel Cost' : 'Materials/Service Cost'}</span>
                                                <span className="font-bold">₹{Number(getBillTotal()) || 0}</span>
                                            </div>
                                            <div className="border-t border-border/50 pt-2 flex justify-between items-center text-xl text-blue-500 font-black">
                                                <span>Grand Total</span>
                                                <span>₹{
                                                    (activeJob?.pricing?.baseFee || 0) +
                                                    (activeJob?.pricing?.distanceFee || 0) +
                                                    (Number(getBillTotal()) || 0)
                                                }</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => { setShowBillModal(false); setBillItems([{ name: '', cost: '' }]); }}
                                                className="flex-1 py-4 font-bold text-muted-foreground hover:bg-accent rounded-2xl"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSendBill}
                                                disabled={billSending}
                                                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/25 hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {billSending ? 'Sending...' : 'Send Bill'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {
                        activeTab === 'services' && (
                            <div className="max-w-4xl">
                                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
                                    <h2 className="text-2xl font-black">Manage Services</h2>
                                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                        {/* Service Category Filter */}
                                        <div className="flex bg-card/50 p-1 rounded-xl border border-border/50">
                                            {['All', 'Mechanic', 'Fuel Delivery'].map(filter => (
                                                <button
                                                    key={filter}
                                                    onClick={() => setServiceFilter(filter)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${serviceFilter === filter ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {filter === 'Fuel Delivery' ? 'Fuel' : filter}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative z-50 min-w-[240px]">
                                            <div
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="flex items-center justify-between w-full px-4 py-3 bg-card border border-border rounded-xl cursor-pointer hover:border-blue-500/50 transition-all shadow-sm group"
                                            >
                                                <span className={`${!newService ? 'text-muted-foreground' : 'font-bold text-foreground'}`}>
                                                    {newService || "Select Service"}
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 group-hover:text-blue-500 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                            </div>

                                            <AnimatePresence>
                                                {isDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                        className="absolute top-full mt-2 left-0 w-full bg-card/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                                                    >
                                                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                            {availableServices
                                                                .filter(service => !myServices.find(s => s.name === service.serviceName))
                                                                .filter(service => serviceFilter === 'All' || service.category === serviceFilter)
                                                                .map((service, idx) => (
                                                                    <motion.div
                                                                        key={service.serviceName}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: idx * 0.05 }}
                                                                        onClick={() => { setNewService(service.serviceName); setIsDropdownOpen(false); }}
                                                                        className="px-4 py-3 hover:bg-blue-500/10 hover:text-blue-500 cursor-pointer transition-colors flex items-center justify-between group border-b border-border/50 last:border-0"
                                                                    >
                                                                        <span className="font-medium">{service.serviceName}</span>
                                                                        {newService === service.serviceName && <Check className="w-4 h-4 text-blue-500" />}
                                                                    </motion.div>
                                                                ))}
                                                            {availableServices.filter(service => !myServices.find(s => s.name === service.serviceName)).length === 0 && (
                                                                <div className="px-4 py-3 text-sm text-muted-foreground italic text-center">
                                                                    All {serviceFilter !== 'All' ? serviceFilter : ''} services added
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <button
                                            onClick={addService}
                                            disabled={!newService}
                                            className="p-3 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {myServices
                                        .filter(service => {
                                            const fullDetails = availableServices.find(s => s.serviceName === service.name) || {};
                                            return serviceFilter === 'All' || (fullDetails.category === serviceFilter);
                                        })
                                        .map((service, i) => {
                                            const fullDetails = availableServices.find(s => s.serviceName === service.name) || {};

                                            return (
                                                <motion.div
                                                    key={service.name}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                                    className={`p-6 rounded-[2.5rem] border transition-all flex flex-col justify-between group relative overflow-hidden h-full ${service.active ? 'bg-gradient-to-br from-card/60 to-background border-blue-500/30 shadow-lg shadow-blue-500/5' : 'bg-card/30 border-border opacity-75'}`}
                                                >
                                                    <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                                    <div className="relative z-10 flex items-start gap-5 mb-6">
                                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner ${service.active ? 'bg-blue-500 text-white shadow-blue-500/20' : 'bg-muted/50 text-muted-foreground'}`}>
                                                            {fullDetails.category === 'Fuel Delivery' ? (
                                                                <Fuel className="w-7 h-7" />
                                                            ) : (
                                                                <Wrench className="w-7 h-7" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className={`font-black text-2xl truncate ${service.active ? 'text-blue-500' : 'text-muted-foreground'}`}>{service.name}</h3>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => toggleService(service.name)}
                                                                        className={`relative w-12 h-7 rounded-full transition-colors flex items-center px-1 ${service.active ? 'bg-blue-500' : 'bg-muted'}`}
                                                                    >
                                                                        <motion.div
                                                                            layout
                                                                            className="w-5 h-5 bg-white rounded-full shadow-sm"
                                                                            animate={{ x: service.active ? 20 : 0 }}
                                                                        />
                                                                    </button>
                                                                    <button onClick={() => deleteService(service.name)} className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground font-medium mt-1 line-clamp-2 leading-relaxed">{fullDetails.description || "No description available."}</p>
                                                        </div>
                                                    </div>

                                                    <div className="relative z-10 grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-dashed border-border/50">
                                                        {fullDetails.category === 'Fuel Delivery' ? (
                                                            <>
                                                                <div className="bg-background/40 rounded-2xl p-3 border border-border/50 flex flex-col items-center justify-center text-center">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Fuel Rate</span>
                                                                    <span className="text-lg font-black flex items-center gap-0.5 text-yellow-600">
                                                                        <IndianRupee className="w-3.5 h-3.5 mt-0.5" />
                                                                        {fullDetails.pricePerLitre || '--'}/L
                                                                    </span>
                                                                </div>
                                                                <div className="bg-background/40 rounded-2xl p-3 border border-border/50 flex flex-col items-center justify-center text-center">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Delivery</span>
                                                                    <span className="text-lg font-black flex items-center gap-0.5">
                                                                        <IndianRupee className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
                                                                        {fullDetails.pricePerKm || '--'}/km
                                                                    </span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="bg-background/40 rounded-2xl p-3 border border-border/50 flex flex-col items-center justify-center text-center">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Base Price</span>
                                                                    <span className="text-lg font-black flex items-center gap-0.5">
                                                                        <IndianRupee className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
                                                                        {fullDetails.basePrice || '--'}
                                                                    </span>
                                                                </div>
                                                                <div className="bg-background/40 rounded-2xl p-3 border border-border/50 flex flex-col items-center justify-center text-center">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Per Km</span>
                                                                    <span className="text-lg font-black flex items-center gap-0.5">
                                                                        <IndianRupee className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
                                                                        {fullDetails.pricePerKm || '--'}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                </div>
                            </div>
                        )
                    }

                    {/* MY REVIEWS TAB */}
                    {
                        activeTab === 'reviews' && (
                            <div className="space-y-6">
                                {/* Stats Header */}
                                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 p-6 rounded-[2rem] flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                                        <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-yellow-500">{user?.averageRating || stats.rating || '5.0'}</p>
                                        <p className="text-sm text-muted-foreground font-bold">Average Rating • {myReviews.length} {myReviews.length === 1 ? 'Review' : 'Reviews'}</p>
                                    </div>
                                </div>

                                {/* Reviews List */}
                                <div className="space-y-4">
                                    {myReviews.map((review, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            key={review._id}
                                            className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-6 rounded-[2rem] hover:shadow-xl transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-24 bg-yellow-500/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                                            <div className="relative z-10">
                                                {/* Header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center font-black text-blue-500 border border-blue-500/20 text-lg">
                                                            {review.reviewer?.name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{review.reviewer?.name || 'Customer'}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Stars */}
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star
                                                                key={star}
                                                                className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Comment */}
                                                {review.comment && (
                                                    <p className="text-sm text-muted-foreground italic mb-4">"{review.comment}"</p>
                                                )}

                                                {/* Service Types */}
                                                {review.serviceTypes?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {review.serviceTypes.map((s, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 rounded-md bg-accent text-[10px] font-bold border border-border">
                                                                {typeof s === 'object' ? s.name : s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {myReviews.length === 0 && (
                                        <div className="text-center py-20 opacity-50">
                                            <Star className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                            <p className="font-bold text-lg">No reviews yet</p>
                                            <p>Complete jobs and satisfy customers to receive reviews!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }



                    {/* HISTORY TAB */}
                    {
                        activeTab === 'history' && (
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <h2 className="text-3xl font-black mb-1">History</h2>
                                        <p className="text-muted-foreground">{historyView === 'services' ? 'Your completed service records' : 'Log of all service requests'}</p>
                                    </div>

                                    {/* Toggle */}
                                    <div className="bg-card border p-1 rounded-xl flex gap-1">
                                        <button
                                            onClick={() => setHistoryView('services')}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${historyView === 'services' ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Service Records
                                        </button>
                                        <button
                                            onClick={() => setHistoryView('requests')}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${historyView === 'requests' ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Request Log
                                        </button>
                                    </div>
                                </div>

                                {historyLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <>
                                        {/* VIEW 1: SERVICE RECORDS (Detailed) */}
                                        {historyView === 'services' && (
                                            <div className="grid gap-6">
                                                {requestHistory.filter(r => r.status === 'Completed').length === 0 ? (
                                                    <div className="text-center py-12 bg-card/50 rounded-[2rem] border border-border/50">
                                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <CheckCircle className="w-8 h-8 text-muted-foreground" />
                                                        </div>
                                                        <h3 className="text-lg font-bold mb-1">No Completed Services</h3>
                                                        <p className="text-sm text-muted-foreground">You haven't completed any services yet.</p>
                                                    </div>
                                                ) : (
                                                    requestHistory.filter(r => r.status === 'Completed').map((req) => (
                                                        <div key={req._id} className="bg-card border border-border/50 rounded-[2rem] overflow-hidden hover:shadow-xl hover:border-blue-500/20 transition-all">
                                                            {/* Header */}
                                                            <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/10 flex items-center justify-center overflow-hidden border border-border">
                                                                        {req.customer?.photoUrl ? (
                                                                            <img src={req.customer.photoUrl} alt={req.customer.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <User className="w-6 h-6 text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-bold text-lg">{req.customer?.name || 'Unknown Customer'}</h3>
                                                                        <p className="text-xs text-muted-foreground">{new Date(req.timestamps?.completedAt || req.timestamps?.createdAt || Date.now()).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-2xl font-black text-green-500">₹{req.pricing?.totalAmount || 0}</div>
                                                                    <div className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded inline-block mt-1">PAID</div>
                                                                </div>
                                                            </div>

                                                            {/* Body */}
                                                            <div className="p-6 grid md:grid-cols-2 gap-8">
                                                                {/* Service Details */}
                                                                <div className="space-y-4">
                                                                    <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                                        <Wrench className="w-4 h-4" /> Service Details
                                                                    </h4>
                                                                    <div className="bg-background rounded-xl p-4 border space-y-3 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Service Type</span>
                                                                            <span className="font-bold">{req.serviceTypes?.join(', ') || req.serviceType || 'General Service'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Vehicle</span>
                                                                            <span className="font-bold">{req.vehicle?.model || 'Unknown'} <span className="text-xs text-muted-foreground font-normal">({req.vehicle?.fuelType})</span></span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Assigned To</span>
                                                                            <span className="font-bold">{req.assignedPerson?.name || 'Self'}</span>
                                                                        </div>
                                                                        {req.assignedPerson?.phone && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-muted-foreground">Operator Phone</span>
                                                                                <span className="font-mono">{req.assignedPerson.phone}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Bill Breakdown */}
                                                                <div className="space-y-4">
                                                                    <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                                        <DollarSign className="w-4 h-4" /> Bill Breakdown
                                                                    </h4>
                                                                    <div className="bg-background rounded-xl p-4 border space-y-2 text-sm">
                                                                        <div className="flex justify-between text-muted-foreground">
                                                                            <span>Base Fee</span>
                                                                            <span>₹{req.pricing?.baseFee || 0}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-muted-foreground">
                                                                            <span>Distance Fee ({req.pricing?.distanceMetric || 0} km)</span>
                                                                            <span>₹{req.pricing?.distanceFee || 0}</span>
                                                                        </div>
                                                                        <div className="py-1">
                                                                            <div className="flex justify-between text-muted-foreground font-medium">
                                                                                <span>Materials Cost</span>
                                                                                <span>₹{req.pricing?.materialCost || 0}</span>
                                                                            </div>

                                                                            {/* Materials List */}
                                                                            {req.bill && req.bill.length > 0 && (
                                                                                <div className="pl-3 mt-1.5 space-y-1 border-l-2 border-muted/40 ml-1">
                                                                                    {req.bill.map((item, idx) => (
                                                                                        <div key={idx} className="flex justify-between text-xs text-muted-foreground/80">
                                                                                            <span>{item.name}</span>
                                                                                            <span>₹{item.cost}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="pt-3 mt-1 border-t flex justify-between font-bold text-base">
                                                                            <span>Total</span>
                                                                            <span>₹{req.pricing?.totalAmount || 0}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}

                                        {/* VIEW 2: REQUEST LOG (All Requests) */}
                                        {historyView === 'requests' && (
                                            <div className="grid gap-4">
                                                {/* Combine Active + History for Log View (Deduplicated) */}
                                                {Array.from(new Map([...requests, ...requestHistory].map(item => [item._id || item.id, item])).values())
                                                    .sort((a, b) => new Date(b.createdAt || b.timestamps?.createdAt || 0) - new Date(a.createdAt || a.timestamps?.createdAt || 0))
                                                    .map((req) => (
                                                        <div key={req._id || req.id} className="bg-card border border-border/50 p-4 rounded-xl flex items-center justify-between hover:bg-accent/5 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg 
                                                                 ${req.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                                                                        req.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' :
                                                                            req.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                                'bg-blue-500/10 text-blue-500'}`}>
                                                                    {req.status === 'Completed' ? <CheckCircle className="w-5 h-5" /> :
                                                                        req.status === 'Cancelled' ? <XCircle className="w-5 h-5" /> :
                                                                            req.status === 'Pending' ? <Clock className="w-5 h-5" /> :
                                                                                <PlayCircle className="w-5 h-5" />}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-sm">{(req.vehicle?.model || req.type) || 'Request'}</h4>
                                                                    <p className="text-xs text-muted-foreground">{new Date(req.createdAt || req.timestamps?.createdAt || Date.now()).toLocaleString()}</p>
                                                                </div>
                                                            </div>

                                                            <div className="text-right">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider 
                                                                ${req.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                                                                        req.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' :
                                                                            req.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                                'bg-blue-500/10 text-blue-500'}`}>
                                                                    {req.status}
                                                                </span>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    {req.customerName || req.customer?.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                {[...requests, ...requestHistory].length === 0 && (
                                                    <div className="text-center py-12 text-muted-foreground">No requests found.</div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>)
                    }

                    {/* SETTINGS TAB */}

                    {
                        activeTab === 'settings' && (
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-2xl font-black mb-6">Profile Settings</h2>

                                {user.pendingUpdate?.status === 'Pending' && (
                                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3 text-yellow-500 font-bold">
                                        <Clock className="w-5 h-5" />
                                        Update Requested. Waiting for Admin Approval.
                                    </div>
                                )}

                                <div className="grid gap-6">
                                    <div className="p-8 bg-gradient-to-br from-card/60 to-background border border-border/50 rounded-[2.5rem] relative overflow-hidden shadow-lg">
                                        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                        <div className="relative z-10 space-y-8">
                                            <div className="flex items-center gap-5 border-b border-border/40 pb-6">
                                                <div className="w-20 h-20 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center shadow-inner">
                                                    <User className="w-8 h-8 text-blue-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black tracking-tight">{user.name}</h3>
                                                    <p className="text-muted-foreground font-medium">{user.email}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="bg-green-500/10 text-green-500 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> Verified Provider
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">Shop Name</label>
                                                    <div className="p-4 bg-background/50 border border-border/50 rounded-2xl font-bold opacity-80 flex items-center gap-3">
                                                        <Wrench className="w-4 h-4 text-muted-foreground" />
                                                        {user.shopName || "Not set"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">Phone</label>
                                                    <div className="p-4 bg-background/50 border border-border/50 rounded-2xl font-bold opacity-80 flex items-center gap-3">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        {user.phone || "Not set"}
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">Address</label>
                                                    <div className="p-4 bg-background/50 border border-border/50 rounded-2xl font-bold opacity-80 flex items-center gap-3">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        {user.address || "Not set"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {user.pendingUpdate?.status !== 'Pending' && (
                                        <button
                                            onClick={() => {
                                                setUpdateData({
                                                    shopName: user.shopName || '',
                                                    address: user.address || '',
                                                    phone: user.phone || '',
                                                    location: user.location || null
                                                });
                                                if (user.location?.coordinates) {
                                                    setMapCenter({ lat: user.location.coordinates[1], lng: user.location.coordinates[0] });
                                                }
                                                setShowSettingsModal(true);
                                            }}
                                            className="w-full py-5 bg-card hover:bg-accent border border-border font-bold text-foreground rounded-[2rem] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" /> Request Information Update
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {/* Settings Modal */}
                    <AnimatePresence>
                        {showSettingsModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-6">
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-gradient-to-br from-card to-background border border-border/50 rounded-none md:rounded-[3rem] w-full h-full max-w-7xl shadow-2xl relative overflow-hidden flex flex-col"
                                >
                                    <div className="absolute top-0 right-0 p-48 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                                    <div className="relative z-10 flex flex-col h-full p-6 md:p-12 overflow-y-auto">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <h2 className="text-4xl font-black mb-2">Request Update</h2>
                                                <p className="text-xl text-muted-foreground font-medium">Changes require admin approval.</p>
                                            </div>
                                            <button onClick={() => setShowSettingsModal(false)} className="p-4 hover:bg-accent rounded-full"><X className="w-8 h-8" /></button>
                                        </div>

                                        <form onSubmit={handleRequestUpdate} className="flex-1 flex flex-col md:flex-row gap-10">
                                            {/* Left Column: Form Fields */}
                                            <div className="flex-1 space-y-6">
                                                <div>
                                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Shop Name</label>
                                                    <input
                                                        type="text"
                                                        value={updateData.shopName}
                                                        onChange={(e) => setUpdateData({ ...updateData, shopName: e.target.value })}
                                                        className="w-full h-16 rounded-2xl bg-secondary/30 border border-border px-6 font-bold text-lg outline-none focus:border-blue-500 focus:bg-background mt-2 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone</label>
                                                    <input
                                                        type="text"
                                                        value={updateData.phone}
                                                        onChange={(e) => setUpdateData({ ...updateData, phone: e.target.value })}
                                                        className="w-full h-16 rounded-2xl bg-secondary/30 border border-border px-6 font-bold text-lg outline-none focus:border-blue-500 focus:bg-background mt-2 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Address</label>
                                                    <textarea
                                                        value={updateData.address}
                                                        onChange={(e) => setUpdateData({ ...updateData, address: e.target.value })}
                                                        className="w-full h-40 rounded-2xl bg-secondary/30 border border-border p-6 font-bold text-lg outline-none focus:border-blue-500 focus:bg-background mt-2 resize-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Column: Map */}
                                            <div className="flex-1 flex flex-col">
                                                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2">Location Update (Drag Marker)</label>
                                                <div className="flex-1 w-full rounded-3xl overflow-hidden border border-border relative min-h-[600px]">
                                                    <MapComponent
                                                        center={mapCenter}
                                                        zoom={14}
                                                    >
                                                        {updateData.location?.coordinates && (
                                                            <Marker
                                                                draggable={true}
                                                                position={{
                                                                    lat: updateData.location.coordinates[1],
                                                                    lng: updateData.location.coordinates[0]
                                                                }}
                                                                onDragEnd={(e) => {
                                                                    const newLat = e.latLng.lat();
                                                                    const newLng = e.latLng.lng();
                                                                    setUpdateData(prev => ({
                                                                        ...prev,
                                                                        location: {
                                                                            type: 'Point',
                                                                            coordinates: [newLng, newLat]
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                        )}
                                                    </MapComponent>
                                                </div>

                                                <div className="flex gap-4 pt-8">
                                                    <button type="button" onClick={() => setShowSettingsModal(false)} className="flex-1 py-5 text-lg font-bold text-muted-foreground hover:bg-accent rounded-2xl">Cancel</button>
                                                    <button type="submit" className="flex-[2] py-5 bg-blue-500 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-500/25 hover:scale-[1.01] transition-transform">
                                                        Submit Request
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Incoming Request Modal */}
                    <AnimatePresence>
                        {incomingRequest && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    className="bg-card border-2 border-blue-500/50 p-1 rounded-[2.5rem] w-full max-w-md shadow-[0_0_100px_rgba(255,94,0,0.3)] relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>

                                    <button
                                        onClick={() => setIncomingRequest(null)}
                                        className="absolute top-4 right-4 z-20 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-foreground/70" />
                                    </button>

                                    <div className="bg-background rounded-[2.3rem] p-6 text-center space-y-6 relative overflow-hidden">

                                        {/* Header */}
                                        <div>
                                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                                                <Bell className="w-8 h-8 text-blue-500" />
                                            </div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter">New Request!</h2>
                                            <p className="text-muted-foreground font-bold">{incomingRequest.serviceTypes?.join(', ') || 'Service'} Needed</p>
                                        </div>

                                        {/* Details */}
                                        <div className="bg-secondary/30 rounded-2xl p-4 text-left space-y-3">
                                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                                <span className="text-xs font-bold uppercase text-muted-foreground">Est. Earnings</span>
                                                {/* Use pricing.totalAmount (populated by createRequest) or fallback to pricing.totalEstimate */}
                                                <span className="text-xl font-black text-green-500">₹{Math.ceil(incomingRequest.pricing?.totalAmount || incomingRequest.pricing?.totalEstimate || 0)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                                                    {incomingRequest.customer?.photoUrl ? (
                                                        <img src={incomingRequest.customer.photoUrl} alt="Customer" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{incomingRequest.customer?.name || 'Customer Nearby'}</p>
                                                    <p className="text-xs text-muted-foreground">~{(incomingRequest.pricing?.distanceMetric || 0).toFixed(1)} km away</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Problem Photo */}
                                        {incomingRequest.problemPhotoUrl && (
                                            <div className="rounded-xl overflow-hidden border border-border h-40 relative group">
                                                <img src={incomingRequest.problemPhotoUrl} alt="Problem" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-bold text-xs"><ImageIcon className="w-4 h-4 inline mr-1" /> View Full</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Assignment Details (Optional) */}
                                        <div className="bg-secondary/30 rounded-2xl p-4 space-y-3">
                                            <p className="text-xs font-bold uppercase text-muted-foreground">Assign Technician (Optional)</p>
                                            <input
                                                type="text"
                                                placeholder="Name (e.g. Raju Mechanic)"
                                                className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                value={assignmentDetails.name}
                                                onChange={(e) => setAssignmentDetails({ ...assignmentDetails, name: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Phone Number"
                                                className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                value={assignmentDetails.phone}
                                                onChange={(e) => setAssignmentDetails({ ...assignmentDetails, phone: e.target.value })}
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <button
                                                onClick={handleRejectRequest}
                                                className="py-4 rounded-xl font-bold bg-muted hover:bg-muted/80 hover:text-foreground transition-colors border border-border/50"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={handleAcceptRequest}
                                                className="py-4 rounded-xl font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:scale-105 hover:bg-blue-500/90 transition-all"
                                            >
                                                Accept Job
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {
                        activeJob && socket && ['Accepted', 'Arrived', 'In Progress'].includes(activeJob.status) && (
                            <LiveChat
                                socket={socket}
                                roomId={activeJob._id}
                                userName={user.name}
                                role="provider"
                                recipientName={activeJob.customerName || 'Customer'}
                            />
                        )
                    }


                </div >
            </main >

            {/* Feedback Modal */}
            < AnimatePresence >
                {showFeedback && feedbackData && (
                    <FeedbackModal
                        isOpen={showFeedback}
                        onClose={() => { setShowFeedback(false); setFeedbackData(null); }}
                        requestId={feedbackData.requestId}
                        reviewerId={feedbackData.reviewerId}
                        reviewerType={feedbackData.reviewerType}
                        revieweeId={feedbackData.revieweeId}
                        revieweeType={feedbackData.revieweeType}
                        revieweeName={feedbackData.revieweeName}
                        serviceTypes={feedbackData.serviceTypes}
                        onSubmitSuccess={() => {
                            fetchProviderJobs(user?._id);
                        }}
                    />
                )}
            </AnimatePresence >

            {/* OTP Verification Modal */}
            < AnimatePresence >
                {showOtpModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-[2.5rem] p-8 border border-border shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

                            <button
                                onClick={() => setShowOtpModal(false)}
                                className="absolute top-4 right-4 p-2 bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center mb-8 relative z-10">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-500">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black mb-1">Verify Service</h3>
                                <p className="text-muted-foreground text-sm">Ask customer for the 4-digit PIN</p>
                            </div>

                            <div className="flex gap-3 justify-center mb-8 relative z-10">
                                {otpInput.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (!val && e.target.value) return;

                                            const newOtp = [...otpInput];
                                            newOtp[index] = val;
                                            setOtpInput(newOtp);

                                            // Focus Next
                                            if (val && index < 3) {
                                                document.getElementById(`otp-${index + 1}`).focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
                                                document.getElementById(`otp-${index - 1}`).focus();
                                            }
                                        }}
                                        className="w-14 h-16 bg-secondary border border-border rounded-xl text-center text-3xl font-black focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none"
                                    />
                                ))}
                            </div>

                            {otpError && (
                                <p className="text-red-500 text-center font-bold text-sm mb-4 animate-pulse">{otpError}</p>
                            )}

                            <button
                                onClick={verifyServiceOtp}
                                disabled={otpVerifying || otpInput.join('').length !== 4}
                                className={`w-full py-4 ${otpInput.join('').length === 4 ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25' : 'bg-gray-500/10 text-gray-400 cursor-not-allowed'} rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2`}
                            >
                                {otpVerifying ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Announcement Modal */}
            < AnimatePresence >
                {showAnnouncements && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border border-border p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative max-h-[80vh] flex flex-col"
                        >
                            <button onClick={() => setShowAnnouncements(false)} className="absolute top-6 right-6 p-2 hover:bg-accent rounded-full text-muted-foreground">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-500/10 rounded-2xl">
                                    <Megaphone className="w-6 h-6 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight">Recent Announcements</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                                {announcements.map((a, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={a._id}
                                        className="p-5 rounded-3xl bg-accent/30 border border-border/50 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg leading-tight">{a.title}</h4>
                                            <span className="text-[10px] uppercase font-black text-blue-500 tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">Alert</span>
                                        </div>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{a.message}</p>
                                        <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground font-bold">
                                            <Clock className="w-3 h-3" />
                                            {new Date(a.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </motion.div>
                                ))}
                                {announcements.length === 0 && (
                                    <div className="text-center py-20 opacity-50 flex flex-col items-center gap-4">
                                        <Bell className="w-12 h-12" />
                                        <p className="font-bold">No announcements yet.</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowAnnouncements(false)}
                                className="mt-8 w-full py-4 bg-foreground text-background font-black rounded-2xl hover:opacity-90 transition-all active:scale-95"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </div >
    );
};

// Helper Icon for Graph (replace TrendingUp if not in lucide imports)
const TrendingUpIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

export default ProviderDashboard;
