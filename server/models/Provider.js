const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    serviceType: {
        type: String,
        enum: ['Mechanic', 'Fuel Delivery', 'Towing', 'Flat Tire'],
        required: true
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
    },
    isAvailable: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Create geospatial index
ProviderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Provider', ProviderSchema);
