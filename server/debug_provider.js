const mongoose = require('mongoose');
const User = require('./models/User');
// require('dotenv').config();

const checkProvider = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/fuelnfix');
        console.log("Connected to DB");

        console.log("--- Indexes ---");
        const indexes = await User.collection.getIndexes();
        console.log(JSON.stringify(indexes, null, 2));

        console.log("\n--- Provider Data ---");
        // Find a provider
        const providers = await User.find({ role: 'provider' });
        console.log(`Found ${providers.length} providers.`);

        providers.forEach(p => {
            console.log(`\nProvider: ${p.name} (${p._id})`);
            console.log("isVerified:", p.isVerified);
            console.log("isOnline:", p.isOnline);
            console.log("Location:", JSON.stringify(p.location));
            console.log("Services:", JSON.stringify(p.services));
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkProvider();
