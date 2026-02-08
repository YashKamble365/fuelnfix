const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/fuelnfix';

async function debugSearch() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const providers = await User.find({ role: 'provider' });
        console.log(`Found ${providers.length} providers total.`);

        providers.forEach(p => {
            console.log(`- Provider: "${p.name}" (Shop: "${p.shopName}"), Category: ${JSON.stringify(p.providerCategory)}, Services: ${p.services.length}`);
            if (p.location) console.log(`  Location: ${JSON.stringify(p.location.coordinates)}`);
            console.log(`  Verified: ${p.isVerified}, Online: ${p.isOnline}`);
        });

        const users = await User.find({ role: 'user' });
        const yash = users.find(u => u.name.toLowerCase().includes('yash'));
        if (yash) {
            console.log(`- User Yash: "${yash.name}", Location: ${JSON.stringify(yash.location?.coordinates)}`);
        } else {
            console.log('User Yash not found.');
            console.log('Available Users:', users.map(u => u.name));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugSearch();
