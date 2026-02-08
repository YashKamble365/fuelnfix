import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Settings as SettingsIcon, LogOut, Menu, User, Car, Plus, Trash2, Save, X, ChevronRight, Bell, Search, ArrowLeft
} from 'lucide-react';
import { useTheme } from '../components/theme-provider';
import { ModeToggle } from '../components/mode-toggle';
import api from '../lib/api';
import PhoneInput from '../components/PhoneInput';

const Settings = () => {
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Profile Form State
    const [profileForm, setProfileForm] = useState({ name: '', phone: '' });

    // Vehicle Form State
    const [vehicleForm, setVehicleForm] = useState({ model: '', fuelType: 'Petrol', plateNumber: '' });
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingVehicleId, setEditingVehicleId] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setProfileForm({ name: parsedUser.name, phone: parsedUser.phone || '' });
        }
    }, [navigate]);

    if (!user) return null;

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/api/auth/profile', {
                userId: user._id,
                ...profileForm
            });
            const updatedUser = { ...user, ...res.data.user };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Failed to update profile: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleVehicleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let res;
            if (isEditing && editingVehicleId) {
                res = await api.put(`/api/auth/vehicles/${editingVehicleId}`, {
                    userId: user._id,
                    vehicle: vehicleForm
                });
            } else {
                res = await api.post('/api/auth/vehicles', {
                    userId: user._id,
                    vehicle: vehicleForm
                });
            }

            const updatedUser = { ...user, vehicles: res.data.user.vehicles }; // Sync vehicles
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Reset form
            setShowAddVehicle(false);
            setIsEditing(false);
            setEditingVehicleId(null);
            setVehicleForm({ model: '', fuelType: 'Petrol', plateNumber: '' });
        } catch (err) {
            alert(`Failed to ${isEditing ? 'update' : 'add'} vehicle: ` + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (vehicle) => {
        setVehicleForm({
            model: vehicle.model,
            fuelType: vehicle.fuelType,
            plateNumber: vehicle.plateNumber
        });
        setEditingVehicleId(vehicle._id);
        setIsEditing(true);
        setShowAddVehicle(true);
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (!window.confirm("Are you sure you want to remove this vehicle?")) return;
        try {
            const res = await api.delete('/api/auth/vehicles', {
                data: { userId: user._id, vehicleId }
            });
            const updatedUser = { ...user, vehicles: res.data.user.vehicles };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            alert("Failed to remove vehicle: " + (err.response?.data?.message || err.message));
        }
    };

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

            {/* Sidebar (Same as Dashboard) */}
            <aside className={`fixed lg:static inset-y-0 left-0 w-80 !bg-white dark:!bg-card/50 !backdrop-blur-none dark:!backdrop-blur-2xl border-r border-border z-50 transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
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
                        <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 text-foreground/80 hover:bg-accent/50 hover:text-foreground rounded-2xl font-medium transition-all group">
                            <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" /> Request Help
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3.5 bg-blue-500/10 text-blue-500 rounded-2xl font-bold shadow-lg shadow-blue-500/5 transition-all">
                            <SettingsIcon className="w-5 h-5 text-blue-500" /> Settings
                        </button>
                    </nav>
                </div>

                {/* White spacer to fill the gap */}
                <div className="flex-1 bg-white dark:bg-transparent"></div>

                <div className="p-6 border-t border-border/50 bg-white dark:bg-background/20">
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-card dark:to-background border border-border shadow-sm">
                        {user.photoUrl ? (
                            <img src={user.photoUrl} alt="User" className="w-11 h-11 rounded-xl object-cover border-2 border-blue-500/10" />
                        ) : (
                            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 text-lg">
                                {user.name.charAt(0)}
                            </div>
                        )}
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-bold truncate text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground capitalize font-medium">{user.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 w-full">
                <div className="p-4 lg:p-10 max-w-[1200px] mx-auto">
                    <header className="flex flex-col-reverse gap-4 lg:flex-row justify-between items-start lg:items-center mb-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-card border border-border text-foreground">
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight mb-1">Account Settings</h1>
                                <p className="text-muted-foreground font-medium">Manage your personal info and garage.</p>
                            </div>
                        </div>
                        <div className="self-end lg:self-auto flex items-center gap-3">
                            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border font-bold hover:bg-accent transition-all text-sm">
                                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                            </button>
                            <ModeToggle />
                        </div>
                    </header>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-8 border-b border-border/50 pb-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-3 px-2 font-bold transition-all relative ${activeTab === 'profile' ? 'text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Profile Details
                            {activeTab === 'profile' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('garage')}
                            className={`pb-3 px-2 font-bold transition-all relative ${activeTab === 'garage' ? 'text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            My Garage
                            {activeTab === 'garage' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                        </button>
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' ? (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-card/40 backdrop-blur-xl border border-border rounded-3xl p-8 max-w-2xl"
                            >
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">Full Name</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                value={profileForm.name}
                                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                className="block w-full pl-12 pr-4 h-14 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-blue-500/50 text-foreground shadow-sm transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <PhoneInput
                                                value={profileForm.phone}
                                                onChange={(val) => setProfileForm({ ...profileForm, phone: val })}
                                                placeholder="Phone Number"
                                                className="h-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="block w-full px-4 h-14 rounded-2xl border border-border bg-accent/20 text-muted-foreground shadow-sm outline-none cursor-not-allowed"
                                        />
                                        <p className="text-xs text-muted-foreground ml-1">Email cannot be changed as it is linked to your Google Account.</p>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 h-12 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-500/90 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" /> Save Changes
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="garage"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Existing Vehicles */}
                                    {user.vehicles && user.vehicles.map((v, i) => (
                                        <div key={v._id || i} className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-6 relative group hover:border-blue-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                    <Car className="w-6 h-6" />
                                                </div>
                                                <div className="flex gap-2 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditClick(v)}
                                                        className="p-2 rounded-xl text-blue-500 hover:bg-blue-500/10 transition-colors"
                                                        title="Edit Vehicle"
                                                    >
                                                        <SettingsIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteVehicle(v._id)}
                                                        className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                                                        title="Remove Vehicle"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">{v.model}</h3>
                                                <p className="text-muted-foreground font-medium">{v.plateNumber}</p>
                                                <div className="mt-4 inline-block px-3 py-1 rounded-full bg-accent text-xs font-bold uppercase tracking-wider">
                                                    {v.fuelType}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Vehicle Button */}
                                    {!showAddVehicle && (
                                        <button
                                            onClick={() => {
                                                setShowAddVehicle(true);
                                                setIsEditing(false);
                                                setVehicleForm({ model: '', fuelType: 'Petrol', plateNumber: '' });
                                            }}
                                            className="min-h-[200px] border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-blue-500/50 hover:text-blue-500 hover:bg-blue-500/5 transition-all group"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold">Add New Vehicle</span>
                                        </button>
                                    )}
                                </div>

                                {/* Add/Edit Vehicle Form */}
                                <AnimatePresence>
                                    {showAddVehicle && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-card/40 backdrop-blur-xl border border-border rounded-3xl p-8 max-w-2xl overflow-hidden shadow-2xl"
                                        >
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold">{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                                                <button onClick={() => setShowAddVehicle(false)} className="p-2 hover:bg-accent rounded-full"><X className="w-5 h-5" /></button>
                                            </div>
                                            <form onSubmit={handleVehicleSubmit} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-bold ml-1">Model Name</label>
                                                        <input
                                                            type="text"
                                                            value={vehicleForm.model}
                                                            onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                                                            placeholder="e.g. Honda City"
                                                            className="block w-full px-4 h-12 rounded-xl border border-border bg-background/50 focus:bg-background focus:border-blue-500/50 text-foreground shadow-sm transition-all outline-none"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold ml-1">Details</label>
                                                        <input
                                                            type="text"
                                                            value={vehicleForm.plateNumber}
                                                            onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                                                            placeholder="Plate Number"
                                                            className="block w-full px-4 h-12 rounded-xl border border-border bg-background/50 focus:bg-background focus:border-blue-500/50 text-foreground shadow-sm transition-all outline-none"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-bold ml-1">Fuel Type</label>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                                                        {['Petrol', 'Diesel', 'CNG', 'Electric'].map(type => (
                                                            <button
                                                                type="button"
                                                                key={type}
                                                                onClick={() => setVehicleForm({ ...vehicleForm, fuelType: type })}
                                                                className={`h-10 rounded-xl text-sm font-bold border transition-all ${vehicleForm.fuelType === type ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-background border-border hover:border-blue-500/50'}`}
                                                            >
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="pt-4 flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddVehicle(false)}
                                                        className="px-6 h-12 rounded-full border border-border font-bold hover:bg-accent transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-8 h-12 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-500/90 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                                    >
                                                        <Save className="w-4 h-4" /> {isEditing ? 'Save Changes' : 'Add to Garage'}
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Settings;
