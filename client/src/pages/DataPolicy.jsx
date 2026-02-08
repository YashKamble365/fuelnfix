import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, MapPin } from 'lucide-react';

const CookiePolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/" className="p-2 rounded-xl hover:bg-muted transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl">FuelNFix</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Settings className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">Cookie Policy</h1>
                            <p className="text-muted-foreground">Last updated: February 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">1. What Are Cookies?</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <p className="text-muted-foreground">
                                    Cookies are small text files stored on your device when you visit our website or use our application. They help us provide you with a better experience by remembering your preferences, keeping you logged in, and understanding how you use our platform.
                                </p>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">2. Types of Cookies We Use</h2>
                            <div className="space-y-4">
                                <div className="bg-card rounded-2xl border border-border p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <span className="text-emerald-500 font-bold text-lg">E</span>
                                        </div>
                                        <h3 className="font-semibold text-lg">Essential Cookies</h3>
                                    </div>
                                    <p className="text-muted-foreground">
                                        Required for the platform to function properly. These enable core features like user authentication, security, and session management. Without these, you cannot use FuelNFix.
                                    </p>
                                </div>

                                <div className="bg-card rounded-2xl border border-border p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <span className="text-blue-500 font-bold text-lg">F</span>
                                        </div>
                                        <h3 className="font-semibold text-lg">Functional Cookies</h3>
                                    </div>
                                    <p className="text-muted-foreground">
                                        Remember your preferences such as language, theme settings (light/dark mode), and recently viewed providers. These enhance your user experience.
                                    </p>
                                </div>

                                <div className="bg-card rounded-2xl border border-border p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                            <span className="text-amber-500 font-bold text-lg">A</span>
                                        </div>
                                        <h3 className="font-semibold text-lg">Analytics Cookies</h3>
                                    </div>
                                    <p className="text-muted-foreground">
                                        Help us understand how users interact with our platform. We use this data to improve our services, fix issues, and optimize performance. This data is anonymized and aggregated.
                                    </p>
                                </div>

                                <div className="bg-card rounded-2xl border border-border p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                            <span className="text-violet-500 font-bold text-lg">M</span>
                                        </div>
                                        <h3 className="font-semibold text-lg">Marketing Cookies</h3>
                                    </div>
                                    <p className="text-muted-foreground">
                                        Used to deliver relevant advertisements and measure the effectiveness of our marketing campaigns. You can opt out of these cookies without affecting your use of the platform.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">3. Third-Party Cookies</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <p className="text-muted-foreground mb-4">We use the following third-party services that may set cookies:</p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li>• <strong>Google Maps:</strong> For location services and map functionality</li>
                                    <li>• <strong>Firebase:</strong> For authentication and real-time notifications</li>
                                    <li>• <strong>Razorpay/Stripe:</strong> For secure payment processing</li>
                                    <li>• <strong>Google Analytics:</strong> For usage analytics (anonymized)</li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">4. Managing Cookies</h2>
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <p className="text-muted-foreground">
                                    You can control cookies through your browser settings. Most browsers allow you to:
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li>• View and delete existing cookies</li>
                                    <li>• Block cookies from specific or all websites</li>
                                    <li>• Set preferences for certain types of cookies</li>
                                </ul>
                                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                                    <p className="text-sm text-foreground font-medium">
                                        ⚠️ Disabling essential cookies may prevent you from using key features of FuelNFix, including login and service booking.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">5. Cookie Retention</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 font-semibold">Cookie Type</th>
                                            <th className="text-left py-3 font-semibold">Retention Period</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-muted-foreground">
                                        <tr className="border-b border-border/50">
                                            <td className="py-3">Session Cookies</td>
                                            <td className="py-3">Until browser close</td>
                                        </tr>
                                        <tr className="border-b border-border/50">
                                            <td className="py-3">Authentication</td>
                                            <td className="py-3">30 days</td>
                                        </tr>
                                        <tr className="border-b border-border/50">
                                            <td className="py-3">Preferences</td>
                                            <td className="py-3">1 year</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3">Analytics</td>
                                            <td className="py-3">2 years</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <p className="text-muted-foreground">
                                    For questions about our Cookie Policy, contact us at{' '}
                                    <a href="mailto:privacy@fuelnfix.com" className="text-blue-500 hover:underline">
                                        privacy@fuelnfix.com
                                    </a>
                                </p>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default CookiePolicy;
