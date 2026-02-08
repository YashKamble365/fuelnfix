import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
    MapPin,
    Zap,
    ArrowUpRight,
    Check,
    Shield,
    CreditCard,
    Timer,
    Smartphone,
    UserCheck,
    AlertTriangle,
    Fuel,
    Wrench,
    Truck,
    Signal,
    Network,
    ChevronRight
} from 'lucide-react';
import { useRef } from 'react';
import CoverageMap from '../components/GoogleMaps/CoverageMap';

const Card3D = ({ children, className }) => {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const transform = useTransform(
        [mouseXSpring, mouseYSpring],
        ([latestX, latestY]) =>
            `rotateY(${latestX / 20}deg) rotateX(${latestY / -20}deg)`
    );

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct * 20);
        y.set(yPct * 20);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transformStyle: "preserve-3d", transform }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const ScrollReveal = ({ children, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
            {children}
        </motion.div>
    );
};

const Home = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const onMouseMove = (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        mouseX.set(clientX - centerX);
        mouseY.set(clientY - centerY);
    };

    const mouseXSpring = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const mouseYSpring = useSpring(mouseY, { stiffness: 50, damping: 20 });

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-blue-500/30 selection:text-white overflow-x-hidden perspective-1000 landing-blue-theme" onMouseMove={onMouseMove}>
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 md:pt-20">
                {/* Premium Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-blue-950/5 dark:to-blue-950/20 z-0">
                    {/* Animated Gradient Orbs */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-blue-600/20 via-indigo-500/15 to-violet-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ x: mouseXSpring, y: mouseYSpring }}
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/15 via-cyan-400/10 to-transparent blur-[100px] rounded-full animate-pulse-slow"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/10 via-blue-400/5 to-transparent blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
                    <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 blur-[80px] rounded-full animate-float"></div>

                    {/* Refined Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f608_1px,transparent_1px),linear-gradient(to_bottom,#3b82f608_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>

                    {/* Noise Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">

                    {/* Premium Headline with Gradient Text */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black tracking-tighter mb-8 leading-[0.9]"
                    >
                        <span className="block text-foreground">Stranded?</span>
                        <span className="block mt-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent italic">
                            We've Got You.
                        </span>
                    </motion.h1>

                    {/* Refined Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground/80 mb-12 font-medium leading-relaxed"
                    >
                        India's most trusted roadside assistance platform. Connect with verified mechanics and fuel delivery partners in under 5 minutes.
                    </motion.p>

                    {/* Premium CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link
                            to="/login"
                            className="group relative h-16 px-10 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center overflow-hidden transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_20px_50px_-10px_rgba(59,130,246,0.6)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            <span className="relative flex items-center">
                                Get Immediate Help
                                <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </span>
                        </Link>
                        <Link
                            to="/register"
                            className="group h-16 px-10 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl text-foreground font-bold text-lg flex items-center justify-center hover:bg-accent/50 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Join as Provider
                            <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground/60"
                    >
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-medium">Verified Providers</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Timer className="w-5 h-5 text-blue-500" />
                            <span className="text-sm font-medium">5 Min Response</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-violet-500" />
                            <span className="text-sm font-medium">Secure Payments</span>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Gradient Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 bg-gradient-to-b from-background via-background to-blue-950/5 dark:to-blue-950/10 relative z-10 scroll-mt-20">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f605_1px,transparent_1px),linear-gradient(to_bottom,#3b82f605_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <ScrollReveal>
                        <div className="mb-20 text-center">
                            <span className="inline-block text-blue-500 font-semibold tracking-widest uppercase text-sm mb-4">Technology Stack</span>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                                Engineered for <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Excellence.</span>
                            </h2>
                            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 mx-auto rounded-full"></div>
                            <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                Our architecture prioritizes speed and reliability. Advanced algorithms cut response times by up to 40%.
                            </p>
                        </div>
                    </ScrollReveal>


                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(200px,auto)]">

                        {/* 1. Haversine Algorithm Card */}
                        <div className="md:col-span-8">
                            <ScrollReveal delay={0.1}>
                                <div className="h-full bg-gradient-to-br from-card/80 via-card to-blue-950/5 dark:to-blue-950/20 rounded-[2rem] border border-border/50 p-10 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 shadow-xl shadow-black/5 dark:shadow-blue-500/5 backdrop-blur-xl">
                                    {/* Gradient Orb */}
                                    <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-500/20 via-indigo-500/10 to-transparent blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-700">
                                        <Network className="w-72 h-72 text-blue-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/30">
                                            <Zap className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-3xl font-bold mb-4">Haversine Radius Search</h3>
                                        <p className="text-muted-foreground text-lg max-w-lg mb-8 leading-relaxed">
                                            Our backend instantly calculates the <strong className="text-foreground">Great-Circle Distance</strong> to all available providers, filtering within a 5km radius for rapid response.
                                        </p>
                                        <div className="flex gap-3 flex-wrap">
                                            <div className="px-4 py-2 bg-violet-500/10 text-violet-500 dark:text-violet-400 rounded-xl text-xs font-bold border border-violet-500/20 uppercase tracking-wider backdrop-blur-sm">Geospatial Indexing</div>
                                            <div className="px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold border border-amber-500/20 uppercase tracking-wider backdrop-blur-sm">A* Optimization</div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>


                        {/* 2. Lite Mode */}
                        <div className="md:col-span-4">
                            <ScrollReveal delay={0.2}>
                                <div className="h-full bg-muted/20 rounded-[2rem] border border-border p-8 flex flex-col justify-between hover:bg-muted/30 transition-colors">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <Signal className="w-8 h-8 text-blue-500" />
                                            <span className="text-xs font-bold bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full">OFFLINE READY</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground mb-2">Network Agnostic</h3>
                                        <p className="font-medium text-muted-foreground">
                                            Breakdowns happen in dead zones. Our "Lite Mode" ensures your request goes through even on 2G/EDGE networks.
                                        </p>
                                    </div>
                                    <div className="mt-8">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-500/20 uppercase tracking-wider w-fit">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Packet Optimization Active
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>

                        {/* 3. Feedback Loop */}
                        <div className="md:col-span-4">
                            <ScrollReveal delay={0.3}>
                                <div className="h-full bg-card rounded-[2rem] border border-border p-8 hover:border-blue-500/40 transition-colors shadow-sm relative overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                                    <UserCheck className="w-10 h-10 text-blue-500 mb-6" />
                                    <h3 className="text-2xl font-bold mb-3">Double-Blind Quality</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Trust is two-way. Both users and providers rate each other. Providers below 3.5★ are automatically suspended.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-lg text-xs font-bold border border-green-500/20">SENTIMENT ANALYSIS</div>
                                        <div className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-xs font-bold border border-blue-500/20">AUTOMATED AUDIT</div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>


                        {/* 4. Payment Card */}
                        <div className="md:col-span-8">
                            <ScrollReveal delay={0.4}>
                                <div className="h-full bg-card rounded-[2rem] border border-border p-8 relative overflow-hidden group hover:border-blue-500/40 transition-colors shadow-sm">
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                                        <div className="flex-1">
                                            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2">Dynamic Billing Engine</h3>
                                            <p className="text-muted-foreground mb-6 max-w-md">
                                                Fairness guaranteed. Costs are calculated algorithmically based on <strong>Base Fee + Real-time Distance + Material Costs</strong>. No arbitrary surges.
                                            </p>
                                            <div className="flex gap-3">
                                                <div className="px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-500/20 uppercase tracking-wider cursor-default">UPI</div>
                                                <div className="px-3 py-1 bg-pink-500/10 text-pink-600 rounded-lg text-xs font-bold border border-pink-500/20 uppercase tracking-wider cursor-default">CARDS</div>
                                                <div className="px-3 py-1 bg-cyan-500/10 text-cyan-600 rounded-lg text-xs font-bold border border-cyan-500/20 uppercase tracking-wider cursor-default">ESCROW</div>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-1/3 bg-background rounded-2xl p-6 border border-border shadow-lg">
                                            <div className="space-y-3 mb-4">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Base Fee</span>
                                                    <span>₹500</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Distance (4km)</span>
                                                    <span>₹100</span>
                                                </div>
                                                <div className="h-px bg-border"></div>
                                                <div className="flex justify-between font-bold">
                                                    <span>Total</span>
                                                    <span>₹600</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-blue-500/90 transition-colors shadow-lg shadow-blue-500/20">
                                                Pay Securely
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works - Premium Redesign */}
            <section id="how-it-works" className="py-32 bg-muted/10 border-y border-border scroll-mt-20 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <ScrollReveal>
                        <div className="text-center mb-24">
                            <span className="text-blue-500 font-bold tracking-widest uppercase text-sm mb-2 block">Workflow</span>
                            <h2 className="text-4xl md:text-6xl font-black mb-4">From Distress to <br />Resolution.</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Seamless coordination between man and machine.</p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[120px] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-border to-transparent -z-10"></div>

                        {[
                            { step: "01", title: "Geolocation Capture", desc: "Browser API instantly locks your Latitude/Longitude.", icon: MapPin },
                            { step: "02", title: "Provider Handshake", desc: "Socket.io opens a live bi-directional channel with the nearest mechanic.", icon: Network },
                            { step: "03", title: "Digital Settlement", desc: "Secure payment gateway triggers only after job completion.", icon: Shield }
                        ].map((item, i) => (
                            <ScrollReveal key={i} delay={i * 0.2}>
                                <div className="relative group">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-32 h-32 bg-background border-4 border-border rounded-full flex items-center justify-center mb-10 relative z-10 shadow-xl group-hover:border-blue-500 transition-colors duration-500">
                                            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center group-hover:bg-blue-500/5 transition-colors duration-500">
                                                <item.icon className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg border-4 border-background">
                                                {item.step}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-500 transition-colors">{item.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed max-w-xs">{item.desc}</p>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section - Premium Redesign */}
            <section id="pricing" className="py-32 bg-gradient-to-b from-background to-blue-950/5 dark:to-blue-950/10 scroll-mt-20 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f603_1px,transparent_1px),linear-gradient(to_bottom,#3b82f603_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-violet-500/5 blur-3xl rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 relative">
                    <ScrollReveal>
                        <div className="text-center mb-20">
                            <span className="inline-block text-blue-500 font-semibold tracking-widest uppercase text-sm mb-4">Transparent Pricing</span>
                            <h2 className="text-4xl md:text-6xl font-black mb-6">
                                Fair Rates. <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Zero Surprises.</span>
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-xl mx-auto">Algorithmic cost calculation with standardized, transparent rates.</p>
                        </div>
                    </ScrollReveal>


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                        {/* Mechanic Service */}
                        <ScrollReveal delay={0.1}>
                            <div className="h-full bg-card rounded-[2.5rem] border border-border p-10 hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative group">
                                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                    <Wrench className="w-7 h-7 text-foreground group-hover:text-blue-500 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Mechanic Visit</h3>
                                <p className="text-muted-foreground text-sm mb-8">Jumpstarts, minor repairs, diagnostics.</p>

                                <div className="mb-8">
                                    <span className="text-5xl font-black tracking-tighter">₹399</span>
                                    <span className="text-muted-foreground font-medium"> / base</span>
                                </div>

                                <ul className="space-y-4 mb-10 text-sm font-medium text-muted-foreground">
                                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> 5km included</li>
                                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> ₹15/km additional</li>
                                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> Spares at MRP</li>
                                </ul>

                                <Link to="/login" className="block w-full py-4 border border-border hover:border-blue-500 hover:bg-blue-500/5 text-foreground text-center rounded-xl font-bold transition-all">Book Mechanic</Link>
                            </div>
                        </ScrollReveal>

                        {/* Fuel Delivery - Highlighted */}
                        <ScrollReveal delay={0.2}>
                            <div className="h-full bg-foreground text-background dark:bg-card dark:text-foreground rounded-[2.5rem] p-10 shadow-2xl shadow-blue-500/20 relative scale-105 border border-blue-500/20 dark:border-blue-500">
                                <div className="absolute top-6 right-6 bg-blue-500 px-4 py-1.5 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-blue-500/40">Popular choice</div>

                                <div className="w-14 h-14 bg-white/10 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8">
                                    <Fuel className="w-7 h-7 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-inherit">Fuel Delivery</h3>
                                <p className="text-inherit opacity-60 text-sm mb-8">Petrol/Diesel delivered to GPS pin.</p>

                                <div className="mb-8">
                                    <span className="text-5xl font-black tracking-tighter text-inherit">₹199</span>
                                    <span className="text-inherit opacity-60 font-medium"> / fixed fee</span>
                                </div>

                                <ul className="space-y-4 mb-10 text-sm font-medium text-inherit opacity-80">
                                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> Up to 5 Liters</li>
                                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> 24/7 Availability</li>
                                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> Fastest Arrival</li>
                                </ul>

                                <Link to="/login" className="block w-full py-4 bg-blue-500 text-white text-center rounded-xl font-bold hover:bg-blue-500/90 transition-all shadow-lg shadow-blue-500/25">Order Fuel</Link>
                            </div>
                        </ScrollReveal>

                        {/* Towing Service */}
                        <ScrollReveal delay={0.3}>
                            <div className="h-full bg-card rounded-[2.5rem] border border-border p-10 hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative group">
                                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                    <Truck className="w-7 h-7 text-foreground group-hover:text-blue-500 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Flatbed Towing</h3>
                                <p className="text-muted-foreground text-sm mb-8">Safe transport for major breakdowns.</p>

                                <div className="mb-8">
                                    <span className="text-5xl font-black tracking-tighter">₹999</span>
                                    <span className="text-muted-foreground font-medium"> / base</span>
                                </div>

                                <ul className="space-y-4 mb-10 text-sm font-medium text-muted-foreground">
                                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> Hydraulic Hook-up</li>
                                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> ₹25/km distance rate</li>
                                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> Insured transport</li>
                                </ul>

                                <Link to="/login" className="block w-full py-4 border border-border hover:border-blue-500 hover:bg-blue-500/5 text-foreground text-center rounded-xl font-bold transition-all">Request Tow</Link>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="reviews" className="py-32 bg-gradient-to-b from-background via-background to-blue-950/5 dark:to-blue-950/10 relative overflow-hidden scroll-mt-20">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f605_1px,transparent_1px),linear-gradient(to_bottom,#3b82f605_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none"></div>
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-to-l from-blue-500/10 via-indigo-500/5 to-transparent blur-[100px] rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 relative">
                    <ScrollReveal>
                        <div className="text-center mb-16">
                            <span className="inline-block text-blue-500 font-semibold tracking-widest uppercase text-sm mb-4">Testimonials</span>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                                What Our <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Users Say</span>
                            </h2>
                            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 mx-auto rounded-full"></div>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Rajesh Deshmukh",
                                location: "Nagpur",
                                rating: 5,
                                review: "Got stranded near Wardha Road at midnight. FuelNFix connected me with a mechanic within 8 minutes. The service was professional and the pricing was transparent. Lifesaver!",
                                service: "Mechanic",
                                avatar: "RD"
                            },
                            {
                                name: "Sneha Ingole",
                                location: "Amravati",
                                rating: 5,
                                review: "Ran out of petrol near Badnera on my way to work. The fuel delivery was incredibly fast and the provider was very helpful. Highly recommended for Amravati!",
                                service: "Fuel Delivery",
                                avatar: "SI"
                            },
                            {
                                name: "Vikram Thakare",
                                location: "Nagpur",
                                rating: 5,
                                review: "My car broke down on NH44. The towing service was quick and affordable. OTP verification made me feel secure about the whole process. Great app!",
                                service: "Towing",
                                avatar: "VT"
                            }
                        ].map((testimonial, index) => (

                            <ScrollReveal key={index} delay={index * 0.1}>
                                <div className="h-full bg-gradient-to-br from-card/80 via-card to-blue-950/5 dark:to-blue-950/20 rounded-[2rem] border border-border/50 p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 shadow-xl shadow-black/5 dark:shadow-blue-500/5 backdrop-blur-xl">
                                    {/* Quote Icon */}
                                    <div className="absolute top-6 right-6 text-blue-500/10 text-8xl font-serif">"</div>

                                    {/* Rating Stars */}
                                    <div className="flex gap-1 mb-6">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <svg key={i} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>

                                    {/* Review Text */}
                                    <p className="text-foreground/80 text-lg leading-relaxed mb-8 relative z-10">
                                        "{testimonial.review}"
                                    </p>

                                    {/* User Info */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                                            <p className="text-muted-foreground text-sm">{testimonial.location}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold">{testimonial.service}</span>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Coverage Map Section */}
            <section id="coverage" className="py-32 bg-background relative overflow-hidden scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <ScrollReveal>
                            <div>
                                <span className="inline-block text-blue-500 font-semibold tracking-widest uppercase text-sm mb-4">Coverage</span>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
                                    We're <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Everywhere</span> You Need Us
                                </h2>
                                <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                                    Our network of verified providers spans across major cities and highways, ensuring you're never too far from help.
                                </p>

                                <div className="grid grid-cols-2 gap-6 mb-10">
                                    {[
                                        { city: "Mumbai", providers: "120+" },
                                        { city: "Delhi NCR", providers: "95+" },
                                        { city: "Bangalore", providers: "80+" },
                                        { city: "Pune", providers: "65+" },
                                        { city: "Chennai", providers: "55+" },
                                        { city: "Hyderabad", providers: "50+" }
                                    ].map((city, index) => (
                                        <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 hover:border-blue-500/30 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground">{city.city}</h4>
                                                <p className="text-sm text-muted-foreground">{city.providers} providers</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-muted-foreground text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Expanding to 10+ more cities this year
                                </p>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={0.2}>
                            <div className="relative">
                                {/* Google Maps Coverage Visualization */}
                                <div className="aspect-square bg-gradient-to-br from-card via-card to-blue-950/10 rounded-[2.5rem] border border-border/50 relative overflow-hidden shadow-2xl shadow-blue-500/10">
                                    <CoverageMap />
                                </div>
                            </div>
                        </ScrollReveal>

                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-32 bg-gradient-to-b from-background via-background to-blue-950/5 dark:to-blue-950/10 relative overflow-hidden scroll-mt-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f605_1px,transparent_1px),linear-gradient(to_bottom,#3b82f605_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-4 relative">
                    <ScrollReveal>
                        <div className="text-center mb-16">
                            <span className="inline-block text-blue-500 font-semibold tracking-widest uppercase text-sm mb-4">FAQ</span>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                                Got <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Questions?</span>
                            </h2>
                            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 mx-auto rounded-full"></div>
                        </div>
                    </ScrollReveal>

                    <div className="space-y-4">
                        {[
                            {
                                question: "How fast can I get help?",
                                answer: "Our average response time is under 5 minutes. Once you submit a request, nearby providers are instantly notified and the closest available one accepts your request."
                            },
                            {
                                question: "How are payments calculated?",
                                answer: "Pricing is transparent with a base fee + distance-based charges. For mechanics, parts are charged at MRP. Fuel is charged at current pump rates. You'll see the full breakdown before confirming."
                            },
                            {
                                question: "Are the providers verified?",
                                answer: "Yes! All providers go through a strict verification process including identity verification, business documentation, and background checks before being approved on our platform."
                            },
                            {
                                question: "What if I'm in a low network area?",
                                answer: "Our Lite Mode is designed for exactly this. It uses minimal data packets to ensure your request goes through even on 2G/EDGE networks or spotty connectivity."
                            },
                            {
                                question: "How do I become a provider?",
                                answer: "Simply register on our platform, submit your business documentation (shop photos, ID proof), and once verified by our team, you can start receiving requests in your area."
                            }
                        ].map((faq, index) => (
                            <ScrollReveal key={index} delay={index * 0.05}>
                                <details className="group bg-gradient-to-br from-card/80 via-card to-blue-950/5 dark:to-blue-950/20 rounded-2xl border border-border/50 hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
                                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                                        <h3 className="text-lg font-bold text-foreground pr-4">{faq.question}</h3>
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-open:bg-blue-500 transition-colors">
                                            <ChevronRight className="w-5 h-5 text-blue-500 group-open:text-white group-open:rotate-90 transition-all" />
                                        </div>
                                    </summary>
                                    <div className="px-6 pb-6">
                                        <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                                    </div>
                                </details>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Become a Provider Section */}
            <section className="py-32 bg-gradient-to-b from-background via-background to-blue-950/5 dark:to-blue-950/10 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f605_1px,transparent_1px),linear-gradient(to_bottom,#3b82f605_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-violet-500/10 via-indigo-500/5 to-transparent blur-[100px] rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 relative">
                    <ScrollReveal>
                        <div className="text-center mb-16">
                            <span className="inline-block text-blue-500 font-semibold tracking-widest uppercase text-sm mb-4">For Providers</span>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                                Grow Your <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Business</span> With Us
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Join India's fastest-growing roadside assistance network. Get access to thousands of customers, secure payments, and grow your earnings.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <ScrollReveal>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { icon: CreditCard, label: "Secure Payments", desc: "Get paid directly to your bank account after every service" },
                                    { icon: UserCheck, label: "Verified Leads", desc: "Only verified customers with real emergencies" },
                                    { icon: Timer, label: "Flexible Hours", desc: "Work when you want, accept requests at your convenience" },
                                    { icon: Shield, label: "Full Support", desc: "24/7 dedicated support team to help you succeed" }
                                ].map((benefit, index) => (
                                    <div key={index} className="bg-gradient-to-br from-card/80 via-card to-blue-950/5 dark:to-blue-950/20 rounded-2xl border border-border/50 hover:border-blue-500/30 transition-all duration-300 p-6 group">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                            <benefit.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="font-bold text-foreground text-lg mb-2">{benefit.label}</h4>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{benefit.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={0.2}>
                            <div className="space-y-6">
                                {/* Stats Cards with Icons */}
                                {[
                                    { icon: Zap, value: "₹50K+", label: "Average Monthly Earnings", color: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/30" },
                                    { icon: Network, value: "500+", label: "Active Providers Nationwide", color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/30" },
                                    { icon: Timer, value: "< 5 Min", label: "Average Response Time", color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/30" }
                                ].map((stat, index) => (
                                    <div key={index} className="bg-gradient-to-br from-card/80 via-card to-blue-950/5 dark:to-blue-950/20 rounded-2xl border border-border/50 hover:border-blue-500/30 transition-all duration-300 p-6 flex items-center gap-6 group">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                                            <stat.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
                                            <p className="text-muted-foreground">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}

                                <Link
                                    to="/register"
                                    className="group w-full flex items-center justify-center gap-3 h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-bold text-lg shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_20px_50px_-10px_rgba(59,130,246,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Start Earning Today
                                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Link>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* Emergency CTA - Premium Redesign */}
            <section className="py-40 bg-gradient-to-b from-background via-background to-blue-950/5 dark:to-blue-950/20 relative overflow-hidden">
                {/* Premium Background Effects - Same as Hero */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/15 via-cyan-400/10 to-transparent blur-[100px] rounded-full animate-pulse-slow"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/10 via-blue-400/5 to-transparent blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
                    <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 blur-[80px] rounded-full animate-float"></div>

                    {/* Refined Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f608_1px,transparent_1px),linear-gradient(to_bottom,#3b82f608_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>

                    {/* Noise Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]"></div>
                </div>

                <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
                    <ScrollReveal>
                        {/* Premium Icon */}
                        <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 mb-12 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                                <Shield className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-10 tracking-tighter leading-tight">
                            <span className="block text-foreground">Ready When</span>
                            <span className="block mt-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent italic">You Need Us.</span>
                        </h2>


                        <p className="text-xl md:text-2xl text-muted-foreground/80 mb-16 max-w-3xl mx-auto leading-relaxed">
                            Join India's fastest-growing roadside assistance network.
                            Be prepared for anything the road throws at you.
                        </p>


                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                            <Link
                                to="/register"
                                className="group relative h-18 px-12 py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-xl font-bold text-white overflow-hidden transition-all duration-300 shadow-[0_20px_60px_-15px_rgba(59,130,246,0.5)] hover:shadow-[0_30px_70px_-15px_rgba(59,130,246,0.7)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                <span className="relative flex items-center gap-3">
                                    Get Protected Now
                                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                            <Link
                                to="/login"
                                className="h-18 px-12 py-5 rounded-2xl border border-border/50 hover:bg-accent/50 hover:border-blue-500/30 text-lg font-bold text-foreground transition-all duration-300 flex items-center gap-3 backdrop-blur-xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Already a Member?
                            </Link>

                        </div>
                    </ScrollReveal>
                </div>
            </section>


            {/* Premium Modern Footer */}
            <footer className="relative bg-gradient-to-b from-background via-background to-blue-950/5 dark:to-blue-950/20 border-t border-border/50 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f605_1px,transparent_1px),linear-gradient(to_bottom,#3b82f605_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-blue-500/5 via-indigo-500/5 to-transparent blur-[100px] rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    {/* Main Footer Content */}
                    <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {/* Brand Column */}
                        <div className="lg:col-span-1">
                            <Link to="/" className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <MapPin className="w-6 h-6 text-white fill-current" />
                                </div>
                                <span className="font-black text-2xl tracking-tighter">Fuel<span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">N</span>Fix</span>
                            </Link>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                India's most trusted roadside assistance platform. Fast, reliable, and always there when you need us most.
                            </p>
                            {/* Social Links */}
                            <div className="flex gap-3">
                                {[
                                    { icon: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z', label: 'Twitter' },
                                    { icon: 'M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z', label: 'Facebook' },
                                    { icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', label: 'Instagram' }
                                ].map((social, index) => (
                                    <a key={index} href="#" className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-blue-500/10 border border-border/50 hover:border-blue-500/30 flex items-center justify-center transition-all duration-300 group">
                                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                            <path d={social.icon} />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-bold text-foreground mb-6">Quick Links</h4>
                            <ul className="space-y-3">
                                {[
                                    { label: 'Features', href: '#features' },
                                    { label: 'How It Works', href: '#how-it-works' },
                                    { label: 'Pricing', href: '#pricing' },
                                    { label: 'Reviews', href: '#reviews' },
                                    { label: 'Coverage', href: '#coverage' }
                                ].map((link, index) => (
                                    <li key={index}>
                                        <a href={link.href} className="text-muted-foreground hover:text-blue-500 transition-colors text-sm flex items-center gap-2 group">
                                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Services */}
                        <div>
                            <h4 className="font-bold text-foreground mb-6">Services</h4>
                            <ul className="space-y-3">
                                {[
                                    { label: 'Fuel Delivery', icon: Fuel },
                                    { label: 'Mechanic On-Call', icon: Wrench },
                                    { label: 'Flatbed Towing', icon: Truck },
                                    { label: 'Battery Jumpstart', icon: Zap },
                                    { label: 'Tire Assistance', icon: Shield }
                                ].map((service, index) => (
                                    <li key={index}>
                                        <span className="text-muted-foreground hover:text-blue-500 transition-colors text-sm flex items-center gap-3 group cursor-pointer">
                                            <service.icon className="w-4 h-4 text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                                            {service.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-bold text-foreground mb-6">Contact Us</h4>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="text-muted-foreground text-sm leading-relaxed">
                                        Amravati, Maharashtra<br />India
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                        <Smartphone className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <a href="tel:+918459880189" className="text-muted-foreground hover:text-blue-500 transition-colors text-sm">
                                        +91 8459880189
                                    </a>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <a href="mailto:support@fuelnfix.com" className="text-muted-foreground hover:text-blue-500 transition-colors text-sm">
                                        support@fuelnfix.com
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="py-6 border-t border-border/50">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-muted-foreground text-sm">
                                © 2026 FuelNFix. All rights reserved.
                            </p>
                            <div className="flex items-center gap-6">
                                <Link to="/legal" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Privacy Policy</Link>
                                <Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Terms of Service</Link>
                                <Link to="/data-info" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Cookie Policy</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
