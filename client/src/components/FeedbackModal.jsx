import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, User, Wrench, MessageSquare } from 'lucide-react';
import api from '../lib/api';

const FeedbackModal = ({
    isOpen,
    onClose,
    requestId,
    reviewerId,
    reviewerType, // 'User' or 'Provider'
    revieweeId,
    revieweeType, // 'Provider' or 'User'
    revieweeName,
    serviceTypes = [],
    onSubmitSuccess
}) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/api/review/submit', {
                requestId,
                reviewerId,
                reviewerType,
                revieweeId,
                revieweeType,
                rating,
                comment,
                serviceTypes
            });

            if (response.data.success) {
                setSubmitted(true);
                setTimeout(() => {
                    onSubmitSuccess?.();
                    onClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Submit feedback error:', error);
            if (error.response?.data?.message === 'You have already reviewed this service') {
                alert('You have already submitted a review for this service.');
                onClose();
            } else {
                alert('Failed to submit feedback. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !submitting) {
            onClose();
        }
    };

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={handleBackdropClick}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-card text-foreground rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <Star className="w-6 h-6 fill-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">Rate Experience</h2>
                                    <p className="text-blue-100 text-sm font-medium">
                                        {reviewerType === 'User' ? 'How was the service?' : 'How was the customer?'}
                                    </p>
                                </div>
                            </div>
                            {!submitting && (
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {submitted ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                                    <Star className="w-12 h-12 text-blue-500 fill-blue-500" />
                                </div>
                                <h3 className="text-3xl font-black mb-2 text-foreground">Thank You!</h3>
                                <p className="text-muted-foreground font-medium">Your feedback helps us improve</p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Reviewee Info */}
                                <div className="flex items-center gap-3 mb-6 p-4 bg-muted/50 rounded-2xl border border-border/50">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                        {revieweeType === 'Provider' ? (
                                            <Wrench className="w-6 h-6" />
                                        ) : (
                                            <User className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{revieweeName || (revieweeType === 'Provider' ? 'Service Provider' : 'Customer')}</p>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {revieweeType === 'Provider' ? 'Service Provider' : 'Customer'}
                                        </p>
                                    </div>
                                </div>

                                {/* Star Rating */}
                                <div className="text-center mb-8">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Tap to rate</p>
                                    <div className="flex justify-center gap-2 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onMouseEnter={() => setHoveredRating(star)}
                                                onMouseLeave={() => setHoveredRating(0)}
                                                onClick={() => setRating(star)}
                                                className="p-1 transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star
                                                    className={`w-10 h-10 transition-colors drop-shadow-sm ${star <= (hoveredRating || rating)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-200 dark:text-gray-700'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {rating > 0 && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-lg font-black text-blue-500"
                                        >
                                            {ratingLabels[rating]}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Comment */}
                                <div className="mb-6">
                                    <label className="flex items-center gap-2 text-sm font-bold mb-2 text-foreground">
                                        <MessageSquare className="w-4 h-4 text-blue-500" />
                                        Add a comment <span className="text-muted-foreground font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Share your experience..."
                                        maxLength={500}
                                        rows={3}
                                        className="w-full p-4 bg-muted/30 border border-border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-muted-foreground/50"
                                    />
                                    <p className="text-xs text-muted-foreground text-right mt-1 font-medium">
                                        {comment.length}/500
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        disabled={submitting}
                                        className="flex-1 py-4 bg-muted hover:bg-muted/80 font-bold rounded-xl transition-colors disabled:opacity-50 text-muted-foreground"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || rating === 0}
                                        className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {submitting ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Submit Review
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FeedbackModal;
