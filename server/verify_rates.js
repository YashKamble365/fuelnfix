
const mongoose = require('mongoose');
const ServiceRate = require('./models/ServiceRate');

const verifyRates = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/fuelnfix');
        console.log("Connected to DB");

        const rates = await ServiceRate.find({});
        console.log("All Service Rates:");
        console.table(rates.map(r => ({
            name: r.serviceName,
            category: r.category,
            price: r.pricePerLitre
        })));

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verifyRates();
