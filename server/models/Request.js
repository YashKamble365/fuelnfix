const mongoose = require('mongoose');


// Trigger Schema Reload
const RequestSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Initially null until accepted
    // Category separation
    category: {
        type: String,
        enum: ['Mechanic', 'Fuel Delivery', 'EV Support'],
        required: true
    },
    // Fuel Specific details
    fuelDetails: {
        fuelType: { type: String, enum: ['Petrol', 'Diesel'] },
        quantity: { type: Number }, // Litres (entered by provider upon completion)
        rate: { type: Number } // Cost per litre
    },
    serviceTypes: { type: [String] }, // Array of service names (Required for Mechanic, Optional for Fuel)
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Arrived', 'In Progress', 'Completed', 'Cancelled', 'Expired'],
        default: 'Pending'
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true }, // [lng, lat]
        address: { type: String }
    },
    vehicle: {
        model: String,
        plateNumber: String,
        fuelType: String
    },
    pricing: {
        baseFee: { type: Number, required: true },
        distanceMetric: { type: Number }, // In km
        pricePerKm: { type: Number },
        distanceFee: { type: Number },
        materialCost: { type: Number, default: 0 },
        totalAmount: { type: Number }
    },
    timestamps: {
        createdAt: { type: Date, default: Date.now },
        completedAt: { type: Date }
    },
    problemPhotoUrl: { type: String },
    chatHistory: [{
        sender: { type: String, enum: ['User', 'Provider'] },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    // Billing fields
    bill: [{
        name: { type: String },
        cost: { type: Number }
    }],
    billSent: { type: Boolean, default: false },
    billSentAt: { type: Date },
    paymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    paymentId: { type: String },
    paymentCompletedAt: { type: Date },
    assignedPerson: {
        name: { type: String },
        phone: { type: String }
    },
    // OTP Service Verification
    serviceOtp: { type: String },
    otpVerified: { type: Boolean, default: false },
    otpGeneratedAt: { type: Date },
    otpVerifiedAt: { type: Date }
});

// Index for geospatial queries if needed later
RequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Request', RequestSchema);
