const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/fuelnfix';

async function fixData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fix Axion Services Category
        const axion = await User.findOne({ shopName: /axion services/i });
        if (axion) {
            console.log('Updating Axion Services categories...');
            axion.providerCategory = ['Fuel Delivery'];
            await axion.save();
            console.log('Axion Services updated.');
        } else {
            console.log('Axion Services not found.');
        }

        // 2. Fix User Yash Kamble Location (Set it near providers for testing)
        // Provider is at roughly [77.76, 20.97]
        const yash = await User.findOne({ name: /Yash Kamble/i, role: 'user' });
        if (yash) {
            console.log('Updating Yash Kamble user location...');
            yash.location = {
                type: 'Point',
                coordinates: [77.75, 20.96] // Near providers
            };
            await yash.save();
            console.log('Yash Kamble location updated.');
        } else {
            console.log('User Yash Kamble not found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

fixData();
