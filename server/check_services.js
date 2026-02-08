const mongoose = require('mongoose');
const ServiceRate = require('./models/ServiceRate');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fuelnfix';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const services = await ServiceRate.find({});
        console.log('--- Services Found ---');
        services.forEach(s => console.log(`${s.category}: ${s.serviceName}`));
        console.log('----------------------');
        mongoose.disconnect();
    })
    .catch(err => console.error(err));
