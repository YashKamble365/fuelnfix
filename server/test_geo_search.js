const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/fuelnfix';

async function testGeoSearch() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Test coordinates - roughly where providers are located
        const testLng = 77.76;
        const testLat = 20.97;

        console.log(`\nTesting geo search from [${testLng}, ${testLat}]...`);

        // Simple query without category filter
        const providers = await User.find({
            role: 'provider',
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [testLng, testLat] },
                    $maxDistance: 5000000
                }
            }
        });

        console.log(`Found ${providers.length} providers:`);
        providers.forEach(p => {
            console.log(`- ${p.shopName || p.name}: Location ${JSON.stringify(p.location?.coordinates)}`);
        });

        if (providers.length === 0) {
            console.log('\nNo providers found. Checking if any providers exist...');
            const allProviders = await User.find({ role: 'provider' });
            console.log(`Total providers in DB: ${allProviders.length}`);
            allProviders.forEach(p => {
                console.log(`- ${p.shopName || p.name}: Location ${JSON.stringify(p.location)}`);
            });
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

testGeoSearch();
