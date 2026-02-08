/**
 * Seed Script: Additional 25 Demo Providers for Amravati, Maharashtra
 * Run with: node seed_more_providers.js
 */

const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/fuelnfix';

// Additional providers spread across Amravati
const MORE_PROVIDERS = [
    // === MECHANIC ONLY ===
    { name: 'Akash Pawar', shopName: 'Pawar Auto Clinic', email: 'demo_akash@fuelnfix.com', providerCategory: ['Mechanic'], services: [{ name: 'Flat Tire', active: true }, { name: 'Dead Battery', active: true }], address: 'Wadali, Amravati', location: { type: 'Point', coordinates: [77.7420, 20.9320] } },
    { name: 'Tushar Ingle', shopName: 'Ingle Mechanics', email: 'demo_tushar@fuelnfix.com', providerCategory: ['Mechanic'], services: [{ name: 'Engine Trouble', active: true }, { name: 'Towing', active: true }], address: 'Ambadevi, Amravati', location: { type: 'Point', coordinates: [77.7850, 20.9420] } },
    { name: 'Pravin Shinde', shopName: 'Shinde Car Hospital', email: 'demo_pravin@fuelnfix.com', providerCategory: ['Mechanic'], services: [{ name: 'Key Lockout', active: true }, { name: 'Flat Tire', active: true }], address: 'Benoda, Amravati', location: { type: 'Point', coordinates: [77.7680, 20.9580] } },
    { name: 'Kiran Gaikwad', shopName: 'Gaikwad Motor Works', email: 'demo_kiran@fuelnfix.com', providerCategory: ['Mechanic'], services: [{ name: 'Dead Battery', active: true }, { name: 'Towing', active: true }], address: 'Frezarpura, Amravati', location: { type: 'Point', coordinates: [77.7920, 20.9280] } },
    { name: 'Sandip Chavan', shopName: 'Chavan Garage Zone', email: 'demo_sandip@fuelnfix.com', providerCategory: ['Mechanic'], services: [{ name: 'Engine Trouble', active: true }], address: 'Maltekdi, Amravati', location: { type: 'Point', coordinates: [77.7560, 20.9500] } },
    { name: 'Mangesh Thombre', shopName: 'Thombre Auto Fix', email: 'demo_mangesh@fuelnfix.com', providerCategory: ['Mechanic'], services: [{ name: 'Flat Tire', active: true }, { name: 'Key Lockout', active: true }], address: 'Satara Parisar, Amravati', location: { type: 'Point', coordinates: [77.8050, 20.9350] } },
    { name: 'Nitin Borkar', shopName: 'Borkar Quick Repair', email: 'demo_nitin@fuelnfix.com', providerCategory: ['Mechanic'], services: [{ name: 'Dead Battery', active: true }, { name: 'Engine Trouble', active: true }], address: 'Kathora Naka, Amravati', location: { type: 'Point', coordinates: [77.7350, 20.9450] } },

    // === FUEL DELIVERY ONLY ===
    { name: 'Vishal Kokate', shopName: 'Kokate Fuel Point', email: 'demo_vishal@fuelnfix.com', providerCategory: ['Fuel Delivery'], services: [{ name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Neemgaon, Amravati', location: { type: 'Point', coordinates: [77.7480, 20.9680] } },
    { name: 'Ajay Somkuwar', shopName: 'Somkuwar Fuel Express', email: 'demo_ajay@fuelnfix.com', providerCategory: ['Fuel Delivery'], services: [{ name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Chandur Bazar, Amravati', location: { type: 'Point', coordinates: [77.8150, 20.9550] } },
    { name: 'Rahul Deshpande', shopName: 'Deshpande Petroleum', email: 'demo_rahul@fuelnfix.com', providerCategory: ['Fuel Delivery'], services: [{ name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Dastur Nagar, Amravati', location: { type: 'Point', coordinates: [77.7600, 20.9150] } },
    { name: 'Umesh Tawade', shopName: 'Tawade Oil Services', email: 'demo_umesh@fuelnfix.com', providerCategory: ['Fuel Delivery'], services: [{ name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Bharat Nagar, Amravati', location: { type: 'Point', coordinates: [77.7750, 20.9700] } },
    { name: 'Yogesh Kharkar', shopName: 'Kharkar Fuel Hub', email: 'demo_yogesh@fuelnfix.com', providerCategory: ['Fuel Delivery'], services: [{ name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Jawahar Gate, Amravati', location: { type: 'Point', coordinates: [77.7880, 20.9180] } },
    { name: 'Swapnil Meshram', shopName: 'Meshram Energy', email: 'demo_swapnil@fuelnfix.com', providerCategory: ['Fuel Delivery'], services: [{ name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Nandgaon Peth, Amravati', location: { type: 'Point', coordinates: [77.7300, 20.9550] } },
    { name: 'Vaibhav Lokhande', shopName: 'Lokhande Fuel Stop', email: 'demo_vaibhav@fuelnfix.com', providerCategory: ['Fuel Delivery'], services: [{ name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Shegaon Road, Amravati', location: { type: 'Point', coordinates: [77.7520, 20.9050] } },

    // === BOTH MECHANIC + FUEL DELIVERY ===
    { name: 'Pratik Wagh', shopName: 'Wagh Complete Care', email: 'demo_pratik@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Flat Tire', active: true }, { name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Teosa Road, Amravati', location: { type: 'Point', coordinates: [77.8000, 20.9620] } },
    { name: 'Abhijit Ghate', shopName: 'Ghate Auto & Fuel', email: 'demo_abhijit@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Dead Battery', active: true }, { name: 'Towing', active: true }, { name: 'Petrol', active: true }], address: 'Daryapur Road, Amravati', location: { type: 'Point', coordinates: [77.7200, 20.9400] } },
    { name: 'Gaurav Nimje', shopName: 'Nimje Service Point', email: 'demo_gaurav@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Engine Trouble', active: true }, { name: 'Diesel', active: true }], address: 'Warud Road, Amravati', location: { type: 'Point', coordinates: [77.7950, 20.9080] } },
    { name: 'Omkar Zade', shopName: 'Zade Multi Services', email: 'demo_omkar@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Flat Tire', active: true }, { name: 'Key Lockout', active: true }, { name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Paratwada Road, Amravati', location: { type: 'Point', coordinates: [77.7380, 20.9200] } },
    { name: 'Rushikesh Vaidya', shopName: 'Vaidya Road Assist', email: 'demo_rushikesh@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Towing', active: true }, { name: 'Petrol', active: true }], address: 'Chandur Railway, Amravati', location: { type: 'Point', coordinates: [77.8100, 20.9450] } },
    { name: 'Suraj Khapre', shopName: 'Khapre Auto Hub', email: 'demo_suraj@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Dead Battery', active: true }, { name: 'Diesel', active: true }], address: 'Achalpur Highway, Amravati', location: { type: 'Point', coordinates: [77.7450, 20.9750] } },
    { name: 'Aniket Ghodke', shopName: 'Ghodke Express Care', email: 'demo_aniket@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Flat Tire', active: true }, { name: 'Engine Trouble', active: true }, { name: 'Petrol', active: true }], address: 'Badnera Junction, Amravati', location: { type: 'Point', coordinates: [77.7100, 20.9300] } },
    { name: 'Shubham Dorle', shopName: 'Dorle Roadside Pro', email: 'demo_shubham@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Towing', active: true }, { name: 'Key Lockout', active: true }, { name: 'Diesel', active: true }], address: 'MIDC Area, Amravati', location: { type: 'Point', coordinates: [77.7980, 20.9000] } },
    { name: 'Avinash Bawane', shopName: 'Bawane Total Care', email: 'demo_avinash@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Dead Battery', active: true }, { name: 'Flat Tire', active: true }, { name: 'Petrol', active: true }, { name: 'Diesel', active: true }], address: 'Rajura Bazaar, Amravati', location: { type: 'Point', coordinates: [77.7650, 20.9800] } },
    { name: 'Pankaj Urade', shopName: 'Urade Auto Zone', email: 'demo_pankaj@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Engine Trouble', active: true }, { name: 'Towing', active: true }, { name: 'Petrol', active: true }], address: 'Cotton Market, Amravati', location: { type: 'Point', coordinates: [77.7830, 20.9250] } },
    { name: 'Hemant Kawale', shopName: 'Kawale All-in-One', email: 'demo_hemant@fuelnfix.com', providerCategory: ['Mechanic', 'Fuel Delivery'], services: [{ name: 'Key Lockout', active: true }, { name: 'Diesel', active: true }], address: 'Bus Stand Road, Amravati', location: { type: 'Point', coordinates: [77.7580, 20.9380] } },
];

async function seedMoreProviders() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Insert new demo providers
        for (const provider of MORE_PROVIDERS) {
            // Check if already exists
            const existing = await User.findOne({ email: provider.email });
            if (existing) {
                console.log(`Skipped (exists): ${provider.shopName}`);
                continue;
            }

            const newProvider = new User({
                ...provider,
                role: 'provider',
                isVerified: true,
                isOnline: true,
                photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=random&size=128`
            });
            await newProvider.save();
            console.log(`Created: ${provider.shopName} (${provider.providerCategory.join(', ')})`);
        }

        console.log(`\n✅ Successfully added ${MORE_PROVIDERS.length} more demo providers!`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedMoreProviders();
