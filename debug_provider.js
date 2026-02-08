const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config({ path: './server/.env' });

const checkProvider = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        console.log("--- Indexes ---");
        const indexes = await User.collection.getIndexes();
        console.log(JSON.stringify(indexes, null, 2));

        console.log("\n--- Provider Data ---");
        // Find a provider
        const provider = await User.findOne({ role: 'provider' });
        if (provider) {
            console.log("Name:", provider.name);
            console.log("ID:", provider._id);
            console.log("Role:", provider.role);
            console.log("isVerified:", provider.isVerified);
            console.log("isOnline:", provider.isOnline);
            console.log("Location:", JSON.stringify(provider.location, null, 2));
            console.log("Services:", JSON.stringify(provider.services, null, 2));
        } else {
            console.log("No provider found in DB");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkProvider();
