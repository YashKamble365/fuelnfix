import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, MapPin } from 'lucide-react';
import { useTheme } from './theme-provider';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { setTheme, theme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    // Use blue theme for landing page
    const isLandingPage = location.pathname === '/';
    const accentColor = isLandingPage ? 'blue-500' : 'primary';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsOpen(false);
    };

    const navLinks = [
        { name: 'Features', id: 'features' },
        { name: 'How it Works', id: 'how-it-works' },
        { name: 'Reviews', id: 'reviews' },
        { name: 'Coverage', id: 'coverage' },
        { name: 'FAQ', id: 'faq' }
    ];


    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-transparent pt-4'}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2 group">
                            <div className={`w-10 h-10 rounded-xl ${isLandingPage ? 'bg-blue-500 shadow-blue-500/25' : 'bg-primary shadow-primary/25'} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                <MapPin className="w-6 h-6 fill-current" />
                            </div>
                            <span className="text-foreground">Fuel<span className={isLandingPage ? 'text-blue-500' : 'text-primary'}>N</span>Fix</span>
                        </Link>
                    </div>


                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className="hidden lg:flex items-center space-x-6">
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className={`text-muted-foreground ${isLandingPage ? 'hover:text-blue-500' : 'hover:text-primary'} transition-colors font-medium text-sm cursor-pointer bg-transparent border-none`}
                            >
                                Home
                            </button>
                            {navLinks.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`text-muted-foreground ${isLandingPage ? 'hover:text-blue-500' : 'hover:text-primary'} transition-colors font-medium text-sm cursor-pointer bg-transparent border-none`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>

                        <div className="h-6 w-px bg-border hidden lg:block"></div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-accent transition-colors focus:outline-none focus:ring-2 ${isLandingPage ? 'focus:ring-blue-500/20' : 'focus:ring-primary/20'}`}
                                aria-label="Toggle theme"
                            >
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
                                <Moon className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
                            </button>

                            <Link to="/login" className={`text-sm font-semibold text-foreground ${isLandingPage ? 'hover:text-blue-500' : 'hover:text-primary'} transition-colors px-4`}>
                                Log In
                            </Link>
                            <Link to="/register" className={`px-6 py-2.5 text-sm font-bold ${isLandingPage ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25' : 'bg-primary hover:bg-primary/90 shadow-primary/25'} text-white rounded-full transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0`}>
                                Get Started
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-accent transition-colors"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
                            <Moon className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
                        </button>
                        <button onClick={() => setIsOpen(!isOpen)} className="text-foreground p-2 hover:bg-accent rounded-lg transition-colors">
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-background border-b border-border shadow-2xl overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <button
                                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsOpen(false); }}
                                className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-accent transition-colors"
                            >
                                Home
                            </button>
                            {navLinks.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => scrollToSection(item.id)}
                                    className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-accent transition-colors"
                                >
                                    {item.name}
                                </button>
                            ))}
                            <div className="pt-4 flex flex-col gap-3 px-2">
                                <Link to="/login" className="w-full flex items-center justify-center py-3 border border-border rounded-xl font-bold hover:bg-accent transition-colors">
                                    Log In
                                </Link>
                                <Link to="/register" className={`w-full flex items-center justify-center py-3 ${isLandingPage ? 'bg-blue-500 shadow-blue-500/20' : 'bg-primary shadow-primary/20'} text-white rounded-xl font-bold shadow-lg`}>
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
