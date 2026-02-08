const mongoose = require('mongoose');
const ServiceRate = require('./models/ServiceRate');

const MONGO_URI = 'mongodb://localhost:27017/fuelnfix';

async function checkRates() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const rates = await ServiceRate.find({});
        console.log(`Found ${rates.length} service rates:`);
        rates.forEach(r => {
            console.log(`- ${r.serviceName} (${r.category}): Base ₹${r.basePrice}, Per KM ₹${r.pricePerKm}, Per Litre ₹${r.pricePerLitre || 0}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkRates();
