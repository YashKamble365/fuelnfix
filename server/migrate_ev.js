const mongoose = require('mongoose');
const User = require('./models/User');
const ServiceRate = require('./models/ServiceRate');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fuelnfix';

const migrateProviders = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Get Default EV Services
        const evServicesRate = await ServiceRate.find({ category: 'EV Support' });
        if (evServicesRate.length === 0) {
            console.log('No EV Services found in ServiceRate. Run server to seed defaults first.');
            // We can manually add them here just in case, but let's assume seedDefaults ran
            const defaultEV = [
                { serviceName: 'Mobile EV Charging', basePrice: 800, description: 'Emergency roadside charging' },
                { serviceName: 'Flatbed Towing', basePrice: 1500, description: 'Safe towing for EVs' },
                { serviceName: 'EV Battery Jumpstart', basePrice: 600, description: '12V accessory battery jumpstart' },
                { serviceName: 'Cable Unlock', basePrice: 400, description: 'Stuck charging cable release' }
            ];
            // We will use these names to construct the user services
            evServicesRate.push(...defaultEV);
        }

        const evServiceObjects = evServicesRate.map(s => ({
            name: s.serviceName,
            price: s.basePrice,
            active: true,
            description: s.description || 'EV Service'
        }));

        console.log('EV Services to add:', evServiceObjects.map(s => s.name));

        // 2. Find Providers (Role = provider)
        const providers = await User.find({ role: 'provider' });
        console.log(`Found ${providers.length} providers.`);

        // 3. Update ~60% of them to support EV
        let updatedCount = 0;
        for (const provider of providers) {
            // Randomly decide (or if they are Mechanic)
            // Let's make most Mechanics also EV Support
            const isMechanic = provider.providerCategory.includes('Mechanic');

            // 70% chance if Mechanic, 30% chance otherwise
            const shouldAdd = isMechanic ? Math.random() < 0.7 : Math.random() < 0.3;

            if (shouldAdd) {
                // Add 'EV Support' to category
                if (!provider.providerCategory.includes('EV Support')) {
                    provider.providerCategory.push('EV Support');
                }

                // Add EV services to their service list (avoid duplicates)
                for (const newService of evServiceObjects) {
                    const exists = provider.services.some(s => s.name === newService.name);
                    if (!exists) {
                        provider.services.push(newService);
                    }
                }

                await provider.save();
                updatedCount++;
                console.log(`Updated provider: ${provider.name} (${provider._id})`);
            }
        }

        console.log(`Migration Complete. Updated ${updatedCount} providers.`);
        process.exit(0);

    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrateProviders();
