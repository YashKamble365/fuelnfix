const mongoose = require('mongoose');
const Request = require('./models/Request');
const User = require('./models/User');
require('dotenv').config();

const checkOTP = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB:", process.env.MONGO_URI ? "URI Loaded" : "URI Missing");

        // Test writing to the most recent request
        const latestInfo = await Request.findOne().sort({ _id: -1 });
        if (latestInfo) {
            console.log(`Latest Request ID: ${latestInfo._id}`);
            console.log(`Category: '${latestInfo.category}'`); // Check if this is undefined/null
            console.log(`Service OTP: ${latestInfo.serviceOtp}`);
        }

        // Find the specific user (assuming email or name, but let's just list recent requests)
        const requests = await Request.find().sort({ _id: -1 }).limit(5).populate('provider customer');

        console.log("--- RECENT REQUESTS ---");
        requests.forEach(r => {
            console.log(`ID: ${r._id}`);
            console.log(`Created: ${r.createdAt}`);
            console.log(`Status: ${r.status}`);
            console.log(`Customer: ${r.customer?.name}`);
            console.log(`Provider: ${r.provider?.name}`);
            console.log(`OTP: ${r.serviceOtp}`);
            console.log(`OTP Verified: ${r.otpVerified}`);
            console.log("-----------------------");
        });

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkOTP();
