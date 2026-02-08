const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Provider = require('../models/Provider');

// Submit a review
router.post('/submit', async (req, res) => {
    try {
        const {
            requestId,
            reviewerId,
            reviewerType,
            revieweeId,
            revieweeType,
            rating,
            comment,
            serviceTypes
        } = req.body;

        console.log('[Review Submit] Received data:', { requestId, reviewerId, reviewerType, revieweeId, revieweeType, rating });

        // Validate required fields
        if (!revieweeId) {
            return res.status(400).json({ message: 'Reviewee ID is required' });
        }
        if (!reviewerId) {
            return res.status(400).json({ message: 'Reviewer ID is required' });
        }
        if (!requestId) {
            return res.status(400).json({ message: 'Request ID is required' });
        }

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if review already exists for this request from this reviewer
        const existingReview = await Review.findOne({
            request: requestId,
            reviewer: reviewerId,
            reviewerType: reviewerType
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this service' });
        }

        // Create new review
        const review = new Review({
            request: requestId,
            reviewer: reviewerId,
            reviewerType,
            reviewee: revieweeId,
            revieweeType,
            rating,
            comment: comment || '',
            serviceTypes: serviceTypes || []
        });

        await review.save();

        // Update the reviewee's average rating
        const avgData = await Review.getAverageRating(revieweeId, revieweeType);

        // ALWAYS update the User document because that is where the search/dashboard logic fetches from.
        // Even if we have a legacy Provider model, the primary account is in the User collection.
        await User.findByIdAndUpdate(revieweeId, {
            averageRating: parseFloat(avgData.averageRating.toFixed(1)),
            totalReviews: avgData.totalReviews
        });

        // Optional: If they are a provider, also update the backup Provider model if it exists
        if (revieweeType === 'Provider') {
            try {
                const providerExists = await Provider.findById(revieweeId);
                if (providerExists) {
                    await Provider.findByIdAndUpdate(revieweeId, {
                        averageRating: parseFloat(avgData.averageRating.toFixed(1)),
                        totalReviews: avgData.totalReviews
                    });
                }
            } catch (err) {
                console.warn('[Review Submit] Backup Provider record NOT updated (might not exist):', err.message);
            }
        }

        res.json({
            success: true,
            review,
            averageRating: avgData.averageRating.toFixed(1),
            totalReviews: avgData.totalReviews
        });

    } catch (error) {
        console.error('Submit Review Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Admin: Get all reviews (MUST be before /:type/:id to avoid route conflict)
router.get('/admin/all', async (req, res) => {
    try {
        const { type, limit = 50, skip = 0 } = req.query;

        let query = {};
        if (type === 'provider') {
            query.revieweeType = 'Provider';
        } else if (type === 'user') {
            query.revieweeType = 'User';
        }

        const reviews = await Review.find(query)
            .populate('reviewer', 'name email shopName')
            .populate('reviewee', 'name email shopName')
            .populate('request', 'serviceTypes status')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Review.countDocuments(query);

        res.json({
            reviews,
            total,
            hasMore: total > parseInt(skip) + reviews.length
        });

    } catch (error) {
        console.error('Get All Reviews Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get reviews for a user/provider
router.get('/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const { limit = 10, skip = 0 } = req.query;

        const reviews = await Review.find({
            reviewee: id,
            revieweeType: type
        })
            .populate('reviewer', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const avgData = await Review.getAverageRating(id, type);

        res.json({
            reviews,
            averageRating: avgData.averageRating?.toFixed(1) || '0.0',
            totalReviews: avgData.totalReviews || 0
        });

    } catch (error) {
        console.error('Get Reviews Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Check if review exists for a request
router.get('/check/:requestId/:reviewerId/:reviewerType', async (req, res) => {
    try {
        const { requestId, reviewerId, reviewerType } = req.params;

        const existingReview = await Review.findOne({
            request: requestId,
            reviewer: reviewerId,
            reviewerType
        });

        res.json({
            hasReviewed: !!existingReview,
            review: existingReview
        });

    } catch (error) {
        console.error('Check Review Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
