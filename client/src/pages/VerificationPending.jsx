import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, ShieldCheck, ArrowRight, Mail, HelpCircle } from 'lucide-react';

const VerificationPending = () => {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4 selection:bg-blue-500/30">
            {/* Ambient Background - Blue Theme */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse-slow"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-lg w-full bg-card/60 backdrop-blur-3xl border border-white/10 dark:border-white/5 rounded-[3rem] p-8 md:p-12 relative z-10 shadow-2xl shadow-blue-500/10 flex flex-col items-center text-center"
            >
                {/* Status Icon */}
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
                    <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center relative shadow-xl shadow-blue-500/30 rotate-3">
                        <ShieldCheck className="w-14 h-14 text-white drop-shadow-md" />
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-lg border border-border/50">
                            <Clock className="w-8 h-8 text-orange-500 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4 mb-10">
                    <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                        Verification Pending
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                        Thanks for registering! Our experts are reviewing your profile to ensure quality standards.
                    </p>
                </div>

                {/* Timeline Card */}
                <div className="bg-background/40 backdrop-blur-sm p-6 rounded-3xl border border-white/10 w-full text-left space-y-5 mb-8">
                    <h3 className="font-black text-xs uppercase tracking-widest text-primary/80 ml-1">Next Steps</h3>
                    <ul className="space-y-4">
                        <li className="flex gap-4 items-start group">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <span className="text-[10px] font-bold">1</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-foreground">Document Review</h4>
                                <p className="text-xs text-muted-foreground">We verify your shop details & value.</p>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start group">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <span className="text-[10px] font-bold">2</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-foreground">Account Activation</h4>
                                <p className="text-xs text-muted-foreground">Access your dashboard instantly.</p>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start group">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <span className="text-[10px] font-bold">3</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-foreground">Start Serving</h4>
                                <p className="text-xs text-muted-foreground">Receive requests nearby.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="w-full space-y-3">
                    <Link
                        to="/"
                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group"
                    >
                        Return Home <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <button className="w-full h-12 rounded-2xl bg-transparent hover:bg-accent text-muted-foreground font-bold text-sm transition-all flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" /> Contact Support
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default VerificationPending;
