const mongoose = require('mongoose');
const User = require('./models/User');
const ServiceRate = require('./models/ServiceRate');

const debugMultiSearch = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/fuelnfix');
        console.log("Connected to DB");

        const serviceNames = ["Flat Tire", "Dead Battery"];
        const originLngNum = 72.8777; // Mumbai
        const originLatNum = 19.0760;

        console.log(`Searching for providers with ALL: ${serviceNames.join(', ')}...`);

        // Update Yash K to have Dead Battery for testing
        await User.updateOne(
            { name: 'Yash K' },
            { $addToSet: { services: { name: 'Dead Battery', active: true, pricePerKm: 20 } } }
        );
        console.log("Updated Yash K with Dead Battery feature.");

        // Debug: List all providers first
        const allProviders = await User.find({ role: 'provider' });
        console.log("--- DEBUG: ALL PROVIDERS ---");
        allProviders.forEach(p => {
            const sNames = p.services ? p.services.map(s => `${s.name}(${s.active})`).join(', ') : 'None';
            console.log(`Provider: ${p.name}, Services: ${sNames}`);
        });
        console.log("----------------------------");

        // 1. Get Rates
        const rates = await ServiceRate.find({ serviceName: { $in: serviceNames } });
        console.log("Rates found:", rates.map(r => r.serviceName));

        const bundleBasePrice = rates.reduce((sum, r) => sum + r.basePrice, 0);
        const bundlePricePerKm = Math.max(...rates.map(r => r.pricePerKm));
        console.log(`Bundle Base: ${bundleBasePrice}, PerKm: ${bundlePricePerKm}`);

        // 2. Query
        const query = {
            role: 'provider',
            isVerified: true,
            isOnline: true,
            'services.active': true,
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [originLngNum, originLatNum] },
                    $maxDistance: 5000000
                }
            }
        };

        if (serviceNames.length > 0) {
            query.services = {
                $all: serviceNames.map(name => ({
                    $elemMatch: { name: { $regex: new RegExp(`^${name}$`, 'i') }, active: true }
                }))
            };
        }

        const providers = await User.find(query);
        console.log(`Found ${providers.length} providers.`);
        providers.forEach(p => {
            console.log(`- ${p.name}: ` + p.services.map(s => s.name).join(', '));
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

debugMultiSearch();
