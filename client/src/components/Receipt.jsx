import { motion } from 'framer-motion';
import { X, Download, Printer, CheckCircle, MapPin, Wrench } from 'lucide-react';
import { useRef } from 'react';
import html2canvas from 'html2canvas';

const Receipt = ({
    isOpen,
    onClose,
    requestData,
    paymentId,
    customerName,
    providerName
}) => {
    const receiptRef = useRef(null);

    if (!isOpen || !requestData) return null;

    const {
        serviceTypes = [],
        pricing = {},
        bill = [],
        location = {},
        paymentCompletedAt
    } = requestData;

    const baseFee = pricing.baseFee || 0;
    const distanceFee = pricing.distanceFee || 0;
    const materialsCost = pricing.materialCost || 0;
    const totalAmount = pricing.totalAmount || 0;
    const distance = pricing.distanceMetric || 0;

    const formatDate = (date) => {
        if (!date) return new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!receiptRef.current) return;

        try {
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true
            });

            const link = document.createElement('a');
            link.download = `FuelnFix_Receipt_${paymentId || Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: use print
            handlePrint();
        }
    };

    const handleClose = (e) => {
        e.stopPropagation();
        if (onClose && typeof onClose === 'function') {
            onClose();
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose(e);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:bg-white print:p-0"
            onClick={handleBackdropClick}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white text-black rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-w-full print:max-h-none"
                onClick={(e) => e.stopPropagation()}
            >
                <div ref={receiptRef}>
                    {/* Header with Logo */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white print:bg-blue-600">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <span className="text-2xl font-black text-blue-600">F</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight">FuelnFix</h1>
                                    <p className="text-white/80 text-xs font-medium">Roadside Assistance</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors print:hidden"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Receipt Content */}
                    <div className="p-6">
                        {/* Success Badge */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-center text-2xl font-black text-gray-900 mb-1">Payment Successful!</h2>
                        <p className="text-center text-gray-500 text-sm mb-6">Thank you for using FuelnFix</p>

                        {/* Receipt Details */}
                        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <span className="text-gray-500 text-sm">Receipt No</span>
                                <span className="font-mono font-bold text-sm">{paymentId || 'TXN' + Date.now().toString().slice(-8)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                <span className="text-gray-500 text-sm">Date & Time</span>
                                <span className="font-medium text-sm">{formatDate(paymentCompletedAt)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3">
                                <span className="text-gray-500 text-sm">Payment Method</span>
                                <span className="font-medium text-sm">Online Payment</span>
                            </div>
                        </div>

                        {/* Service Details */}
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-blue-500" />
                                Services
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {serviceTypes.length > 0 ? serviceTypes.map((service, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        {service}
                                    </span>
                                )) : (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        Roadside Assistance
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        {location?.address && (
                            <div className="mb-4 flex items-start gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span>{location.address}</span>
                            </div>
                        )}

                        {/* Billing Breakdown */}
                        <div className="border-t border-gray-200 pt-4 mb-4">
                            <h3 className="font-bold text-gray-900 mb-3">Bill Details</h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Service Charges</span>
                                    <span className="font-medium">₹{baseFee}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Distance Fee ({typeof distance === 'number' && distance.toFixed ? distance.toFixed(1) : distance} km)</span>
                                    <span className="font-medium">₹{Math.round(distanceFee)}</span>
                                </div>

                                {bill.length > 0 && (
                                    <>
                                        <div className="flex justify-between pt-2 border-t border-dashed border-gray-200">
                                            <span className="text-gray-500 font-medium">Materials & Parts</span>
                                            <span className="font-medium">₹{materialsCost}</span>
                                        </div>
                                        {bill.map((item, idx) => (
                                            <div key={idx} className="flex justify-between pl-4 text-gray-500">
                                                <span>• {item.name}</span>
                                                <span>₹{item.cost}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-gray-900">
                                <span className="text-lg font-black text-gray-900">TOTAL PAID</span>
                                <span className="text-2xl font-black text-green-600">₹{totalAmount}</span>
                            </div>
                        </div>

                        {/* Customer & Provider */}
                        <div className="bg-gray-50 rounded-2xl p-4 text-sm">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Customer</span>
                                <span className="font-medium">{customerName || 'Customer'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Service Provider</span>
                                <span className="font-medium">{providerName || 'Provider'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-100 px-6 py-4 text-center">
                        <p className="text-xs text-gray-500">
                            Thank you for choosing FuelnFix! 🚗
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            For support, contact: support@fuelnfix.com
                        </p>
                    </div>
                </div>

                {/* Actions - Outside the receipt ref for cleaner download */}
                <div className="flex gap-3 p-6 pt-0 print:hidden">
                    <button
                        onClick={handleDownload}
                        className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        type="button"
                    >
                        <Download className="w-5 h-5" />
                        Download
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        type="button"
                    >
                        <Printer className="w-5 h-5" />
                        Print
                    </button>
                </div>
                <div className="px-6 pb-6 print:hidden">
                    <button
                        onClick={handleClose}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                        type="button"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Receipt;
