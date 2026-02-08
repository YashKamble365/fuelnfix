const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const verifyLocations = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/fuelnfix');
        console.log("Connected to DB");

        const users = await User.find({}, 'name role location');

        console.log("\n--- USER LOCATION DATA ---");
        users.forEach(u => {
            const hasLoc = u.location && u.location.coordinates && u.location.coordinates.length === 2;
            console.log(`[${u.role.toUpperCase()}] ${u.name}: ${hasLoc ? `✅ ${u.location.coordinates[1]}, ${u.location.coordinates[0]}` : '❌ NO LOCATION'}`);
            if (hasLoc) {
                console.log(`      JSON: ${JSON.stringify(u.location)}`);
            }
        });

        console.log("\n--------------------------");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyLocations();
