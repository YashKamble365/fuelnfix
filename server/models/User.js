const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Verified by Google
    phone: { type: String, unique: true, sparse: true }, // Verified to allow multiple nulls
    photoUrl: { type: String },
    password: { type: String },
    vehicles: [{
        model: { type: String },
        fuelType: { type: String, enum: ['Petrol', 'Diesel', 'CNG', 'Electric'] },
        plateNumber: { type: String }
    }],
    role: { type: String, default: 'user' }, // user, provider, admin
    providerCategory: {
        type: [String],
        enum: ['Mechanic', 'Fuel Delivery', 'EV Support'],
        default: []
    }, // Can be both

    // Provider Specific Fields
    shopName: { type: String },
    services: { type: [mongoose.Schema.Types.Mixed], default: [] },
    isOnline: { type: Boolean, default: false },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] } // [longitude, latitude] - PERMANENT SHOP LOCATION
    },
    liveLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] } // [longitude, latitude] - REAL-TIME GPS
    },
    address: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationDocs: {
        shopPhoto: { type: String },
        businessProof: { type: String }
    },
    pendingUpdate: {
        status: { type: String, enum: ['Pending', 'Rejected', 'None'], default: 'None' },
        data: {
            shopName: String,
            address: String,
            phone: String,
            location: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: { type: [Number] }
            }
        },
        requestedAt: Date
    },
    // Review/Rating fields
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Index specifically for GeoJSON queries
UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
