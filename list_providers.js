const mongoose = require('mongoose');
const User = require('./server/models/User');

mongoose.connect('mongodb+srv://yashkamble:Yash123@cluster0.1w522.mongodb.net/fuelnfix?retryWrites=true&w=majority&appName=Cluster0')
    .then(async () => {
        console.log('Connected to DB');
        const providers = await User.find({ role: 'provider' });
        providers.forEach(p => {
            console.log(`ID: ${p._id}, Name: ${p.name}, Email: ${p.email}, Category: ${p.providerCategory}`);
        });
        process.exit();
    })
    .catch(err => console.error(err));
