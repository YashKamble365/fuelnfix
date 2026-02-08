import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Settings,
    LogOut,
    Menu,
    X,
    Wrench,
    Battery,
    Fuel,
    Zap,
    Truck,
    Key,
    User,
    ChevronRight,
    Bell,
    Search,
    CheckCircle,
    Phone,
    Wallet,
    IndianRupee,
    History,
    ChevronLeft,
    Maximize,
    Minimize,
    Compass,
    Navigation as NavIcon,
    Lock,
    Moon, // Added Moon as per instruction's implied change
    Sun, // Added Sun as per instruction's implied change
    Megaphone,
    Clock
} from 'lucide-react';
import { useTheme } from '../components/theme-provider';
import { ModeToggle } from '../components/mode-toggle';
import MapComponent from '../components/GoogleMaps/MapComponent';
import { Marker } from '@react-google-maps/api';
import { auth } from '../firebaseConfig';
import RequestHelpWizard from '../components/RequestHelpWizard';
import { io } from 'socket.io-client';
import LiveChat from '../components/LiveChat';
import api, { API_BASE_URL } from '../lib/api';
import Receipt from '../components/Receipt';
import FeedbackModal from '../components/FeedbackModal';
import { useToast } from '../components/Toast';

// Icon Mapping for Dynamic Services
const ICON_MAPPING = {
    'Flat Tire': Wrench,
    'Dead Battery': Battery,
    'Engine Trouble': Zap,
    'Towing': Truck,
    'Key Lockout': Key,
    'Fuel Delivery': Fuel,
    'Mobile EV Charging': Zap,
    'Flatbed Towing': Truck,
    'EV Battery Jumpstart': Battery,
    'Cable Unlock': Lock
};

const COLOR_MAPPING = {
    'Flat Tire': 'from-orange-500/20 to-orange-600/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    'Dead Battery': 'from-red-500/20 to-red-600/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    'Engine Trouble': 'from-purple-500/20 to-purple-600/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    'Towing': 'from-blue-500/20 to-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    'Key Lockout': 'from-emerald-500/20 to-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    'Mobile EV Charging': 'from-green-500/20 to-green-600/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    'Flatbed Towing': 'from-blue-500/20 to-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    'EV Battery Jumpstart': 'from-yellow-500/20 to-yellow-600/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    'Cable Unlock': 'from-slate-500/20 to-slate-600/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
};

const CAR_SYMBOL = {
    path: "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z",
    fillColor: "#4285F4",
    fillOpacity: 1,
    scale: 0.6,
    strokeColor: "white",
    strokeWeight: 2,
    anchor: { x: 12, y: 25 },
};

const defaultCenter = {
    lat: 19.0760,
    lng: 72.8777
};

const UBER_STYLE = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#212121" }]
    },
    {
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#212121" }]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "administrative.country",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
    },
    {
        "featureType": "administrative.land_parcel",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#bdbdbd" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#181818" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#616161" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#1b1b1b" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#2c2c2c" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#8a8a8a" }]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [{ "color": "#373737" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#3c3c3c" }]
    },
    {
        "featureType": "road.highway.controlled_access",
        "elementType": "geometry",
        "stylers": [{ "color": "#4e4e4e" }]
    },
    {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#616161" }]
    },
    {
        "featureType": "transit",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#3d3d3d" }]
    }
];

