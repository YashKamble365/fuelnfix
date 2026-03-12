const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const Review = require('./models/Review');
const User = require('./models/User');
const Provider = require('./models/Provider');

async function check() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        
        const reviews = await Review.find()
            .populate('reviewer')
            .populate('reviewee');
        
        console.log('Total Reviews:', reviews.length);
        
        const missing = reviews.filter(r => !r.reviewer || !r.reviewee);
        console.log('Reviews with missing population:', missing.length);
        
        if (missing.length > 0) {
            for (let i = 0; i < Math.min(missing.length, 10); i++) {
                const r = missing[i];
                console.log(`\n--- Review ${i+1} ---`);
                console.log('ID:', r._id);
                console.log('Reviewer ID (Raw):', r.get('reviewer'));
                console.log('Reviewer Type:', r.reviewerType);
                console.log('Reviewer Populated:', !!r.reviewer);
                console.log('Reviewee ID (Raw):', r.get('reviewee'));
                console.log('Reviewee Type:', r.revieweeType);
                console.log('Reviewee Populated:', !!r.reviewee);
                
                // Check if they exist in Provider collection if User population failed
                if (!r.reviewer && r.reviewerType === 'Provider') {
                    const p = await Provider.findById(r.get('reviewer'));
                    console.log('Exists in Provider Collection?', !!p);
                    if (p) console.log('Provider Name:', p.name);
                }
                if (!r.reviewee && r.revieweeType === 'Provider') {
                    const p = await Provider.findById(r.get('reviewee'));
                    console.log('Exists in Provider Collection?', !!p);
                    if (p) console.log('Provider Name:', p.name);
                }
                
                 // Check if they exist in User collection (maybe ref was wrong)
                if (!r.reviewer) {
                    const u = await User.findById(r.get('reviewer'));
                    console.log('Exists in User Collection?', !!u);
                }
                if (!r.reviewee) {
                    const u = await User.findById(r.get('reviewee'));
                    console.log('Exists in User Collection?', !!u);
                }
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

check();
