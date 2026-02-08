const { execSync } = require('child_process');
require('dotenv').config();

const LOCAL_URI = 'mongodb://localhost:27017/fuelnfix';
const ATLAS_URI = process.env.MONGO_URI;

// Check if ATLAS_URI is set and different from local
if (!ATLAS_URI || ATLAS_URI.includes('localhost') || ATLAS_URI.includes('127.0.0.1')) {
    console.error('❌ Error: MONGO_URI in .env is either missing or pointing to localhost.');
    console.error('Please set MONGO_URI to your MongoDB Atlas connection string first.');
    process.exit(1);
}

console.log('🚀 Starting Migration: Localhost -> Atlas');
console.log('----------------------------------------');
console.log(`📍 Local Source: ${LOCAL_URI}`);
console.log(`☁️  Atlas Dest:   ${ATLAS_URI.split('@')[1]}`); // Hide credentials
console.log('----------------------------------------');

try {
    // 1. Dump Local Data
    console.log('📦 Step 1: Dumping local database...');
    execSync(`mongodump --uri="${LOCAL_URI}" --archive="fuelnfix_backup.gz" --gzip`, { stdio: 'inherit' });
    console.log('✅ Dump successful: fuelnfix_backup.gz created');

    // 2. Restore to Atlas
    console.log('\n📤 Step 2: Restoring to Atlas (this may take a minute)...');
    execSync(`mongorestore --uri="${ATLAS_URI}" --archive="fuelnfix_backup.gz" --gzip --drop`, { stdio: 'inherit' });
    console.log('✅ Restore successful!');

    console.log('\n----------------------------------------');
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('Your local data is now live on MongoDB Atlas.');
    console.log('----------------------------------------');

    // Optional: Cleanup
    // execSync('rm fuelnfix_backup.gz');

} catch (error) {
    console.error('\n❌ Migration Failed:', error.message);
    process.exit(1);
}