const Dashboard = () => {
    const toast = useToast();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeRequest, setActiveRequest] = useState(null);
    const [searching, setSearching] = useState(false);
    const [selectedServiceForWizard, setSelectedServiceForWizard] = useState(null); // New Wizard State
    const [wizardCategory, setWizardCategory] = useState(null); // 'Mechanic' | 'Fuel Delivery' | 'EV Support'
    const [isMapMode, setIsMapMode] = useState(false);
    const [currentView, setCurrentView] = useState('overview'); // 'overview' | 'tracking'
    const [serviceRates, setServiceRates] = useState([]);


    // Default location (Mumbai) if user geo fails
    const [location, setLocation] = useState({ lat: 19.0760, lng: 72.8777 });

    const [providerLocation, setProviderLocation] = useState(null);
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();
    const { theme } = useTheme();

    // Tracking States
    const [isChaseMode, setIsChaseMode] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(15);
    const joinedRequestRoom = useRef(null); // Track which request room we've joined

    // Bill and Payment States
    const [receivedBill, setReceivedBill] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackData, setFeedbackData] = useState(null);

    // History State
    const [requestHistory, setRequestHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Announcement State
    const [announcements, setAnnouncements] = useState([]);
    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

    const fetchHistory = async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const res = await api.get(`/api/request/user/history/${user._id}`);
            setRequestHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (currentView === 'history') {
            fetchHistory();
        }
    }, [currentView, user]);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/api/admin-features/announcements');
            const filtered = res.data.filter(a => a.target === 'all' || a.target === 'users');
            setAnnouncements(filtered);
            // In a real app, you'd compare with a "last seen" timestamp in local storage
            setUnreadAnnouncements(filtered.length);
        } catch (err) {
            console.error("Failed to fetch announcements", err);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Socket Connection
    useEffect(() => {
        const SOCKET_URL = API_BASE_URL;
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        let parsedUser;
        try {
            parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
        } catch (e) {
            console.error("Failed to parse user data", e);
            localStorage.removeItem('user');
            navigate('/login');
            return;
        }

        // Fetch latest user data
        api.get(`/api/auth/profile/${parsedUser._id}`)
            .then(res => {
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
            })
            .catch(err => console.error("Failed to sync user data", err));

        // Socket setup (only if socket exists)
        if (!socket) return;

        // Join user's personal room (once)
        socket.emit('join_room', parsedUser._id);
        console.log('[Socket] Joined user room:', parsedUser._id);

        // Listeners
        const onRequestAccepted = (data) => {
            console.log("Request Accepted:", data);
            setActiveRequest(data);
            toast.success("Your request has been accepted!");
            // Join specific request room for tracking
            socket.emit('join_room', data._id);
            console.log('[Socket] Joined request room:', data._id);
        };

        const onStatusChanged = (status) => {
            setActiveRequest(prev => prev ? { ...prev, status } : null);
            if (status === 'Completed') {
                toast.success("Job Completed! Please pay the provider.");
                window.location.reload();
            }
        };

        const onTrackProvider = (coords) => {
            console.log("Provider moved:", coords);
            setProviderLocation(coords);
        };

        const onBillReceived = (billData) => {
            console.log("[Dashboard] Bill Received:", billData);
            console.log("[Dashboard] Bill requestId:", billData.requestId);
            console.log("[Dashboard] Bill totalAmount:", billData.totalAmount);
            setReceivedBill(billData);
        };

        const onRequestCancelled = (data) => {
            console.log("Request Cancelled:", data);
            toast.warning(`Your request was cancelled/rejected: ${data.reason}`);
            setActiveRequest(null);
            setProviderLocation(null);
            // Optional: reset search state if needed
        };

        const onNewAnnouncement = (announcement) => {
            if (announcement.target === 'all' || announcement.target === 'users') {
                setAnnouncements(prev => [announcement, ...prev]);
                setUnreadAnnouncements(prev => prev + 1);
                // Optional: show a toast or browser notification
            }
        };

        const onOtpVerified = (data) => {
            console.log("OTP Verified:", data);
            toast.success(data.message || "OTP Verified! Work started.");
            if (activeRequest) {
                setActiveRequest(prev => ({ ...prev, otpVerified: true, status: 'In Progress' }));
            }
        };

        socket.on('request_accepted', onRequestAccepted);
        socket.on('status_changed', onStatusChanged);
        socket.on('track_provider', onTrackProvider);
        socket.on('bill_received', onBillReceived);
        socket.on('request_cancelled', onRequestCancelled);
        socket.on('new_announcement', onNewAnnouncement);
        socket.on('otp_verified', onOtpVerified);

        // Cleanup function
        return () => {
            socket.off('request_accepted', onRequestAccepted);
            socket.off('status_changed', onStatusChanged);
            socket.off('track_provider', onTrackProvider);
            socket.off('bill_received', onBillReceived);
            socket.off('new_announcement', onNewAnnouncement);
            socket.off('otp_verified', onOtpVerified);
            console.log('[Socket] Cleaned up listeners');
        };
    }, [navigate, socket]);

    // Fetch Live Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    toast.warning("Could not get your location. Using default.");
                }
            );
        } else {
            toast.error("Geolocation is not supported by this browser.");
        }
    }, []);

    // Also join request room if active request exists initially (deduplicated)
    // Fallback: If request is loaded but bill is sent and not yet in state
    useEffect(() => {
        if (activeRequest && activeRequest.billSent && activeRequest.paymentStatus === 'pending' && !receivedBill) {
            console.log("[Dashboard] Restoring missed bill from activeRequest");
            setReceivedBill({
                requestId: activeRequest._id,
                totalAmount: activeRequest.pricing.totalAmount,
                bill: activeRequest.bill,
                baseFee: activeRequest.pricing.baseFee,
                distanceFee: activeRequest.pricing.distanceFee,
                distance: activeRequest.pricing.distanceMetric,
                materialsCost: activeRequest.pricing.materialCost,
                serviceTypes: activeRequest.serviceTypes,
                providerName: activeRequest.provider?.shopName || activeRequest.provider?.name || 'Service Provider'
            });
        }
    }, [activeRequest, receivedBill]);
    useEffect(() => {
        if (activeRequest?._id && socket && joinedRequestRoom.current !== activeRequest._id) {
            socket.emit('join_room', activeRequest._id);
            joinedRequestRoom.current = activeRequest._id;
            console.log('[Socket] Joined request room (initial load):', activeRequest._id);
        }
    }, [activeRequest?._id, socket]);


    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Fetch Service Rates on Mount
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await api.get('/api/admin-features/pricing');
                setServiceRates(res.data);
            } catch (err) {
                console.error("Failed to fetch service rates", err);
            }
        };
        fetchRates();
    }, []);

    // Filter services based on selected wizard category
    const getFilteredServices = () => {
        if (!wizardCategory) return [];
        return serviceRates
            .filter(rate => rate.category === wizardCategory)
            .map(rate => {
                const Icon = ICON_MAPPING[rate.serviceName] || Wrench;
                return {
                    name: rate.serviceName,
                    icon: <Icon className="w-6 h-6" />,
                    color: COLOR_MAPPING[rate.serviceName] || 'from-blue-500/20 to-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                };
            });
    };

    // Multi-Service Booking State
    const [isMultiSelect, setIsMultiSelect] = useState(false);
    const [selectedServices, setSelectedServices] = useState(new Set());

    const fetchActiveRequest = async (userId) => {
        try {
            const res = await api.get(`/api/request/user/active/${userId}`);
            if (res.data) {
                setActiveRequest(res.data);

                // Restore Bill State if bill was sent but not completed
                if (res.data.billSent && res.data.status !== 'Completed') {
                    setReceivedBill({
                        requestId: res.data._id,
                        bill: res.data.bill,
                        baseFee: res.data.pricing?.baseFee || 0,
                        distanceFee: res.data.pricing?.distanceFee || 0,
                        materialsCost: res.data.pricing?.materialCost || 0,
                        totalAmount: res.data.pricing?.totalAmount || 0,
                        serviceTypes: res.data.serviceTypes,
                        providerId: res.data.provider?._id || res.data.provider,
                        providerName: res.data.provider?.name || 'Service Provider',
                        distance: res.data.pricing?.distanceMetric || 0
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch active request", err);
        }
    };

    useEffect(() => {
        if (user?._id) fetchActiveRequest(user._id);
    }, [user]);

    const handleServiceClick = (serviceName) => {
        if (isMultiSelect) {
            const newSet = new Set(selectedServices);
            if (newSet.has(serviceName)) {
                newSet.delete(serviceName);
            } else {
                newSet.add(serviceName);
            }
            setSelectedServices(newSet);
            return;
        }

        // Find full service object
        const fullService = getFilteredServices().find(s => s.name === serviceName);
        if (fullService) {
            setSelectedServiceForWizard([fullService]); // Pass as array
        }
    };


    const handleCancelRequest = async () => {
        if (!activeRequest) return;
        if (!window.confirm("Are you sure you want to cancel this request?")) return;

        try {
            await api.post('/api/request/cancel', { requestId: activeRequest._id, reason: 'User cancelled via Dashboard' });
            setActiveRequest(null);
            if (user?._id) fetchActiveRequest(user._id);
            toast.success("Request Cancelled");
        } catch (err) {
            console.error(err);
            toast.error("Failed to cancel request");
        }
    };

    const handleMultiBook = () => {
        const servicesToBook = getFilteredServices().filter(s => selectedServices.has(s.name));
        setSelectedServiceForWizard(servicesToBook);
        setIsMultiSelect(false);
        setSelectedServices(new Set());
    };

    const handleWizardSuccess = () => {
        setSelectedServiceForWizard(null);
        setWizardCategory(null);
        setIsMapMode(false);
        if (user?._id) fetchActiveRequest(user._id); // Refresh status
        toast.success("Request Sent! Provider has been notified.");
    };

    // Handle Payment with Cashfree
    const handlePayBill = async () => {
        if (!receivedBill) return;

        setPaymentProcessing(true);
        try {
            const { load } = await import('@cashfreepayments/cashfree-js');
            const cashfree = await load({ mode: "sandbox" });

            // Create Order on Backend
            const response = await api.post('/api/payment/create-order', {
                orderAmount: receivedBill.totalAmount,
                customerId: user._id,
                customerPhone: user.phone || '9999999999',
                customerName: user.name || 'Customer'
            });

            const paymentSessionId = response.data.payment_session_id;
            const orderId = response.data.order_id;

            // Start Checkout
            cashfree.checkout({
                paymentSessionId: paymentSessionId,
                redirectTarget: "_modal"
            }).then(async (result) => {
                console.log("[Payment] Checkout result:", result);
                if (result.error) {
                    console.log("User closed payment popup or error occurred", result.error);
                    setPaymentProcessing(false);
                    return;
                }
                if (result.paymentDetails) {
                    console.log("[Payment] Payment completed, verifying...", result.paymentDetails);

                    try {
                        // Verify on backend
                        const verifyRes = await api.post('/api/payment/verify-payment', { orderId });
                        console.log("[Payment] Verify response:", verifyRes.data);

                        if (verifyRes.data[0]?.payment_status === "SUCCESS") {
                            console.log("[Payment] Payment SUCCESS, confirming...");

                            // Confirm payment on request
                            const confirmRes = await api.post('/api/request/confirm-payment', {
                                requestId: receivedBill.requestId || activeRequest?._id,
                                paymentId: verifyRes.data[0].cf_payment_id,
                                status: 'success'
                            });
                            console.log("[Payment] Confirm response:", confirmRes.data);

                            // Store data for receipt
                            console.log("[Payment] activeRequest.provider:", activeRequest?.provider);
                            console.log("[Payment] receivedBill.providerId:", receivedBill.providerId);
                            const receiptPayload = {
                                requestData: {
                                    requestId: receivedBill.requestId || activeRequest?._id,
                                    serviceTypes: receivedBill.serviceTypes || activeRequest?.serviceTypes || [],
                                    pricing: {
                                        baseFee: receivedBill.baseFee || 0,
                                        distanceFee: receivedBill.distanceFee || 0,
                                        materialCost: receivedBill.materialsCost || 0,
                                        totalAmount: receivedBill.totalAmount || 0,
                                        distanceMetric: receivedBill.distance || 0
                                    },
                                    bill: receivedBill.bill || [],
                                    location: activeRequest?.location,
                                    paymentCompletedAt: new Date()
                                },
                                paymentId: verifyRes.data[0].cf_payment_id,
                                customerName: user?.name,
                                providerId: receivedBill.providerId || activeRequest?.provider?._id || activeRequest?.provider,
                                providerName: receivedBill.providerName || activeRequest?.provider?.name || 'Service Provider'
                            };
                            console.log("[Payment] Setting receipt data:", receiptPayload);
                            setReceiptData(receiptPayload);

                            console.log("[Payment] Showing receipt...");
                            setShowReceipt(true);
                            setReceivedBill(null);
                            if (user?._id) fetchActiveRequest(user._id);
                        } else {
                            console.log("[Payment] Payment status not SUCCESS:", verifyRes.data[0]?.payment_status);
                            toast.error("Payment Failed or Pending. Please try again.");
                        }
                    } catch (verifyError) {
                        console.error("[Payment] Verification error:", verifyError);
                        toast.error("Payment verification failed. Please contact support.");
                    }
                }
                setPaymentProcessing(false);
            }).catch((err) => {
                console.error("[Payment] Checkout error:", err);
                setPaymentProcessing(false);
            });
        } catch (error) {
            console.error("Payment Error:", error);
            toast.error("Failed to initiate payment");
            setPaymentProcessing(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden relative selection:bg-blue-500/30">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 w-80 !bg-white dark:!bg-card/50 !backdrop-blur-none dark:!backdrop-blur-2xl border-r border-border z-50 transform transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isMapMode ? 'lg:-translate-x-full lg:w-0 lg:opacity-0 pointer-events-none' : ''} flex flex-col`}>
                <div className="p-8 pb-4 bg-white dark:bg-transparent">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-500/80 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                            <MapPin className="w-6 h-6 fill-current" />
                        </div>
                        <div className="text-2xl font-black tracking-tighter">
                            Fuel<span className="text-blue-500">N</span>Fix
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => { setCurrentView('overview'); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'overview' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'}`}
                        >
                            <MapPin className="w-5 h-5 fill-current opacity-90" />
                            Request Help
                        </button>

                        {/* Live Tracking Link - Only visible when active request exists */}
                        {activeRequest && (
                            <button
                                onClick={() => { setCurrentView('tracking'); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'tracking' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'}`}
                            >
                                <Compass className={`w-5 h-5 ${currentView === 'tracking' ? 'animate-spin-slow' : ''}`} />
                                Live Tracking
                                <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                            </button>
                        )}

                        <button
                            onClick={() => { setCurrentView('history'); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'history' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'}`}
                        >
                            <History className="w-5 h-5 opacity-90" />
                            Service History
                        </button>



                        <button
                            onClick={() => { setShowAnnouncements(true); setUnreadAnnouncements(0); setSidebarOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-foreground/80 hover:bg-accent/50 hover:text-foreground rounded-2xl font-medium transition-all group"
                        >
                            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" /> Notifications
                            {unreadAnnouncements > 0 && (
                                <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    {unreadAnnouncements}
                                </span>
                            )}
                        </button>
                        <button onClick={() => { navigate('/settings'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-foreground/80 hover:bg-accent/50 hover:text-foreground rounded-2xl font-medium transition-all group">
                            <Settings className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" /> Settings
                        </button>
                    </nav>
                </div>

                {/* White spacer to fill the gap */}
                <div className="flex-1 bg-white dark:bg-transparent"></div>

                <div className="p-6 border-t border-border/50 bg-white dark:bg-background/20">
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-card dark:to-background border border-border shadow-sm">
                        {(user.photoUrl || auth.currentUser?.photoURL) ? (
                            <img src={user.photoUrl || auth.currentUser?.photoURL} alt="User" className="w-11 h-11 rounded-xl object-cover border-2 border-blue-500/10" />
                        ) : (
                            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 text-lg">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-bold truncate text-foreground">{user.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground capitalize font-medium">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem('user');
                            navigate('/login');
                        }}
                        className="w-full flex items-center justify-center gap-2 text-sm text-destructive font-bold hover:bg-destructive/10 p-3.5 rounded-2xl transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 w-full">
                <div className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    <header className="flex flex-col-reverse gap-4 lg:flex-row justify-between items-start lg:items-center mb-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-card border border-border text-foreground">
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest mb-1">{getGreeting()}</p>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                                    <span className="text-blue-500">{user.name?.split(' ')[0] || 'User'}</span> 👋
                                </h1>
                                <p className="text-muted-foreground font-medium mt-1">What kind of assistance do you need today?</p>
                            </div>
                        </div>
                        <div className="self-end lg:self-auto flex items-center gap-3">
                            <ModeToggle />
                        </div>
                    </header>


                    {/* --- VIEW: OVERVIEW --- */}
                    <AnimatePresence mode="wait">
                        {currentView === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Active Request Status (Visible in Overview too) */}
                                {activeRequest && (
                                    <motion.div
                                        onClick={() => setCurrentView('tracking')}
                                        className="cursor-pointer mb-8 p-8 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-[2.5rem] flex items-center justify-between relative overflow-hidden group hover:scale-[1.01] transition-transform"
                                    >
                                        <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                        {/* Cancel Button for Pending Requests */}
                                        {activeRequest.status === 'Pending' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelRequest();
                                                }}
                                                className="absolute top-6 right-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-destructive hover:text-white rounded-full transition-all z-20"
                                                title="Cancel Request"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                        <div className="relative z-10 w-full">
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="text-2xl font-black text-blue-500 mb-2">
                                                        {activeRequest.status === 'Pending' ? 'Looking for Help...' : 'Assistance on the way!'}
                                                    </h3>
                                                    <p className="text-foreground/80 font-medium text-lg">
                                                        {activeRequest.status === 'Pending'
                                                            ? 'We are notifying nearby providers.'
                                                            : <span>
                                                                {activeRequest.assignedPerson?.name ? (
                                                                    <>
                                                                        <strong>{activeRequest.assignedPerson.name}</strong> ({activeRequest.provider?.name})
                                                                    </>
                                                                ) : (
                                                                    <strong>{activeRequest.provider?.name || 'Assigned'}</strong>
                                                                )} is en route.
                                                            </span>
                                                        }
                                                    </p>
                                                </div>
                                                <span className="relative flex h-4 w-4 shrink-0">
                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeRequest.status === 'Pending' ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                                                    <span className={`relative inline-flex rounded-full h-4 w-4 ${activeRequest.status === 'Pending' ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-4 mt-6 text-sm font-bold text-muted-foreground items-center">
                                                <span className="bg-background/50 px-3 py-1 rounded-lg border border-blue-500/10">Status: <span className="text-blue-500 uppercase tracking-wider">{activeRequest.status}</span></span>
                                                <span className="bg-background/50 px-3 py-1 rounded-lg border border-blue-500/10">Est. Price: ₹{activeRequest.pricing?.totalAmount || '0'}</span>
                                                <span className="ml-auto text-xs text-blue-500 flex items-center gap-1 font-black tracking-wide">
                                                    TAP TO TRACK <ChevronRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Category Selection & Service Flow */}
                                <div className="mb-10 transition-all duration-500">
                                    {!wizardCategory ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                            <button
                                                onClick={() => setWizardCategory('Fuel Delivery')}
                                                className="group relative p-8 rounded-[2rem] bg-white dark:bg-card/60 border border-border hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 hover:scale-[1.02] transition-all flex flex-col items-center gap-5 overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-amber-500/20 transition-colors"></div>
                                                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform">
                                                    <Fuel className="w-10 h-10" />
                                                </div>
                                                <div className="text-center relative z-10">
                                                    <h3 className="text-2xl font-black mb-1 tracking-tight text-foreground">Fuel Delivery</h3>
                                                    <p className="text-muted-foreground font-medium">Petrol or Diesel delivered to you</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => setWizardCategory('Mechanic')}
                                                className="group relative p-8 rounded-[2rem] bg-white dark:bg-card/60 border border-border hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02] transition-all flex flex-col items-center gap-5 overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-colors"></div>
                                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                                                    <Wrench className="w-10 h-10" />
                                                </div>
                                                <div className="text-center relative z-10">
                                                    <h3 className="text-2xl font-black mb-1 tracking-tight text-foreground">Mechanic Service</h3>
                                                    <p className="text-muted-foreground font-medium">Repairs, Towing, & Maintenance</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => setWizardCategory('EV Support')}
                                                className="group relative p-8 rounded-[2rem] bg-white dark:bg-card/60 border border-border hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/10 hover:scale-[1.02] transition-all flex flex-col items-center gap-5 overflow-hidden md:col-span-2 lg:col-span-1"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-green-500/20 transition-colors"></div>
                                                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform">
                                                    <Zap className="w-10 h-10" />
                                                </div>
                                                <div className="text-center relative z-10">
                                                    <h3 className="text-2xl font-black mb-1 tracking-tight text-foreground">EV Support</h3>
                                                    <p className="text-muted-foreground font-medium">Charging, Towing & EV Care</p>
                                                </div>
                                            </button>
                                        </div>

                                    ) : (
                                        <div className="max-w-4xl mx-auto">
                                            <button
                                                onClick={() => setWizardCategory(null)}
                                                className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 font-bold mb-8 transition-colors text-lg"
                                            >
                                                <ChevronLeft className="w-6 h-6" /> Back to Categories
                                            </button>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-6"
                                            >
                                                <h3 className="text-2xl font-black flex items-center gap-3">
                                                    {wizardCategory === 'Fuel Delivery' && <Fuel className="w-8 h-8 text-yellow-500" />}
                                                    {wizardCategory === 'Mechanic' && <Wrench className="w-8 h-8 text-blue-500" />}
                                                    {wizardCategory === 'EV Support' && <Zap className="w-8 h-8 text-green-500" />}
                                                    Select {wizardCategory === 'Fuel Delivery' ? 'Fuel Type' : 'Service'}
                                                </h3>

                                                {wizardCategory === 'Fuel Delivery' ? (
                                                    <div className="grid grid-cols-2 gap-6">
                                                        {['Petrol', 'Diesel'].map((fuelType) => (
                                                            <button
                                                                key={fuelType}
                                                                onClick={() => {
                                                                    setSelectedServiceForWizard([{
                                                                        name: fuelType,
                                                                        icon: <Fuel className="w-6 h-6" />,
                                                                        color: 'from-orange-500 to-yellow-500'
                                                                    }]);
                                                                }}
                                                                className="p-8 rounded-3xl bg-card border border-border hover:border-blue-500 transition-all group flex flex-col items-center justify-center gap-4 shadow-xl"
                                                            >
                                                                <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                                    <div className="text-3xl font-black">{fuelType[0]}</div>
                                                                </div>
                                                                <h3 className="text-2xl font-black">{fuelType}</h3>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                        {getFilteredServices().map((s, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleServiceClick(s.name)}
                                                                className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-card border border-border/50 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-center group"
                                                            >
                                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${s.color.replace('text-', 'bg-').replace('bg-', '')} shadow-lg group-hover:scale-110 transition-transform`}>
                                                                    {s.icon}
                                                                </div>
                                                                <span className="font-bold text-lg">{s.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* --- VIEW: TRACKING --- */}
                        {currentView === 'tracking' && activeRequest && (
                            <motion.div
                                key="tracking"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="h-full flex flex-col gap-4"
                            >
                                {/* Tracking Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2.5 py-1 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md animate-pulse">Live</span>
                                            <span className="text-xs font-medium text-muted-foreground">ID: {activeRequest._id?.slice(-6)}</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-foreground">Live Tracking</h2>
                                    </div>
                                    {activeRequest.provider && (
                                        <a
                                            href={`tel:${activeRequest.assignedPerson?.phone || activeRequest.provider.phone}`}
                                            className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-xl transition-all font-semibold shadow-md"
                                        >
                                            <Phone className="w-4 h-4" />
                                            <span>Call {activeRequest.assignedPerson?.name ? 'Technician' : 'Provider'}</span>
                                        </a>
                                    )}
                                </div>

                                {/* Service OTP Display Card */}
                                {activeRequest?.serviceOtp && !activeRequest?.otpVerified && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-card border border-border rounded-xl"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                    <Lock className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">Service OTP</p>
                                                    <p className="text-xs text-muted-foreground">Share with provider on arrival</p>
                                                </div>
                                            </div>
                                            <div className="text-2xl font-bold tracking-widest text-blue-500 font-mono bg-blue-500/5 px-4 py-2 rounded-lg border border-blue-500/20">
                                                {activeRequest.serviceOtp}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* OTP Verified Badge */}
                                {activeRequest?.otpVerified && (
                                    <motion.div
                                        initial={{ scale: 0.95 }}
                                        animate={{ scale: 1 }}
                                        className="p-4 bg-card border border-border rounded-xl flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-600 dark:text-green-400">Identity Verified</p>
                                            <p className="text-xs text-muted-foreground">Service OTP confirmed</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Map Container */}
                                <div className={`${isFullscreen ? 'fixed inset-0 z-[100] m-0 rounded-none h-screen' : 'h-[65vh] w-full relative rounded-xl'} overflow-hidden border border-border bg-black transition-all duration-300`}>
                                    {/* Map Controls */}
                                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                                        <button
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            className="p-2.5 bg-card/90 backdrop-blur-sm text-foreground rounded-lg border border-border hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all"
                                            title="Toggle Fullscreen"
                                        >
                                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newMode = !isChaseMode;
                                                setIsChaseMode(newMode);
                                                if (!newMode && providerLocation) {
                                                    setMapCenter(providerLocation);
                                                }
                                            }}
                                            className={`p-2.5 backdrop-blur-sm rounded-lg border transition-all ${isChaseMode ? 'bg-blue-500 text-white border-blue-500' : 'bg-card/90 text-foreground border-border hover:bg-blue-500 hover:text-white hover:border-blue-500'}`}
                                            title="Toggle Chase Mode"
                                        >
                                            <Compass className={`w-5 h-5 ${isChaseMode ? 'animate-spin-slow' : ''}`} />
                                        </button>
                                    </div>

                                    {/* Status Badge */}
                                    {providerLocation && (
                                        <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 bg-card/95 backdrop-blur-sm p-3 rounded-xl border border-border z-10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                                                    <NavIcon className="w-4 h-4 text-green-500 fill-current" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{activeRequest?.assignedPerson?.name || activeRequest?.provider?.name || 'Service Person'} On Route</p>
                                                    <p className="text-[10px] text-muted-foreground">{isChaseMode ? 'Chase Mode' : 'Free View'}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">
                                                {providerLocation.speed ? `${Math.round(providerLocation.speed)} km/h` : 'Moving'}
                                            </span>
                                        </div>
                                    )}

                                    <MapComponent
                                        center={isChaseMode && providerLocation ? providerLocation : (mapCenter || location)}
                                        zoom={isChaseMode ? 19 : mapZoom}
                                        heading={isChaseMode && providerLocation?.heading ? providerLocation.heading : 0}
                                        tilt={isChaseMode ? 45 : 0}
                                        showControls={true}
                                        forceDark={theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)}
                                        customDarkStyle={UBER_STYLE}
                                        options={{
                                            disableDefaultUI: true,
                                        }}
                                        mapContainerStyle={{ height: "100%", width: "100%" }} // Explicitly set height
                                        onIdle={(center) => {
                                            if (!isChaseMode && center) {
                                                setMapCenter(center);
                                            }
                                        }}
                                    >
                                        <Marker position={location} icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }} />
                                        {activeRequest && providerLocation && (
                                            <Marker
                                                position={providerLocation}
                                                icon={{
                                                    ...CAR_SYMBOL,
                                                    rotation: providerLocation?.heading || 0
                                                }}
                                                title="Your Provider"
                                            />
                                        )}
                                    </MapComponent>
                                </div>

                                {/* Bill Received Card */}
                                {receivedBill && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card border border-border rounded-xl p-5"
                                    >
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <IndianRupee className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground">Bill Ready</h3>
                                                <p className="text-xs text-muted-foreground">Review and pay to complete</p>
                                            </div>
                                            <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${activeRequest.category === 'Fuel Delivery' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                                                {activeRequest.category}
                                            </span>
                                        </div>

                                        {/* Bill Breakdown */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-muted-foreground text-sm">Base Fee</span>
                                                <span className="font-semibold">₹{receivedBill.baseFee || 0}</span>
                                            </div>

                                            {receivedBill.distanceFee > 0 && (
                                                <div className="flex justify-between items-center py-2 border-t border-border/50">
                                                    <span className="text-muted-foreground text-sm">
                                                        Distance ({receivedBill.distanceMetric ? `${receivedBill.distanceMetric.toFixed(1)} km` : ''})
                                                    </span>
                                                    <span className="font-semibold">₹{Math.round(receivedBill.distanceFee)}</span>
                                                </div>
                                            )}

                                            {activeRequest.category === 'Fuel Delivery' && activeRequest.fuelDetails && (
                                                <div className="py-2 border-t border-border/50">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-muted-foreground text-sm flex items-center gap-1">
                                                            <Fuel className="w-3 h-3" />
                                                            Fuel ({activeRequest.fuelDetails.fuelType})
                                                        </span>
                                                        <span className="font-semibold">₹{Math.round((activeRequest.fuelDetails.quantity || 0) * (activeRequest.fuelDetails.rate || 0))}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground text-right">
                                                        {activeRequest.fuelDetails.quantity}L × ₹{activeRequest.fuelDetails.rate}/L
                                                    </p>
                                                </div>
                                            )}

                                            {activeRequest.category === 'Mechanic' && receivedBill.bill?.length > 0 && (
                                                <div className="pt-2 border-t border-border/50">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Materials & Parts</p>
                                                    {receivedBill.bill.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center py-1.5">
                                                            <span className="text-foreground text-sm">{item.name}</span>
                                                            <span className="font-semibold">₹{item.cost}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Total */}
                                        <div className="flex justify-between items-center text-lg font-bold text-blue-500 py-3 border-t border-border">
                                            <span>Total</span>
                                            <span>₹{receivedBill.totalAmount}</span>
                                        </div>

                                        {/* Pay Now Button */}
                                        <button
                                            onClick={handlePayBill}
                                            disabled={paymentProcessing}
                                            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
                                        >
                                            {paymentProcessing ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Wallet className="w-5 h-5" />
                                                    Pay ₹{receivedBill.totalAmount}
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* --- VIEW: HISTORY --- */}
                        {currentView === 'history' && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="pb-20"
                            >
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black mb-2">Service History</h2>
                                    <p className="text-muted-foreground">Your past requests and services</p>
                                </div>

                                {historyLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : requestHistory.length === 0 ? (
                                    <div className="text-center py-20 bg-card/50 rounded-[2.5rem] border border-border/50">
                                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <History className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">No History Yet</h3>
                                        <p className="text-muted-foreground">You haven't requested any services yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {requestHistory.map((req) => (
                                            <div key={req._id} className="bg-card border border-border/50 p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-xl hover:border-blue-500/20 transition-all">
                                                {/* Provider Info */}
                                                <div className="flex items-center gap-4 min-w-[200px]">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center overflow-hidden border border-border">
                                                        {req.provider?.photoUrl ? (
                                                            <img src={req.provider.photoUrl} alt={req.provider.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-8 h-8 text-blue-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">{req.provider?.name || 'Provider'}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(req.timestamps?.createdAt || req.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                {/* Status & ID */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${req.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                            req.status === 'Cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                                'bg-gray-500/10 text-gray-500'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-mono">#{req._id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                </div>

                                                {/* Cost */}
                                                <div className="text-right min-w-[120px]">
                                                    <p className="text-sm text-muted-foreground font-medium mb-1">Total Paid</p>
                                                    <p className="text-2xl font-black text-blue-500">₹{req.pricing?.totalAmount || 0}</p>
                                                </div>

                                                {/* Receipt Button */}
                                                {req.status === 'Completed' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setReceiptData({
                                                                requestData: {
                                                                    requestId: req._id,
                                                                    serviceTypes: req.serviceTypes,
                                                                    pricing: req.pricing,
                                                                    bill: req.bill,
                                                                    location: req.location,
                                                                    paymentCompletedAt: req.paymentCompletedAt
                                                                },
                                                                paymentId: req.paymentId || 'N/A',
                                                                customerName: user.name,
                                                                providerId: req.provider?._id,
                                                                providerName: req.provider?.name || 'Service Provider',
                                                                isHistory: true
                                                            });
                                                            setShowReceipt(true);
                                                        }}
                                                        className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 font-bold text-sm transition-colors border border-border/50"
                                                    >
                                                        Receipt
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Request Wizard Modal */}
                    <AnimatePresence>
                        {selectedServiceForWizard && (
                            <RequestHelpWizard
                                category={wizardCategory || 'Mechanic'}
                                services={selectedServiceForWizard}
                                availableServices={getFilteredServices()}
                                userLocation={location}
                                onCancel={() => {
                                    setSelectedServiceForWizard(null);
                                    setWizardCategory(null);
                                    setIsMapMode(false);
                                }}
                                onSuccess={handleWizardSuccess}
                                onMapMode={(active) => setIsMapMode(active)}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </main >

            {activeRequest && ['Accepted', 'Arrived'].includes(activeRequest.status) && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-32 right-6 z-50 bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-2xl border-2 border-blue-500/20 flex flex-col items-center gap-1 backdrop-blur-xl"
                >
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Share OTP</span>
                    <div className="text-3xl font-black text-blue-500 tracking-[0.2em] font-mono">
                        {activeRequest.serviceOtp || '----'}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center max-w-[120px]">
                        Share this code with provider when they arrive.
                    </p>
                </motion.div>
            )}

            {activeRequest && socket && ['Accepted', 'Arrived', 'In Progress'].includes(activeRequest.status) && (
                <LiveChat
                    socket={socket}
                    roomId={activeRequest._id}
                    userName={user.name}
                    role="customer"
                    recipientName={activeRequest.provider?.name || 'Provider'}
                />
            )}

            {/* BILL RECEIPT MODAL (PAYMENT) */}
            <AnimatePresence>
                {receivedBill && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card w-full max-w-md rounded-[2.5rem] border border-blue-500/20 shadow-2xl overflow-hidden relative"
                        >
                            <div className="p-8">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 animate-bounce-slow">
                                        <IndianRupee className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Bill Received</h2>
                                    <p className="text-muted-foreground font-medium">from {receivedBill.providerName}</p>
                                </div>

                                <div className="space-y-4 mb-8 bg-secondary/30 p-6 rounded-2xl border border-border/50">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Base Fee</span>
                                        <span className="font-bold">₹{receivedBill.baseFee}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Distance Fee ({receivedBill.distance || 0} km)</span>
                                        <span className="font-bold">₹{receivedBill.distanceFee}</span>
                                    </div>

                                    <div className="py-2 border-y border-dashed border-border/50 space-y-2">
                                        <div className="flex justify-between font-bold text-sm">
                                            <span>Service/Material Cost</span>
                                            <span>₹{receivedBill.materialsCost}</span>
                                        </div>
                                        {/* Itemized List */}
                                        {receivedBill.bill && receivedBill.bill.length > 0 && (
                                            <div className="pl-2 space-y-1">
                                                {receivedBill.bill.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                                                        <span>{item.name}</span>
                                                        <span>₹{item.cost}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-end pt-2">
                                        <span className="font-bold text-lg">Total Payable</span>
                                        <span className="font-black text-3xl text-blue-500">₹{receivedBill.totalAmount}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayBill}
                                    disabled={paymentProcessing}
                                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {paymentProcessing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Pay Securely <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Announcement Modal */}
            <AnimatePresence>
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
            </AnimatePresence>

            {/* Receipt Modal */}
            <AnimatePresence>
                {showReceipt && receiptData && (
                    <Receipt
                        isOpen={showReceipt}
                        onClose={() => {
                            setShowReceipt(false);
                            // Trigger feedback ONLY if not viewing history
                            if (!receiptData.isHistory) {
                                setFeedbackData({
                                    requestId: receiptData.requestData?.requestId,
                                    reviewerId: user?._id,
                                    reviewerType: 'User',
                                    revieweeId: receiptData.providerId,
                                    revieweeType: 'Provider',
                                    revieweeName: receiptData.providerName || 'Service Provider',
                                    serviceTypes: receiptData.requestData?.serviceTypes || []
                                });
                                setShowFeedback(true);
                            }
                            setReceiptData(null);
                        }}
                        requestData={receiptData.requestData}
                        paymentId={receiptData.paymentId}
                        customerName={receiptData.customerName}
                        providerName={receiptData.providerName}
                    />
                )}
            </AnimatePresence>

            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedback && feedbackData && (
                    <FeedbackModal
                        isOpen={showFeedback}
                        onClose={() => {
                            setShowFeedback(false);
                            setFeedbackData(null);
                            // Clear active request and redirect to fresh request help page
                            setActiveRequest(null);
                            navigate('/dashboard');
                        }}
                        requestId={feedbackData.requestId}
                        reviewerId={feedbackData.reviewerId}
                        reviewerType={feedbackData.reviewerType}
                        revieweeId={feedbackData.revieweeId}
                        revieweeType={feedbackData.revieweeType}
                        revieweeName={feedbackData.revieweeName}
                        serviceTypes={feedbackData.serviceTypes}
                        onSubmitSuccess={() => {
                            // After successful feedback, clear request and redirect
                            setActiveRequest(null);
                            setTimeout(() => navigate('/dashboard'), 1500); // Small delay for animation
                        }}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};

export default Dashboard;
