import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Wrench, Settings, LogOut, Search, Filter, CheckCircle, XCircle, MoreVertical, Star, Shield, ShieldCheck, AlertTriangle, TrendingUp, DollarSign, Activity, Calendar, FileText, ChevronRight, ChevronLeft, Edit2, Save, X, Plus, Megaphone, Menu, RefreshCw, Trash2, MapPin, Clock, Send, ShieldAlert, Mail } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { useTheme } from '../components/theme-provider';
import { ModeToggle } from '../components/mode-toggle';
import MapComponent from '../components/GoogleMaps/MapComponent';
import { Marker } from '@react-google-maps/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const ITEMS_PER_PAGE = 6;

const AdminDashboard = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Data State
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ totalUsers: 0, pending: 0, verified: 0 });
    const [pendingProviders, setPendingProviders] = useState([]);
    const [verifiedProviders, setVerifiedProviders] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    // Pagination State
    const [pendingPage, setPendingPage] = useState(1);
    const [verifiedPage, setVerifiedPage] = useState(1);
    const [usersPage, setUsersPage] = useState(1);

    // New Features Data
    const [growthData, setGrowthData] = useState([]);
    const [serviceRates, setServiceRates] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', target: 'all' });
    const [allReviews, setAllReviews] = useState([]);
    const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 'provider', 'user'

    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [updateRequest, setUpdateRequest] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [newServiceCategory, setNewServiceCategory] = useState('Mechanic'); // 'Mechanic' | 'Fuel Delivery' | 'EV Support'
    const [searchTerm, setSearchTerm] = useState(''); // Search State

    // Initial Load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'admin') {
            alert("Access Denied.");
            navigate('/dashboard');
            return;
        }
        setUser(parsedUser);
        fetchAllData();
    }, [navigate]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [pendingRes, verifiedRes, usersRes, analyticsRes, pricingRes, broadcastRes, reviewsRes] = await Promise.all([
                api.get('/api/auth/admin/pending-providers'),
                api.get('/api/auth/admin/verified-providers'),
                api.get('/api/auth/admin/users'),
                api.get('/api/admin-features/analytics'),
                api.get('/api/admin-features/pricing'),
                api.get('/api/admin-features/announcements'),
                api.get('/api/review/admin/all')
            ]);

            setPendingProviders(pendingRes.data);
            setVerifiedProviders(verifiedRes.data);
            setAllUsers(usersRes.data);

            // Sync Counts
            setStats({
                pending: pendingRes.data.length,
                verified: verifiedRes.data.length,
                totalUsers: usersRes.data.length
            });

            // New Features
            setGrowthData(analyticsRes.data.growthData);
            setServiceRates(pricingRes.data);
            setAnnouncements(broadcastRes.data);
            setAllReviews(reviewsRes.data.reviews || []);

        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleVerifyProvider = async (userId) => {
        if (!window.confirm("Verify this provider?")) return;
        try {
            await api.put('/api/auth/admin/verify', { userId });
            toast.success("Provider Verified Successfully");
            fetchAllData();
            setSelectedProvider(null);
        } catch (err) {
            toast.error("Failed to verify provider");
        }
    };

    const handleRevokeProvider = async (userId) => {
        console.log("Revoking provider with ID:", userId);
        if (!window.confirm("Are you sure you want to revoke verification?")) return;
        try {
            const res = await api.put('/api/auth/admin/revoke', { userId });
            console.log("Revoke response:", res.data);
            toast.success("Verification Revoked");
            fetchAllData();
        } catch (err) {
            console.error("Revoke error:", err);
            toast.error("Failed to revoke verification: " + (err.response?.data?.message || err.message));
        }
    };

    const handleRejectProvider = async (userId) => {
        if (!window.confirm("Are you sure you want to reject this provider application? This cannot be undone.")) return;
        try {
            await api.delete('/api/auth/admin/reject', { data: { userId } });
            toast.success("Application Rejected");
            fetchAllData();
            setSelectedProvider(null);
        } catch (err) {
            toast.error("Failed to reject application");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
        try {
            await api.delete('/api/auth/admin/delete-user', { data: { userId } });
            toast.success("User Deleted Successfully");
            fetchAllData();
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    const handleUpdateService = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const updatedService = {
            serviceName: formData.get('serviceName'),
            description: formData.get('description'),
            basePrice: formData.get('basePrice'),
            pricePerKm: formData.get('pricePerKm'),
            category: editingService.category,
            pricePerLitre: formData.get('pricePerLitre') || 0,
            fuelType: editingService.category === 'Fuel Delivery' ? formData.get('serviceName') : null
        };

        try {
            const res = await api.put(`/api/admin-features/pricing/${editingService._id}`, updatedService);
            const updatedRates = serviceRates.map(r => r._id === editingService._id ? res.data : r);
            setServiceRates(updatedRates);
            setEditingService(null);
            toast.success("Service Updated");
        } catch (err) {
            alert("Failed to update service");
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const category = formData.get('category');
        const serviceName = formData.get('serviceName'); // Used as Fuel Type for Fuel Category

        const newService = {
            serviceName: serviceName,
            category: category,
            fuelType: category === 'Fuel Delivery' ? serviceName : null,
            basePrice: formData.get('basePrice'),
            pricePerKm: formData.get('pricePerKm') || 0,
            pricePerLitre: formData.get('pricePerLitre') || 0,
            description: formData.get('description')
        };

        try {
            const res = await api.post('/api/admin-features/pricing', newService);
            setServiceRates([...serviceRates, res.data]);
            e.target.reset();
        } catch (err) {
            alert("Failed to add service");
        }
    };

    const handleApproveUpdate = async (providerId) => {
        if (!window.confirm("Approve these changes?")) return;
        try {
            console.log('[handleApproveUpdate] Approving update for provider:', providerId);
            const response = await api.put('/api/auth/admin/approve-update', { userId: providerId });
            console.log('[handleApproveUpdate] Backend response:', response.data);

            // Refetch verified providers to get the latest data from server
            const { data } = await api.get('/api/auth/admin/verified-providers');
            setVerifiedProviders(data);

            setUpdateRequest(null);
            alert("Update Approved Successfully! ✅");
        } catch (err) {
            console.error('[handleApproveUpdate] Error:', err);
            console.error('[handleApproveUpdate] Error response:', err.response?.data);
            alert(`Failed to approve: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleRejectUpdate = async (providerId) => {
        if (!window.confirm("Reject these changes?")) return;
        try {
            console.log('[handleRejectUpdate] Rejecting update for provider:', providerId);
            const response = await api.put('/api/auth/admin/reject-update', { userId: providerId });
            console.log('[handleRejectUpdate] Backend response:', response.data);

            // Refetch verified providers to get the latest data from server
            const { data } = await api.get('/api/auth/admin/verified-providers');
            setVerifiedProviders(data);

            setUpdateRequest(null);
            alert("Update Rejected");
        } catch (err) {
            console.error('[handleRejectUpdate] Error:', err);
            console.error('[handleRejectUpdate] Error response:', err.response?.data);
            alert(`Failed to reject: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm("Delete this service? This will affect new provider registrations.")) return;
        try {
            await api.delete(`/api/admin-features/pricing/${id}`);
            setServiceRates(serviceRates.filter(r => r._id !== id));
        } catch (err) {
            alert("Failed to delete service");
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin-features/announcements', newAnnouncement);
            setNewAnnouncement({ title: '', message: '', target: 'all' });
            await fetchAllData();
            toast.success("Broadcast Sent! 📢");
        } catch (err) {
            toast.error("Broadcast Failed");
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;

        try {
            await api.delete(`/api/admin-features/announcements/${id}`);
            // Optimistic update
            setAnnouncements(prev => prev.filter(a => a._id !== id));
            toast.success("Announcement Deleted");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete announcement");
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden relative selection:bg-blue-500/30">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
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
            <aside className={`fixed ${selectedProvider ? 'lg:hidden' : 'lg:static'} inset-y-0 left-0 w-80 !bg-white dark:!bg-card/50 !backdrop-blur-none dark:!backdrop-blur-2xl border-r border-border z-50 transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
                <div className="p-8 pb-4 bg-white dark:bg-transparent">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
                            <ShieldCheck className="w-6 h-6 fill-current" />
                        </div>
                        <div className="text-2xl font-black tracking-tighter">
                            Fuel<span className="text-blue-500">N</span>Fix <span className="text-xs align-top bg-orange-500/10 text-orange-500 px-1 py-0.5 rounded ml-1">ADMIN</span>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <button onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-accent/50 text-foreground/80'}`}>
                            <LayoutDashboard className="w-5 h-5 opacity-90" /> Overview
                        </button>
                        <button onClick={() => { setActiveTab('pricing'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === 'pricing' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-accent/50 text-foreground/80'}`}>
                            <Settings className="w-5 h-5 opacity-90" /> Services & Pricing
                        </button>
                        <button onClick={() => { setActiveTab('broadcast'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === 'broadcast' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-accent/50 text-foreground/80'}`}>
                            <Megaphone className="w-5 h-5 opacity-90" /> Broadcasts
                        </button>

                        <div className="pt-6 pb-2 pl-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Management</div>

                        <button onClick={() => { setActiveTab('pending'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all group ${activeTab === 'pending' ? 'bg-accent/80' : 'hover:bg-accent/50 text-foreground/80'}`}>
                            <AlertTriangle className={`w-5 h-5 ${activeTab === 'pending' ? 'text-orange-500' : 'text-muted-foreground group-hover:text-orange-500'}`} />
                            Pending Requests
                            {stats.pending > 0 && <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.pending}</span>}
                        </button>

                        <button onClick={() => { setActiveTab('verified'); setSidebarOpen(false); setSearchTerm(''); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all group ${activeTab === 'verified' ? 'bg-accent/80' : 'hover:bg-accent/50 text-foreground/80'}`}>
                            <CheckCircle className={`w-5 h-5 ${activeTab === 'verified' ? 'text-green-500' : 'text-muted-foreground group-hover:text-green-500'}`} />
                            Verified Providers
                        </button>

                        <button onClick={() => { setActiveTab('users'); setSidebarOpen(false); setSearchTerm(''); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all group ${activeTab === 'users' ? 'bg-accent/80' : 'hover:bg-accent/50 text-foreground/80'}`}>
                            <Users className={`w-5 h-5 ${activeTab === 'users' ? 'text-blue-500' : 'text-muted-foreground group-hover:text-blue-500'}`} />
                            User Management
                        </button>

                        <button onClick={() => { setActiveTab('reviews'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all group ${activeTab === 'reviews' ? 'bg-accent/80' : 'hover:bg-accent/50 text-foreground/80'}`}>
                            <Star className={`w-5 h-5 ${activeTab === 'reviews' ? 'text-yellow-500' : 'text-muted-foreground group-hover:text-yellow-500'}`} />
                            Reviews & Ratings
                            {allReviews.length > 0 && <span className="ml-auto bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{allReviews.length}</span>}
                        </button>
                    </nav>
                </div>

                {/* White spacer to fill the gap */}
                <div className="flex-1 bg-white dark:bg-transparent"></div>

                <div className="p-6 border-t border-border/50 bg-white dark:bg-background/20">
                    <button
                        onClick={() => {
                            localStorage.removeItem('user');
                            navigate('/login');
                            toast.success("Logged out successfully");
                        }}
                        className="w-full flex items-center justify-center gap-2 text-sm text-foreground/70 font-bold hover:bg-accent/10 p-3.5 rounded-2xl transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Exit Admin Mode
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 w-full p-4 lg:p-10">
                <header className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-card border border-border text-foreground"><Menu className="w-6 h-6" /></button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                                <span className="capitalize">{activeTab}</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchAllData} className="p-2.5 rounded-full hover:bg-accent transition-colors"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                        <ModeToggle />
                    </div>
                </header>

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-8 rounded-[2.5rem] relative overflow-hidden shadow-lg shadow-blue-500/5">
                                <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <h3 className="text-4xl font-black mb-1 relative z-10">{stats.totalUsers}</h3>
                                <p className="text-muted-foreground font-bold uppercase tracking-wider text-sm relative z-10">Total Users</p>
                                <Users className="absolute bottom-[-20px] right-[-20px] w-32 h-32 opacity-5" />
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-8 rounded-[2.5rem] relative overflow-hidden shadow-lg shadow-orange-500/5">
                                <div className="absolute top-0 right-0 p-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <h3 className="text-4xl font-black mb-1 text-orange-500 relative z-10">{stats.pending}</h3>
                                <p className="text-orange-500/80 font-bold uppercase tracking-wider text-sm relative z-10">Pending Verification</p>
                                <AlertTriangle className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-orange-500 opacity-10" />
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-8 rounded-[2.5rem] relative overflow-hidden shadow-lg shadow-green-500/5">
                                <div className="absolute top-0 right-0 p-32 bg-green-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                                <h3 className="text-4xl font-black mb-1 text-green-500 relative z-10">{stats.verified}</h3>
                                <p className="text-green-500/80 font-bold uppercase tracking-wider text-sm relative z-10">Active Providers</p>
                                <ShieldCheck className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-green-500 opacity-10" />
                            </motion.div>
                        </div>

                        {/* Chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-8 rounded-[2.5rem] h-[400px] relative overflow-hidden shadow-lg shadow-blue-500/5">
                            <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <h3 className="text-xl font-bold mb-6 relative z-10">Platform Growth</h3>
                            <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="users" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                    <Area type="monotone" dataKey="providers" stroke="#22c55e" strokeWidth={3} fillOpacity={0.1} fill="#22c55e" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>
                )}

                {/* --- PRICING TAB --- */}
                {activeTab === 'pricing' && (
                    <div className="space-y-10">
                        {/* Add Service Check */}
                        <div className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 relative z-10">
                                <Settings className="w-6 h-6 text-blue-500" /> Add New Service
                            </h3>
                            <form onSubmit={handleAddService} className="space-y-6">
                                {/* Category Toggle */}
                                <div className="flex bg-background/50 p-1 rounded-2xl border border-border w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setNewServiceCategory('Mechanic')}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${newServiceCategory === 'Mechanic' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Mechanic Service
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewServiceCategory('EV Support')}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${newServiceCategory === 'EV Support' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        EV Support
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewServiceCategory('Fuel Delivery')}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${newServiceCategory === 'Fuel Delivery' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Fuel Delivery
                                    </button>
                                </div>
                                <input type="hidden" name="category" value={newServiceCategory} />

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    {newServiceCategory === 'Fuel Delivery' ? (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Fuel Type</label>
                                            <select name="serviceName" className="w-full h-12 rounded-xl bg-background border border-border px-4 font-bold outline-none focus:border-blue-500">
                                                <option value="Petrol">Petrol</option>
                                                <option value="Diesel">Diesel</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Service Name</label>
                                            <input name="serviceName" required placeholder="e.g. Oil Change" className="w-full h-12 rounded-xl bg-background border border-border px-4 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                    )}

                                    {newServiceCategory === 'Mechanic' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Base Price (₹)</label>
                                            <input name="basePrice" type="number" required placeholder="0" className="w-full h-12 rounded-xl bg-background border border-border px-4 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                    )}
                                    {newServiceCategory === 'EV Support' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Base Price (₹)</label>
                                            <input name="basePrice" type="number" required placeholder="0" className="w-full h-12 rounded-xl bg-background border border-border px-4 font-bold outline-none focus:border-green-500" />
                                        </div>
                                    )}
                                    {/* Hidden Base Price for Fuel (0) */}
                                    {newServiceCategory === 'Fuel Delivery' && <input type="hidden" name="basePrice" value="0" />}

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Per KM Charge (₹)</label>
                                        <input name="pricePerKm" type="number" required placeholder="0" className="w-full h-12 rounded-xl bg-background border border-border px-4 font-bold outline-none focus:border-blue-500" />
                                    </div>

                                    {newServiceCategory === 'Fuel Delivery' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Per Litre Charge (₹)</label>
                                            <input name="pricePerLitre" type="number" required placeholder="0" className="w-full h-12 rounded-xl bg-background border border-border px-4 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                    )}

                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</label>
                                        <input name="description" required placeholder="Short description" className="w-full h-12 rounded-xl bg-background border border-border px-4 font-medium outline-none focus:border-blue-500" />
                                    </div>

                                    <button type="submit" className="h-12 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all lg:col-span-1">
                                        Add Service
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {serviceRates.map((rate, i) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                    key={rate._id}
                                    className={`bg-gradient-to-br border p-6 rounded-[2rem] hover:shadow-xl transition-all group relative overflow-hidden ${rate.category === 'EV Support'
                                        ? 'from-green-500/5 to-emerald-500/5 border-green-500/20 hover:shadow-green-500/5'
                                        : 'from-card/60 to-background border-border/50 hover:shadow-blue-500/5'
                                        }`}
                                >
                                    {/* Decorator */}
                                    <div className={`absolute top-0 right-0 p-32 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none ${rate.category === 'EV Support' ? 'bg-green-500/5' : 'bg-blue-500/5'}`}></div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${rate.category === 'EV Support' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {rate.category === 'EV Support' ? <Settings className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingService(rate)}
                                                    className="p-2.5 bg-background border border-border rounded-xl text-muted-foreground hover:text-blue-500 hover:border-blue-500/30 transition-all shadow-sm"
                                                    title="Edit Service"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteService(rate._id)}
                                                    className="p-2.5 bg-background border border-border rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all shadow-sm"
                                                    title="Delete Service"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black mb-2 tracking-tight">{rate.serviceName}</h3>
                                        <p className="text-sm text-muted-foreground font-medium mb-6 line-clamp-2 h-10 leading-relaxed">{rate.description}</p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-background/50 p-3 rounded-2xl border border-border/50">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                                    {rate.category === 'Fuel Delivery' ? 'Delivery Fee' : 'Base Rate'}
                                                </label>
                                                <div className="text-lg font-black text-foreground">₹{rate.basePrice}</div>
                                            </div>
                                            {rate.category === 'Fuel Delivery' ? (
                                                <div className="bg-background/50 p-3 rounded-2xl border border-border/50">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Per Litre</label>
                                                    <div className="text-lg font-black text-foreground">₹{rate.pricePerLitre || 0}</div>
                                                </div>
                                            ) : (
                                                <div className="bg-background/50 p-3 rounded-2xl border border-border/50">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Per KM Rate</label>
                                                    <div className="text-lg font-black text-foreground">₹{rate.pricePerKm}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- EDIT SERVICE MODAL --- */}
                <AnimatePresence>
                    {editingService && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card border border-border p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative">
                                <button onClick={() => setEditingService(null)} className="absolute top-6 right-6 p-2 hover:bg-accent rounded-full"><XCircle className="w-6 h-6" /></button>

                                <h3 className="text-2xl font-black mb-6">Edit Service</h3>
                                <form onSubmit={handleUpdateService} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Category</label>
                                            <input name="category" disabled value={editingService.category || 'Mechanic'} className="w-full h-12 bg-accent/50 border border-border rounded-xl px-4 font-bold outline-none text-muted-foreground cursor-not-allowed" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Service Name</label>
                                            <input name="serviceName" required defaultValue={editingService.serviceName} className="w-full h-12 bg-background border border-border rounded-xl px-4 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2">Description</label>
                                        <input name="description" required defaultValue={editingService.description} className="w-full h-12 bg-background border border-border rounded-xl px-4 font-medium outline-none focus:border-blue-500" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-2">{editingService.category === 'Fuel Delivery' ? 'Delivery Fee (₹)' : 'Base Price (₹)'}</label>
                                            <input name="basePrice" type="number" required defaultValue={editingService.basePrice} className="w-full h-12 bg-background border border-border rounded-xl px-4 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Per KM Rate (₹)</label>
                                            <input name="pricePerKm" type="number" required defaultValue={editingService.pricePerKm} className="w-full h-12 bg-background border border-border rounded-xl px-4 font-bold outline-none focus:border-blue-500" />
                                        </div>
                                        {editingService.category === 'Fuel Delivery' && (
                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold mb-2">Price Per Litre (₹)</label>
                                                <input name="pricePerLitre" type="number" required defaultValue={editingService.pricePerLitre} className="w-full h-12 bg-background border border-border rounded-xl px-4 font-bold outline-none focus:border-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <button type="button" onClick={() => setEditingService(null)} className="flex-1 h-12 font-bold rounded-xl hover:bg-accent transition-colors">Cancel</button>
                                        <button type="submit" className="flex-1 h-12 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- BROADCASTS TAB --- */}
                {activeTab === 'broadcast' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 relative z-10">
                                <Megaphone className="w-6 h-6 text-blue-500" /> Send Announcement
                            </h3>
                            <form onSubmit={handleBroadcast} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAnnouncement.title}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                        className="w-full h-14 bg-background border border-border rounded-xl px-4 font-medium outline-none focus:border-blue-500"
                                        placeholder="e.g. Heavy Rain Alert"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Message</label>
                                    <textarea
                                        required
                                        value={newAnnouncement.message}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                        className="w-full h-32 bg-background border border-border rounded-xl p-4 font-medium outline-none focus:border-blue-500 resize-none"
                                        placeholder="Type your alert here..."
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {['all', 'providers', 'users'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setNewAnnouncement({ ...newAnnouncement, target: t })}
                                            className={`h-12 rounded-xl font-bold uppercase text-xs tracking-wider border transition-all ${newAnnouncement.target === t ? 'bg-blue-500 text-white border-blue-500' : 'bg-background border-border hover:bg-accent'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <button type="submit" className="w-full h-14 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <Send className="w-5 h-5" /> Send Broadcast
                                </button>
                            </form>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <h3 className="text-2xl font-black mb-4 px-2">Recent Alerts</h3>
                            {announcements.map(a => (
                                <div key={a._id} className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-6 rounded-3xl hover:shadow-lg transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-16 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg">{a.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase font-bold bg-accent px-2 py-1 rounded-md">{a.target}</span>
                                                <button
                                                    onClick={() => handleDeleteAnnouncement(a._id)}
                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                    title="Delete Announcement"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground text-sm">{a.message}</p>
                                        <p className="text-xs text-muted-foreground mt-4 text-right opacity-50">{new Date(a.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {announcements.length === 0 && (
                                <div className="text-center py-20 opacity-50 font-medium">No announcements yet.</div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* --- PENDING TAB --- */}
                {activeTab === 'pending' && (
                    <div className="flex flex-col gap-5 max-w-3xl mx-auto">
                        {pendingProviders
                            .slice((pendingPage - 1) * ITEMS_PER_PAGE, pendingPage * ITEMS_PER_PAGE)
                            .map((p, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
                                    key={p._id}
                                    className="rounded-2xl flex flex-col gap-4 transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-lg"
                                >
                                    <div className="relative z-10 flex flex-col gap-4 h-full">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="w-14 h-14 rounded-xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700"
                                            >
                                                {p.verificationDocs?.shopPhoto || p.shopPhotoUrl ? (
                                                    <img src={p.verificationDocs?.shopPhoto || p.shopPhotoUrl} alt="Shop" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-lg" style={{ color: '#a1a1aa' }}>{(p.shopName && p.shopName[0]) || '?'}</div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="text-base font-bold truncate leading-tight" style={{ color: '#18181b' }}>{p.shopName}</h3>
                                                        <p className="text-sm truncate mt-0.5" style={{ color: '#71717a' }}>{p.email}</p>
                                                    </div>
                                                    <span
                                                        className="shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                        style={{ background: 'linear-gradient(to right, #f97316, #f59e0b)', color: 'white' }}
                                                    >
                                                        {p.pendingUpdate?.status === 'Pending' ? 'Update Request' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-start gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                                        >
                                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#a1a1aa' }} />
                                            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#52525b' }}>{p.address}</p>
                                        </div>

                                        <div className="flex gap-3 mt-auto">
                                            <button
                                                onClick={() => {
                                                    if (p.pendingUpdate?.status === 'Pending') {
                                                        setUpdateRequest(p);
                                                    } else {
                                                        setSelectedProvider(p);
                                                    }
                                                }}
                                                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)', color: 'white', boxShadow: '0 4px 14px -3px rgba(59,130,246,0.4)' }}
                                            >
                                                {p.pendingUpdate?.status === 'Pending' ? 'Review Update' : 'Review Application'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(p._id)}
                                                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        {pendingProviders.length === 0 && (
                            <div className="col-span-full py-20 text-center text-muted-foreground">
                                <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-lg">All caught up!</p>
                                <p>No new provider applications pending.</p>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {pendingProviders.length > ITEMS_PER_PAGE && (
                            <div className="flex items-center justify-center gap-4 mt-6">
                                <button
                                    onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                                    disabled={pendingPage === 1}
                                    className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7' }}
                                >
                                    <ChevronLeft className="w-5 h-5" style={{ color: '#52525b' }} />
                                </button>
                                <span className="text-sm font-semibold" style={{ color: '#52525b' }}>
                                    Page {pendingPage} of {Math.ceil(pendingProviders.length / ITEMS_PER_PAGE)}
                                </span>
                                <button
                                    onClick={() => setPendingPage(p => Math.min(Math.ceil(pendingProviders.length / ITEMS_PER_PAGE), p + 1))}
                                    disabled={pendingPage >= Math.ceil(pendingProviders.length / ITEMS_PER_PAGE)}
                                    className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7' }}
                                >
                                    <ChevronRight className="w-5 h-5" style={{ color: '#52525b' }} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- VERIFIED TAB --- */}
                {activeTab === 'verified' && (() => {
                    const filteredVerified = verifiedProviders.filter(p =>
                        (p.shopName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (p.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                    );
                    const totalVerifiedPages = Math.ceil(filteredVerified.length / ITEMS_PER_PAGE);
                    return (
                        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search providers by name, shop, or email..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setVerifiedPage(1); }}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500/50 rounded-2xl shadow-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                                    style={{ backgroundColor: 'white', color: 'black' }}
                                />
                            </div>

                            {filteredVerified
                                .slice((verifiedPage - 1) * ITEMS_PER_PAGE, verifiedPage * ITEMS_PER_PAGE)
                                .map((p, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
                                        key={p._id}
                                        className="rounded-2xl transition-all duration-300 group flex flex-col relative overflow-hidden hover:-translate-y-1"
                                        style={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e4e4e7',
                                            padding: '20px',
                                            boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08)'
                                        }}
                                    >
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex gap-4 mb-4">
                                                <div
                                                    className="w-16 h-16 rounded-xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700"
                                                >
                                                    {p.verificationDocs?.shopPhoto || p.shopPhotoUrl ? (
                                                        <img src={p.verificationDocs?.shopPhoto || p.shopPhotoUrl} alt={p.shopName || 'Shop'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-xl" style={{ color: '#a1a1aa' }}>{(p.shopName && p.shopName[0]) || '?'}</div>
                                                    )}
                                                </div>
                                                <div className="overflow-hidden flex-1 relative">
                                                    <div className="absolute top-0 right-0">
                                                        <span
                                                            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                                                            style={{ background: 'linear-gradient(to right, #10b981, #22c55e)', color: 'white' }}
                                                        >
                                                            <CheckCircle className="w-3 h-3" /> Verified
                                                        </span>
                                                    </div>
                                                    <div className="pr-24">
                                                        <h4 className="font-bold text-lg truncate leading-tight" style={{ color: '#18181b' }}>{p.shopName || 'Unknown Shop'}</h4>
                                                        <p className="text-sm truncate mt-0.5" style={{ color: '#71717a' }}>{p.email || 'No Email'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className="flex items-start gap-2 p-3 rounded-xl mb-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                                            >
                                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#a1a1aa' }} />
                                                <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#52525b' }}>{p.address}</p>
                                            </div>

                                            <div className="flex gap-3 mt-auto">
                                                <button
                                                    onClick={() => setSelectedProvider(p)}
                                                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)', color: 'white', boxShadow: '0 4px 14px -3px rgba(59,130,246,0.4)' }}
                                                >
                                                    View Details
                                                </button>
                                                {p.pendingUpdate?.status === 'Pending' ? (
                                                    <button
                                                        onClick={() => setUpdateRequest(p)}
                                                        className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                                                        style={{ background: 'linear-gradient(to right, #f59e0b, #eab308)', color: 'white', boxShadow: '0 4px 14px -3px rgba(245,158,11,0.4)' }}
                                                    >
                                                        <Clock className="w-4 h-4" /> Review
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRevokeProvider(p._id)}
                                                        className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            {filteredVerified.length === 0 && <div className="col-span-full text-center py-20 opacity-50">No verified providers found.</div>}

                            {/* Pagination Controls */}
                            {filteredVerified.length > ITEMS_PER_PAGE && (
                                <div className="flex items-center justify-center gap-4 mt-6">
                                    <button
                                        onClick={() => setVerifiedPage(p => Math.max(1, p - 1))}
                                        disabled={verifiedPage === 1}
                                        className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7' }}
                                    >
                                        <ChevronLeft className="w-5 h-5" style={{ color: '#52525b' }} />
                                    </button>
                                    <span className="text-sm font-semibold" style={{ color: '#52525b' }}>
                                        Page {verifiedPage} of {totalVerifiedPages}
                                    </span>
                                    <button
                                        onClick={() => setVerifiedPage(p => Math.min(totalVerifiedPages, p + 1))}
                                        disabled={verifiedPage >= totalVerifiedPages}
                                        className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7' }}
                                    >
                                        <ChevronRight className="w-5 h-5" style={{ color: '#52525b' }} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}


                {/* --- USERS TAB --- */}
                {activeTab === 'users' && (() => {
                    const filteredUsers = allUsers.filter(u =>
                        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                    );
                    const totalUsersPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
                    return (
                        <div className="space-y-6">
                            {/* Search Input */}
                            <div className="relative max-w-xl mx-auto mb-8">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setUsersPage(1); }}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500/50 rounded-2xl shadow-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                                    style={{ backgroundColor: 'white', color: 'black' }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredUsers
                                    .slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)
                                    .map((u, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            key={u._id}
                                            className="rounded-2xl transition-all hover:shadow-lg relative overflow-hidden hover:-translate-y-1"
                                            style={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e4e4e7',
                                                padding: '24px',
                                                boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08)'
                                            }}
                                        >
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div
                                                        className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl overflow-hidden relative"
                                                        style={{ background: 'linear-gradient(to bottom right, #dbeafe, #eff6ff)', border: '1px solid #bfdbfe', color: '#3b82f6' }}
                                                    >
                                                        {u.photoUrl ? (
                                                            <img src={u.photoUrl} alt={u.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            u.name[0]
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-lg truncate" style={{ color: '#18181b' }}>{u.name}</h4>
                                                        <p className="text-xs truncate" style={{ color: '#71717a' }}>{u.email}</p>
                                                        <span
                                                            className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                                                            style={{
                                                                backgroundColor: u.role === 'admin' ? '#fff7ed' : '#eff6ff',
                                                                color: u.role === 'admin' ? '#ea580c' : '#3b82f6'
                                                            }}
                                                        >
                                                            {u.role}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteUser(u._id)}
                                                    className="w-full py-3 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                                                    style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete User
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-20 opacity-50">No users found.</div>
                            )}

                            {/* Pagination Controls */}
                            {filteredUsers.length > ITEMS_PER_PAGE && (
                                <div className="flex items-center justify-center gap-4 mt-6">
                                    <button
                                        onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                                        disabled={usersPage === 1}
                                        className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7' }}
                                    >
                                        <ChevronLeft className="w-5 h-5" style={{ color: '#52525b' }} />
                                    </button>
                                    <span className="text-sm font-semibold" style={{ color: '#52525b' }}>
                                        Page {usersPage} of {totalUsersPages}
                                    </span>
                                    <button
                                        onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                                        disabled={usersPage >= totalUsersPages}
                                        className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7' }}
                                    >
                                        <ChevronRight className="w-5 h-5" style={{ color: '#52525b' }} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* --- REVIEWS TAB --- */}
                {activeTab === 'reviews' && (
                    <div className="space-y-8">
                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-3">
                            {['all', 'provider', 'user'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setReviewFilter(filter)}
                                    className={`px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all ${reviewFilter === filter ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-card border border-border hover:bg-accent'}`}
                                >
                                    {filter === 'all' ? 'All Reviews' : filter === 'provider' ? 'Provider Reviews' : 'User Reviews'}
                                </button>
                            ))}
                        </div>

                        {/* Reviews Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {allReviews
                                .filter(r => reviewFilter === 'all' || r.revieweeType?.toLowerCase() === reviewFilter)
                                .map((review, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                        key={review._id}
                                        className="bg-gradient-to-br from-card/60 to-background border border-border/50 p-6 rounded-[2rem] hover:shadow-xl transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-24 bg-yellow-500/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                                        <div className="relative z-10">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center font-black text-yellow-500 border border-yellow-500/20 text-lg">
                                                        {review.reviewer?.name?.[0] || review.reviewer?.shopName?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{review.reviewer?.name || review.reviewer?.shopName || 'Unknown'}</p>
                                                        <p className="text-xs text-muted-foreground">{review.reviewerType}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${review.revieweeType === 'Provider' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    To {review.revieweeType}
                                                </span>
                                            </div>

                                            {/* Reviewee */}
                                            <div className="bg-accent/30 p-3 rounded-xl mb-4">
                                                <p className="text-xs text-muted-foreground mb-1">Reviewed:</p>
                                                <p className="font-bold text-sm">{review.reviewee?.name || review.reviewee?.shopName || 'Unknown'}</p>
                                            </div>

                                            {/* Stars */}
                                            <div className="flex items-center gap-1 mb-3">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                                <span className="ml-2 text-sm font-bold text-muted-foreground">{review.rating}/5</span>
                                            </div>

                                            {/* Comment */}
                                            {review.comment && (
                                                <p className="text-sm text-muted-foreground italic mb-4 line-clamp-3">"{review.comment}"</p>
                                            )}

                                            {/* Service Types */}
                                            {review.serviceTypes?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-4">
                                                    {review.serviceTypes.map((s, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded-md bg-accent text-[10px] font-bold border border-border">
                                                            {typeof s === 'object' ? s.name : s}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Date */}
                                            <p className="text-xs text-muted-foreground opacity-50 text-right">
                                                {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>

                        {allReviews.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <Star className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-lg">No reviews yet</p>
                                <p>Reviews will appear here when users and providers rate each other.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- Modal Logic (Same as before) --- */}
                <AnimatePresence>
                    {selectedProvider && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 lg:p-8"
                            onClick={() => setSelectedProvider(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white dark:bg-zinc-900 w-full max-w-6xl max-h-[90vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative"
                            >
                                {/* --- Left Sidebar / Top Visuals (Visuals) --- */}
                                <div className="w-full md:w-1/3 bg-zinc-50 dark:bg-zinc-900/50 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-6">
                                    {/* Shop Photo */}
                                    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 group">
                                        <img
                                            src={selectedProvider.verificationDocs?.shopPhoto || selectedProvider.shopPhotoUrl || "https://images.unsplash.com/photo-1487754180451-c456f719a1fc"}
                                            alt="Shop Front"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-black/60 backdrop-blur text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                                Shop Front
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mini Map (Desktop Only) */}
                                    <div className="hidden md:flex flex-1 min-h-[200px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 relative bg-zinc-100 dark:bg-zinc-800">
                                        <MapComponent center={{ lat: selectedProvider.location.coordinates[1], lng: selectedProvider.location.coordinates[0] }} zoom={15}>
                                            <Marker position={{ lat: selectedProvider.location.coordinates[1], lng: selectedProvider.location.coordinates[0] }} />
                                        </MapComponent>
                                        <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {selectedProvider.location.coordinates[1].toFixed(4)}, {selectedProvider.location.coordinates[0].toFixed(4)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Actions */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <a
                                            href={`mailto:${selectedProvider.email}`}
                                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-bold shadow-sm"
                                        >
                                            <Mail className="w-4 h-4" /> Email
                                        </a>
                                        <button
                                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-bold shadow-sm"
                                            onClick={() => {
                                                if (selectedProvider.phone) window.location.href = `tel:${selectedProvider.phone}`;
                                                else toast.error("No phone number available");
                                            }}
                                        >
                                            <Activity className="w-4 h-4" /> Call
                                        </button>
                                    </div>
                                </div>

                                {/* --- Right Panel / Content (Data) --- */}
                                <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 min-w-0">
                                    {/* Header */}
                                    <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-20 sticky top-0 md:relative">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">{selectedProvider.shopName}</h2>
                                                {selectedProvider.isVerified ? (
                                                    <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-500/30 whitespace-nowrap shadow-sm shadow-green-500/10">Verified</span>
                                                ) : (
                                                    <span className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-200 dark:border-orange-500/30 whitespace-nowrap shadow-sm shadow-orange-500/10">Pending Review</span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="uppercase text-[10px] font-black bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-2 py-0.5 rounded tracking-tighter">{selectedProvider.role}</span>
                                                <span className="text-zinc-400 dark:text-zinc-500 text-xs font-mono truncate">ID: {selectedProvider._id.slice(-12).toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedProvider(null)} className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400 hover:text-zinc-600 hover:rotate-90 md:hover:scale-110 shrink-0 border border-zinc-200 dark:border-zinc-800">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Scrollable Details */}
                                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 selection:bg-blue-100 dark:selection:bg-blue-500/30">
                                        {/* Info Grid */}
                                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 mb-6 flex items-center gap-3">
                                                <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800" />
                                                <FileText className="w-3.5 h-3.5" /> Business Details
                                                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                                                <div className="space-y-2 group">
                                                    <label className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 tracking-wider">Owner / Email</label>
                                                    <div className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 select-all break-all flex items-center gap-2">
                                                        {selectedProvider.email}
                                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 group">
                                                    <label className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 tracking-wider">Direct Phone</label>
                                                    <div className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 font-mono tracking-tight flex items-center gap-2">
                                                        {selectedProvider.phone || "Not Provided"}
                                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                                <div className="col-span-1 sm:col-span-2 space-y-2">
                                                    <label className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 tracking-wider">Registered Address</label>
                                                    <div className="font-medium text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
                                                        {selectedProvider.address}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                                        {/* Services */}
                                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 mb-6 flex items-center gap-3">
                                                <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800" />
                                                <Wrench className="w-3.5 h-3.5" /> Services offered
                                                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                                            </h3>
                                            <div className="flex flex-wrap gap-2.5">
                                                {selectedProvider.providerCategory?.map((c, index) => (
                                                    <span key={`${c}-${index}`} className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white dark:text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-blue-500/20 border border-blue-400/30">
                                                        {c}
                                                    </span>
                                                ))}
                                                {selectedProvider.services.map((s, i) => (
                                                    <span key={i} className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold transition-colors">
                                                        {typeof s === 'object' ? s.name : s}
                                                    </span>
                                                ))}
                                                {(!selectedProvider.services || selectedProvider.services.length === 0) && (
                                                    <span className="text-sm text-zinc-400 italic">No specific services listed.</span>
                                                )}
                                            </div>
                                        </section>

                                        {/* Mobile Map (Visible only on small screens) */}
                                        <div className="md:hidden h-56 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-700 relative shadow-xl">
                                            <MapComponent center={{ lat: selectedProvider.location.coordinates[1], lng: selectedProvider.location.coordinates[0] }} zoom={15}>
                                                <Marker position={{ lat: selectedProvider.location.coordinates[1], lng: selectedProvider.location.coordinates[0] }} />
                                            </MapComponent>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-6 md:p-8 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-center gap-5 sticky bottom-0 md:relative z-20">
                                        <div className="flex gap-4 w-full sm:w-auto">
                                            {selectedProvider.isVerified ? (
                                                <button
                                                    onClick={() => handleRevokeProvider(selectedProvider._id)}
                                                    className="w-full sm:w-auto px-8 py-4 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 font-black rounded-2xl text-xs uppercase tracking-widest border border-red-100 dark:border-red-500/20 transition-all flex items-center justify-center gap-2 group"
                                                >
                                                    <ShieldAlert className="w-4 h-4 group-hover:animate-pulse" /> Revoke Badge
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRejectProvider(selectedProvider._id)}
                                                    className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 font-black rounded-2xl text-xs uppercase tracking-widest border border-zinc-200 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-500/30 transition-all"
                                                >
                                                    Reject Process
                                                </button>
                                            )}
                                        </div>
                                        {!selectedProvider.isVerified && (
                                            <button
                                                onClick={() => handleVerifyProvider(selectedProvider._id)}
                                                className="w-full sm:w-auto px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl text-xs uppercase tracking-[0.15em] hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-xl shadow-zinc-500/10 hover:shadow-blue-500/20 flex items-center justify-center gap-2 group active:scale-95"
                                            >
                                                <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" /> Approve & Verify
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                    {/* --- Update Review Modal --- */}
                    <AnimatePresence>
                        {updateRequest && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
                                onClick={() => setUpdateRequest(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                                    onClick={e => e.stopPropagation()}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                                >
                                    <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Review Profile Update</h2>
                                        <button onClick={() => setUpdateRequest(null)} className="p-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-600">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="p-8 space-y-8 overflow-y-auto bg-white dark:bg-zinc-950">
                                        <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                Current State
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20" />
                                                Requested Update
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Shop Name Comparison */}
                                            <div className="grid grid-cols-2 gap-4 items-center">
                                                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-60">
                                                    <div className="text-[10px] uppercase font-black text-zinc-500 mb-1.5 tracking-wider">Shop Name</div>
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-50">{updateRequest.shopName}</div>
                                                </div>
                                                <div className={`p-5 bg-white dark:bg-zinc-900 border-2 rounded-2xl shadow-sm transition-all ${updateRequest.shopName !== updateRequest.pendingUpdate.data.shopName ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                                    <div className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 mb-1.5 tracking-wider">Requested Name</div>
                                                    <div className={`font-black ${updateRequest.shopName !== updateRequest.pendingUpdate.data.shopName ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                                                        {updateRequest.pendingUpdate.data.shopName || updateRequest.shopName}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Address Comparison */}
                                            <div className="grid grid-cols-2 gap-4 items-center">
                                                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-60">
                                                    <div className="text-[10px] uppercase font-black text-zinc-500 mb-1.5 tracking-wider">Address</div>
                                                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 leading-relaxed">{updateRequest.address}</div>
                                                </div>
                                                <div className={`p-5 bg-white dark:bg-zinc-900 border-2 rounded-2xl shadow-sm transition-all ${updateRequest.address !== updateRequest.pendingUpdate.data.address ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                                    <div className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 mb-1.5 tracking-wider">Requested Address</div>
                                                    <div className={`font-bold text-sm leading-relaxed ${updateRequest.address !== updateRequest.pendingUpdate.data.address ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                                                        {updateRequest.pendingUpdate.data.address || updateRequest.address}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Phone Comparison */}
                                            <div className="grid grid-cols-2 gap-4 items-center">
                                                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-60">
                                                    <div className="text-[10px] uppercase font-black text-zinc-500 mb-1.5 tracking-wider">Phone</div>
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-50 font-mono">{updateRequest.phone}</div>
                                                </div>
                                                <div className={`p-5 bg-white dark:bg-zinc-900 border-2 rounded-2xl shadow-sm transition-all ${updateRequest.phone !== updateRequest.pendingUpdate.data.phone ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                                    <div className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 mb-1.5 tracking-wider">Requested Phone</div>
                                                    <div className={`font-black font-mono ${updateRequest.phone !== updateRequest.pendingUpdate.data.phone ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                                                        {updateRequest.pendingUpdate.data.phone || updateRequest.phone}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location Comparison Map */}
                                            {updateRequest.pendingUpdate.data.location && (
                                                <div className="col-span-2 space-y-4 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                                    <div className="flex justify-between items-center px-1">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Location Change Request</h3>
                                                    </div>
                                                    <div className="h-72 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100 dark:bg-zinc-800 shadow-inner">
                                                        <MapComponent
                                                            center={
                                                                updateRequest.pendingUpdate.data.location.coordinates
                                                                    ? {
                                                                        lat: updateRequest.pendingUpdate.data.location.coordinates[1],
                                                                        lng: updateRequest.pendingUpdate.data.location.coordinates[0]
                                                                    }
                                                                    : { lat: 19.0760, lng: 72.8777 }
                                                            }
                                                            zoom={15}
                                                        >
                                                            {/* Current Location (Old) */}
                                                            {updateRequest.location && updateRequest.location.coordinates && (
                                                                <Marker
                                                                    position={{
                                                                        lat: updateRequest.location.coordinates[1],
                                                                        lng: updateRequest.location.coordinates[0]
                                                                    }}
                                                                    icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                                                />
                                                            )}

                                                            {/* Requested Location (New) */}
                                                            {updateRequest.pendingUpdate.data.location?.coordinates && (
                                                                <Marker
                                                                    position={{
                                                                        lat: updateRequest.pendingUpdate.data.location.coordinates[1],
                                                                        lng: updateRequest.pendingUpdate.data.location.coordinates[0]
                                                                    }}
                                                                    icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                                                                />
                                                            )}
                                                        </MapComponent>

                                                        {/* Legend Overlay */}
                                                        <div className="absolute top-4 left-4 flex flex-col gap-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-[10px] font-black shadow-xl">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20"></div>
                                                                <span className="text-zinc-600 dark:text-zinc-400">Current Location</span>
                                                            </div>
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/20"></div>
                                                                <span className="text-zinc-600 dark:text-zinc-400">Requested New</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-8 flex gap-4 sticky bottom-0 bg-white dark:bg-zinc-950 z-10">
                                            <button
                                                onClick={() => handleRejectUpdate(updateRequest._id)}
                                                className="flex-1 py-4 bg-zinc-100 hover:bg-red-50 dark:bg-zinc-900 dark:hover:bg-red-500/10 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 font-black rounded-2xl text-[10px] uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 hover:border-red-200 dark:hover:border-red-500/30 transition-all active:scale-95"
                                            >
                                                Reject Update
                                            </button>
                                            <button
                                                onClick={() => handleApproveUpdate(updateRequest._id)}
                                                className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white shadow-xl shadow-zinc-500/10 hover:shadow-blue-500/30 transition-all active:scale-95"
                                            >
                                                Approve Changes
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </AnimatePresence>
            </main>
        </div >
    );
};

export default AdminDashboard;
