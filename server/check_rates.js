const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const ServiceRate = require('./models/ServiceRate');

const checkRates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const rates = await ServiceRate.find();
        console.log(JSON.stringify(rates, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkRates();
