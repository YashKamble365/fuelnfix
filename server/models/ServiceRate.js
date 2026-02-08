const mongoose = require('mongoose');

const ServiceRateSchema = new mongoose.Schema({
    serviceName: { type: String, required: true, unique: true },
    category: { type: String, enum: ['Mechanic', 'Fuel Delivery', 'EV Support'], default: 'Mechanic' },
    fuelType: { type: String, enum: ['Petrol', 'Diesel', null], default: null }, // Only for Fuel Delivery

    basePrice: { type: Number, required: true }, // Base Fee / Delivery Charge
    pricePerKm: { type: Number, required: true, default: 0 },
    pricePerLitre: { type: Number, default: 0 }, // Only for Fuel

    description: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

// Seed defaults if not exists
const ServiceRate = mongoose.model('ServiceRate', ServiceRateSchema);

const seedDefaults = async () => {
    const defaults = [
        { serviceName: 'Flat Tire', basePrice: 300, description: 'Puncture repair or tyre change' },
        { serviceName: 'Dead Battery', basePrice: 500, description: 'Jumpstart service' },
        { serviceName: 'Towing', basePrice: 1200, pricePerKm: 40, description: 'Base fare for first 5km + rate per km' },
        { serviceName: 'Fuel Delivery', basePrice: 200, description: 'Service charge only. Fuel cost extra.' },
        { serviceName: 'Key Lockout', basePrice: 600, description: 'Car door unlocking service' },
        { serviceName: 'Engine Trouble', basePrice: 500, description: 'Initial inspection and minor fixes' },
        // EV Specific Services
        { serviceName: 'Mobile EV Charging', basePrice: 800, category: 'EV Support', description: 'Emergency top-up (5-10km range)' },
        { serviceName: 'Flatbed Towing', basePrice: 1500, pricePerKm: 50, category: 'EV Support', description: 'Safe towing for EVs (No wheel formatting)' },
        { serviceName: 'EV Battery Jumpstart', basePrice: 600, category: 'EV Support', description: '12V accessory battery boost' },
        { serviceName: 'Cable Unlock', basePrice: 400, category: 'EV Support', description: 'Stuck charging cable release' }
    ];

    for (const service of defaults) {
        const exists = await ServiceRate.findOne({ serviceName: service.serviceName });
        if (!exists) {
            await ServiceRate.create(service);
            console.log(`Seeded Service Rate: ${service.serviceName}`);
        }
    }
};

// Auto-seed on load (for simplicity in this project phase)
// In production, this would be a separate script
// Auto-seed moved to index.js
// setTimeout(seedDefaults, 5000);

ServiceRate.seedDefaults = seedDefaults;
module.exports = ServiceRate;
