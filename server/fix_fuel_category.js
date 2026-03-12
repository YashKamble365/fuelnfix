const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const ServiceRate = require('./models/ServiceRate');

const updateCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await ServiceRate.updateMany(
            { serviceName: 'Fuel Delivery' },
            { $set: { category: 'Fuel Delivery' } }
        );

        console.log(`Updated ${result.modifiedCount} Service Rates.`);
        process.exit(0);
    } catch (err) {
        console.error('Update Error:', err);
        process.exit(1);
    }
};

updateCategories();
