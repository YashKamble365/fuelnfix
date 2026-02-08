import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, MapPin } from 'lucide-react';

const PrivacyPolicy = () => {
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
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
                            <p className="text-muted-foreground">Last updated: February 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Personal Information</h3>
                                    <p className="text-muted-foreground">
                                        When you register for FuelNFix, we collect your name, email address, phone number, and profile photo. For service providers, we additionally collect business documentation, shop photos, and verification documents.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Location Data</h3>
                                    <p className="text-muted-foreground">
                                        We collect real-time location data when you use our services to connect you with nearby providers. This includes GPS coordinates shared during service requests and provider tracking during active jobs.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Transaction Data</h3>
                                    <p className="text-muted-foreground">
                                        We collect payment information, service history, and transaction records to process payments and maintain service records.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <ul className="space-y-3 text-muted-foreground">
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                                        <span>To connect you with verified roadside assistance providers in your area</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                                        <span>To process payments and maintain transaction records</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                                        <span>To verify provider credentials and maintain platform safety</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                                        <span>To send service notifications, updates, and promotional communications</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                                        <span>To improve our services through analytics and user feedback</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">3. Data Sharing & Security</h2>
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <p className="text-muted-foreground">
                                    We share your location with service providers only during active service requests. We do not sell your personal data to third parties. All data is encrypted using industry-standard protocols.
                                </p>
                                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                                    <p className="text-sm text-foreground font-medium">
                                        🔒 Your data is protected with AES-256 encryption and stored on secure, SOC 2 compliant servers.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">4. Your Rights</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <p className="text-muted-foreground mb-4">You have the right to:</p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li>• Access your personal data</li>
                                    <li>• Request correction of inaccurate data</li>
                                    <li>• Request deletion of your account and data</li>
                                    <li>• Opt-out of marketing communications</li>
                                    <li>• Download a copy of your data</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">5. Contact Us</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <p className="text-muted-foreground">
                                    For privacy-related inquiries, contact our Data Protection Officer at{' '}
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

export default PrivacyPolicy;
