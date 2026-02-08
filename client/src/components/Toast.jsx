import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast types with their icons and colors
const toastTypes = {
    success: {
        icon: CheckCircle,
        bg: 'bg-green-500',
        border: 'border-green-600',
        iconColor: 'text-white'
    },
    error: {
        icon: XCircle,
        bg: 'bg-red-500',
        border: 'border-red-600',
        iconColor: 'text-white'
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-500',
        border: 'border-amber-600',
        iconColor: 'text-white'
    },
    info: {
        icon: Info,
        bg: 'bg-blue-500',
        border: 'border-blue-600',
        iconColor: 'text-white'
    }
};

// Individual Toast component
const Toast = ({ id, message, type = 'info', onClose }) => {
    const config = toastTypes[type] || toastTypes.info;
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${config.bg} ${config.border} text-white min-w-[280px] max-w-[400px]`}
        >
            <Icon className={`w-5 h-5 shrink-0 ${config.iconColor}`} />
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

// Toast Container component
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            id={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={removeToast}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Toast Provider component
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();

        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Convenience methods
    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
