import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, ArrowRight, Wrench, Fuel, ChevronDown, Users } from 'lucide-react';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const idToken = await user.getIdToken();

            // Send ID Token to Backend (with retry for cold-start)
            let res;
            try {
                res = await api.post('/api/auth/login', { idToken }, { timeout: 15000 });
            } catch (firstErr) {
                // If timeout or network error, try once more (server might be waking up)
                if (firstErr.code === 'ECONNABORTED' || !firstErr.response) {
                    console.warn('Server cold-start detected, retrying login...');
                    res = await api.post('/api/auth/login', { idToken }, { timeout: 30000 });
                } else {
                    throw firstErr;
                }
            }
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

            if (err.code === 'ECONNABORTED') {
                alert("Server is taking too long to respond. Please try again in a moment.");
            } else {
                alert("Login Failed. " + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/auth/login', { email, password });
            const userData = res.data.user;
            const token = res.data.token;

            localStorage.setItem('user', JSON.stringify(userData));
            if (token) localStorage.setItem('token', token);

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
            alert("Login Failed. " + (err.response?.data?.message || err.message));
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
                    <Link to="/" className="inline-flex items-center justify-center mb-4 hover:scale-105 transition-transform">
                        <img src="/logo1.png" alt="FuelNFix" className="h-16 md:h-20 w-auto" />
                    </Link>
                    <p className="text-muted-foreground font-medium">Welcome back.</p>
                </div>

                <div className="space-y-6">
                    {/* Standard Email/Password Login Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 bg-background/50 border border-border/50 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-14 bg-background/50 border border-border/50 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full h-14 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card/50 px-2 text-muted-foreground font-bold">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-14 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        ) : (
                            <>
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                                <span>Google</span>
                                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all duration-300" />
                            </>
                        )}
                    </button>



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
