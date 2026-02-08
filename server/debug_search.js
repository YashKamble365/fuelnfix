const mongoose = require('mongoose');
const User = require('./models/User');
// require('dotenv').config();

const debugSearch = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/fuelnfix');
        console.log("Connected to DB");

        const serviceName = "Flat Tire";
        // Approximated Mumbai Coords
        const originLngNum = 72.8777;
        const originLatNum = 19.0760;

        console.log(`Searching for '${serviceName}' near [${originLngNum}, ${originLatNum}] with 5000km radius...`);

        const providers = await User.find({
            role: 'provider',
            isVerified: true,
            isOnline: true,
            'services.name': { $regex: new RegExp(`^${serviceName}$`, 'i') },
            'services.active': true,
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [originLngNum, originLatNum] },
                    $maxDistance: 5000000 // 5000km
                }
            }
        });

        console.log(`Found ${providers.length} providers.`);
        providers.forEach(p => console.log(`- ${p.name} (${p._id}) at ${JSON.stringify(p.location.coordinates)}`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

debugSearch();
