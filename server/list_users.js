const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fuelnfix';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const users = await User.find({}, 'name email role isVerified');
        console.log('--- Users Found ---');
        users.forEach(u => console.log(`${u.email} (${u.role}) - Verified: ${u.isVerified}`));
        console.log('-------------------');
        mongoose.disconnect();
    })
    .catch(err => console.error(err));
