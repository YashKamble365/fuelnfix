import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, ArrowRight, Wrench, Fuel, ChevronDown, Users } from 'lucide-react';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';

// Demo Providers for quick testing (39 total across Amravati)
const DEMO_PROVIDERS = [
    // === MECHANIC ONLY (11) ===
    { name: 'Rajesh Patil', shopName: 'Rajesh Auto Works', email: 'demo_rajesh@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Sunil Deshmukh', shopName: 'Deshmukh Motors', email: 'demo_sunil@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Amit Sharma', shopName: 'Sharma Car Care', email: 'demo_amit@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Vikram Jadhav', shopName: 'Jadhav Garage', email: 'demo_vikram@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Akash Pawar', shopName: 'Pawar Auto Clinic', email: 'demo_akash@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Tushar Ingle', shopName: 'Ingle Mechanics', email: 'demo_tushar@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Pravin Shinde', shopName: 'Shinde Car Hospital', email: 'demo_pravin@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Kiran Gaikwad', shopName: 'Gaikwad Motor Works', email: 'demo_kiran@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Sandip Chavan', shopName: 'Chavan Garage Zone', email: 'demo_sandip@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Mangesh Thombre', shopName: 'Thombre Auto Fix', email: 'demo_mangesh@fuelnfix.com', category: ['Mechanic'] },
    { name: 'Nitin Borkar', shopName: 'Borkar Quick Repair', email: 'demo_nitin@fuelnfix.com', category: ['Mechanic'] },
    // === FUEL DELIVERY ONLY (11) ===
    { name: 'Prashant Wankhede', shopName: 'Quick Fuel Express', email: 'demo_prashant@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Nikhil Thakur', shopName: 'Thakur Fuel Services', email: 'demo_nikhil@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Sachin Gawande', shopName: 'Gawande Petroleum', email: 'demo_sachin@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Rohit Kulkarni', shopName: 'Kulkarni Oil Depot', email: 'demo_rohit@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Vishal Kokate', shopName: 'Kokate Fuel Point', email: 'demo_vishal@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Ajay Somkuwar', shopName: 'Somkuwar Fuel Express', email: 'demo_ajay@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Rahul Deshpande', shopName: 'Deshpande Petroleum', email: 'demo_rahul@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Umesh Tawade', shopName: 'Tawade Oil Services', email: 'demo_umesh@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Yogesh Kharkar', shopName: 'Kharkar Fuel Hub', email: 'demo_yogesh@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Swapnil Meshram', shopName: 'Meshram Energy', email: 'demo_swapnil@fuelnfix.com', category: ['Fuel Delivery'] },
    { name: 'Vaibhav Lokhande', shopName: 'Lokhande Fuel Stop', email: 'demo_vaibhav@fuelnfix.com', category: ['Fuel Delivery'] },
    // === BOTH MECHANIC + FUEL DELIVERY (17) ===
    { name: 'Mahesh Ingole', shopName: 'Ingole Auto & Fuel', email: 'demo_mahesh@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Anil Bhagat', shopName: 'Bhagat Service Station', email: 'demo_anil@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Sanjay Raut', shopName: 'Raut Complete Care', email: 'demo_sanjay@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Deepak More', shopName: 'More Motors & Fuel', email: 'demo_deepak@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Vijay Kale', shopName: 'Kale Roadside Assist', email: 'demo_vijay@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Ganesh Sawant', shopName: 'Sawant Auto Hub', email: 'demo_ganesh@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Pratik Wagh', shopName: 'Wagh Complete Care', email: 'demo_pratik@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Abhijit Ghate', shopName: 'Ghate Auto & Fuel', email: 'demo_abhijit@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Gaurav Nimje', shopName: 'Nimje Service Point', email: 'demo_gaurav@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Omkar Zade', shopName: 'Zade Multi Services', email: 'demo_omkar@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Rushikesh Vaidya', shopName: 'Vaidya Road Assist', email: 'demo_rushikesh@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Suraj Khapre', shopName: 'Khapre Auto Hub', email: 'demo_suraj@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Aniket Ghodke', shopName: 'Ghodke Express Care', email: 'demo_aniket@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Shubham Dorle', shopName: 'Dorle Roadside Pro', email: 'demo_shubham@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Avinash Bawane', shopName: 'Bawane Total Care', email: 'demo_avinash@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Pankaj Urade', shopName: 'Urade Auto Zone', email: 'demo_pankaj@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
    { name: 'Hemant Kawale', shopName: 'Kawale All-in-One', email: 'demo_hemant@fuelnfix.com', category: ['Mechanic', 'Fuel Delivery'] },
];

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [showDemoProviders, setShowDemoProviders] = useState(false);
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const idToken = await user.getIdToken();

            // Send ID Token to Backend
            const res = await api.post('/api/auth/login', { idToken });
            const userData = res.data.user;
            localStorage.setItem('user', JSON.stringify(userData));

            // Role-based Redirect
            if (userData.role === 'admin') {
                navigate('/admin');
            } else if (userData.role === 'provider') {
                if (userData.isVerified) {
                    navigate('/provider-dashboard');
                } else {
                    navigate('/verification-pending');
                }
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error("Login Error:", err);

            // Handle User Not Found (New User)
            if (err.response && err.response.status === 404) {
                // Redirect to Register page with Google Data
                navigate('/register', {
                    state: {
                        googleData: err.response.data.googleData
                    }
                });
                return;
            }

            alert("Login Failed. " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDemoProviderLogin = async (provider) => {
        setLoading(true);
        try {
            // Fetch demo provider from backend by email
            const res = await api.get(`/api/auth/demo-login/${provider.email}`);
            const userData = res.data.user;
            localStorage.setItem('user', JSON.stringify(userData));
            navigate('/provider-dashboard');
        } catch (err) {
            console.error("Demo Login Error:", err);
            alert("Demo Login Failed. " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
            {/* Ambient Background - Blue Theme */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse-slow"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full bg-card/50 backdrop-blur-2xl border border-blue-500/10 rounded-[2.5rem] p-8 md:p-12 relative z-10 shadow-2xl shadow-blue-500/5"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 text-3xl font-black tracking-tighter justify-center mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <MapPin className="w-6 h-6 fill-current" />
                        </div>
                        <span>Fuel<span className="text-blue-500">N</span>Fix</span>
                    </Link>
                    <p className="text-muted-foreground font-medium">Welcome back, commander.</p>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-14 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 group relative overflow-hidden"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        ) : (
                            <>
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                                <span>Continue with Google</span>
                                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all duration-300" />
                            </>
                        )}
                    </button>

                    {/* Demo Provider Section */}
                    <div className="border border-dashed border-amber-500/30 rounded-2xl p-4 bg-amber-500/5">
                        <button
                            onClick={() => setShowDemoProviders(!showDemoProviders)}
                            className="w-full flex items-center justify-between text-amber-500 font-bold text-sm"
                        >
                            <span className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Demo Provider Login
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showDemoProviders ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showDemoProviders && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                                        {DEMO_PROVIDERS.map((p) => (
                                            <button
                                                key={p.email}
                                                onClick={() => handleDemoProviderLogin(p)}
                                                disabled={loading}
                                                className="w-full text-left p-3 rounded-xl bg-background/50 hover:bg-background border border-border/50 hover:border-amber-500/50 transition-all group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-bold text-sm text-foreground">{p.shopName}</p>
                                                        <p className="text-xs text-muted-foreground">{p.name}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {p.category.includes('Mechanic') && (
                                                            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                                                                <Wrench className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                        {p.category.includes('Fuel Delivery') && (
                                                            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                                                                <Fuel className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-center text-muted-foreground mt-3">
                                        These are demo accounts for testing in Amravati region
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background/0 backdrop-blur-sm px-2 text-muted-foreground font-bold">
                                Secure Access
                            </span>
                        </div>
                    </div>

                    <div className="text-center space-y-4">


                        <p className="text-muted-foreground text-sm font-medium">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-500 hover:text-blue-400 transition-colors font-bold ml-1">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
