const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    // Reference to the completed request
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        required: true
    },
    // Who is giving the review
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Always valid since User collection holds both roles
        required: true
    },
    reviewerType: {
        type: String,
        enum: ['User', 'Provider'],
        required: true
    },
    // Who is being reviewed
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Always valid since User collection holds both roles
        required: true
    },
    revieweeType: {
        type: String,
        enum: ['User', 'Provider'],
        required: true
    },
    // Rating 1-5 stars
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    // Optional review text
    comment: {
        type: String,
        maxlength: 500
    },
    // Service types for context
    serviceTypes: [{
        type: String
    }],
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
ReviewSchema.index({ reviewee: 1, revieweeType: 1 });
ReviewSchema.index({ reviewer: 1, reviewerType: 1 });
ReviewSchema.index({ request: 1 });

// Static method to get average rating for a user/provider
ReviewSchema.statics.getAverageRating = async function (userId, userType) {
    try {
        const id = new mongoose.Types.ObjectId(userId);
        const result = await this.aggregate([
            { $match: { reviewee: id, revieweeType: userType } },
            {
                $group: {
                    _id: '$reviewee',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);
        return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };
    } catch (err) {
        console.error("getAverageRating Error:", err);
        return { averageRating: 0, totalReviews: 0 };
    }
};

module.exports = mongoose.model('Review', ReviewSchema);
