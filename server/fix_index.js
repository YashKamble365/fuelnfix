const mongoose = require('mongoose');
const User = require('./models/User');

const fixIndex = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/fuelnfix');
        console.log("Connected to DB");

        // CLEANUP: Fix users with missing coordinates or invalid structure
        console.log("Cleaning up invalid location data...");
        const res = await User.updateMany(
            { $or: [{ "location.type": { $exists: false } }, { "location.coordinates": { $exists: false } }] },
            { $set: { location: { type: 'Point', coordinates: [0, 0] } } }
        );
        console.log(`Updated ${res.modifiedCount} documents.`);

        console.log("Dropping indexes...");
        await User.collection.dropIndexes();
        console.log("Indexes dropped.");

        console.log("Ensuring new indexes...");
        await User.ensureIndexes(); // Re-create based on Schema
        console.log("New indexes created.");

        const indexes = await User.collection.getIndexes();
        console.log(JSON.stringify(indexes, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

fixIndex();
