const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fuelnfix';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const result = await User.deleteOne({ email: 'yashkamble639@gmail.com' });
        if (result.deletedCount > 0) {
            console.log('✅ Successfully deleted user: yashkamble639@gmail.com');
        } else {
            console.log('⚠️  User not found: yashkamble639@gmail.com');
        }
        mongoose.disconnect();
    })
    .catch(err => console.error(err));
