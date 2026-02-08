import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, MapPin } from 'lucide-react';

const TermsOfService = () => {
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
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">Terms of Service</h1>
                            <p className="text-muted-foreground">Last updated: February 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <p className="text-muted-foreground">
                                    By accessing or using FuelNFix, you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not use our services. These terms apply to all users, including service providers and customers.
                                </p>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <p className="text-muted-foreground">
                                    FuelNFix is a platform connecting users who need roadside assistance with verified service providers. Our services include:
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li>• Fuel delivery to your location</li>
                                    <li>• On-site mechanic services for minor repairs</li>
                                    <li>• Battery jumpstart and replacement</li>
                                    <li>• Flatbed towing services</li>
                                    <li>• Tire change and repair assistance</li>
                                </ul>
                                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                                    <p className="text-sm text-foreground font-medium">
                                        ⚠️ FuelNFix acts as a platform to connect users with independent service providers. We are not directly responsible for the services rendered.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <h3 className="font-semibold text-lg mb-3">As a Customer, you agree to:</h3>
                                <ul className="space-y-2 text-muted-foreground mb-6">
                                    <li>• Provide accurate location and contact information</li>
                                    <li>• Be present at the service location during the appointment</li>
                                    <li>• Pay for services rendered through the platform</li>
                                    <li>• Treat service providers with respect</li>
                                    <li>• Provide honest feedback and ratings</li>
                                </ul>
                                <h3 className="font-semibold text-lg mb-3">As a Service Provider, you agree to:</h3>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li>• Maintain valid licenses and certifications</li>
                                    <li>• Provide services professionally and safely</li>
                                    <li>• Arrive at the agreed time and location</li>
                                    <li>• Charge only the rates agreed upon in the app</li>
                                    <li>• Not share customer information with third parties</li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">4. Payments & Pricing</h2>
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <p className="text-muted-foreground">
                                    All payments are processed securely through our platform. Pricing is calculated algorithmically based on:
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li>• Base service fee</li>
                                    <li>• Distance traveled by the provider</li>
                                    <li>• Cost of materials (at MRP)</li>
                                    <li>• Time of service (regular/emergency hours)</li>
                                </ul>
                                <p className="text-muted-foreground">
                                    Refunds are processed on a case-by-case basis. For disputes, contact our support team within 48 hours of service completion.
                                </p>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">5. Account Termination</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <p className="text-muted-foreground">
                                    We reserve the right to suspend or terminate accounts for violations of these terms, including but not limited to: fraudulent activity, abusive behavior, provision of false information, or repeated negative reviews. Providers with ratings below 3.5 stars may be automatically suspended pending review.
                                </p>
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <p className="text-muted-foreground">
                                    FuelNFix is not liable for any damages arising from services provided by third-party service providers. Our maximum liability is limited to the amount paid for the specific service in question. We are not responsible for delays caused by traffic, weather, or other circumstances beyond our control.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">7. Contact Information</h2>
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <p className="text-muted-foreground">
                                    For questions about these Terms of Service, contact us at{' '}
                                    <a href="mailto:legal@fuelnfix.com" className="text-blue-500 hover:underline">
                                        legal@fuelnfix.com
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

export default TermsOfService;
