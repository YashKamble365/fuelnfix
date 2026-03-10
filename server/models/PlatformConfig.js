const mongoose = require('mongoose');

const PlatformConfigSchema = new mongoose.Schema({
    // Only expect one document in this collection
    singletonId: { type: String, default: 'global_config', unique: true },
    platformFeePercentage: {
        type: Number,
        default: 5, // Default to 5%
        min: 0,
        max: 100
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PlatformConfig', PlatformConfigSchema);
