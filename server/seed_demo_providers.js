/**
 * Seed Script: Demo Providers for Amravati, Maharashtra
 * 
 * This script creates demo providers spread across Amravati city region (~2km apart).
 * Run with: node seed_demo_providers.js
 */

const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/fuelnfix';

// Amravati City Center: 20.9374° N, 77.7796° E
// We'll create a grid of providers around this center

const DEMO_PROVIDERS = [
    // === MECHANIC ONLY ===
    {
        name: 'Rajesh Patil',
        email: 'demo_rajesh@fuelnfix.com',
        shopName: 'Rajesh Auto Works',
        providerCategory: ['Mechanic'],
        services: [
            { name: 'Flat Tire', active: true },
            { name: 'Dead Battery', active: true },
            { name: 'Engine Trouble', active: true }
        ],
        address: 'Camp Area, Amravati',
        location: { type: 'Point', coordinates: [77.7796, 20.9374] } // City Center
    },
    {
        name: 'Sunil Deshmukh',
        email: 'demo_sunil@fuelnfix.com',
        shopName: 'Deshmukh Motors',
        providerCategory: ['Mechanic'],
        services: [
            { name: 'Flat Tire', active: true },
            { name: 'Towing', active: true },
            { name: 'Key Lockout', active: true }
        ],
        address: 'Rajapeth, Amravati',
        location: { type: 'Point', coordinates: [77.7620, 20.9450] } // ~2km NW
    },
    {
        name: 'Amit Sharma',
        email: 'demo_amit@fuelnfix.com',
        shopName: 'Sharma Car Care',
        providerCategory: ['Mechanic'],
        services: [
            { name: 'Dead Battery', active: true },
            { name: 'Engine Trouble', active: true }
        ],
        address: 'Badnera Road, Amravati',
        location: { type: 'Point', coordinates: [77.7950, 20.9200] } // ~2km SE
    },
    {
        name: 'Vikram Jadhav',
        email: 'demo_vikram@fuelnfix.com',
        shopName: 'Jadhav Garage',
        providerCategory: ['Mechanic'],
        services: [
            { name: 'Flat Tire', active: true },
            { name: 'Towing', active: true },
            { name: 'Dead Battery', active: true },
            { name: 'Engine Trouble', active: true }
        ],
        address: 'Nagpur Road, Amravati',
        location: { type: 'Point', coordinates: [77.8000, 20.9500] } // ~2km NE
    },

    // === FUEL DELIVERY ONLY ===
    {
        name: 'Prashant Wankhede',
        email: 'demo_prashant@fuelnfix.com',
        shopName: 'Quick Fuel Express',
        providerCategory: ['Fuel Delivery'],
        services: [
            { name: 'Petrol', active: true },
            { name: 'Diesel', active: true }
        ],
        address: 'Irwin Bridge, Amravati',
        location: { type: 'Point', coordinates: [77.7700, 20.9550] } // ~2km N
    },
    {
        name: 'Nikhil Thakur',
        email: 'demo_nikhil@fuelnfix.com',
        shopName: 'Thakur Fuel Services',
        providerCategory: ['Fuel Delivery'],
        services: [
            { name: 'Petrol', active: true },
            { name: 'Diesel', active: true }
        ],
        address: 'Morshi Road, Amravati',
        location: { type: 'Point', coordinates: [77.7550, 20.9250] } // ~2km SW
    },
    {
        name: 'Sachin Gawande',
        email: 'demo_sachin@fuelnfix.com',
        shopName: 'Gawande Petroleum',
        providerCategory: ['Fuel Delivery'],
        services: [
            { name: 'Petrol', active: true },
            { name: 'Diesel', active: true }
        ],
        address: 'Tapovan Road, Amravati',
        location: { type: 'Point', coordinates: [77.7900, 20.9650] } // ~3km NE
    },
    {
        name: 'Rohit Kulkarni',
        email: 'demo_rohit@fuelnfix.com',
        shopName: 'Kulkarni Oil Depot',
        providerCategory: ['Fuel Delivery'],
        services: [
            { name: 'Petrol', active: true },
            { name: 'Diesel', active: true }
        ],
        address: 'Chhatri Talao, Amravati',
        location: { type: 'Point', coordinates: [77.7650, 20.9100] } // ~3km S
    },

    // === BOTH MECHANIC + FUEL DELIVERY ===
    {
        name: 'Mahesh Ingole',
        email: 'demo_mahesh@fuelnfix.com',
        shopName: 'Ingole Auto & Fuel',
        providerCategory: ['Mechanic', 'Fuel Delivery'],
        services: [
            { name: 'Flat Tire', active: true },
            { name: 'Dead Battery', active: true },
            { name: 'Petrol', active: true },
            { name: 'Diesel', active: true }
        ],
        address: 'Gadge Nagar, Amravati',
        location: { type: 'Point', coordinates: [77.7850, 20.9300] } // ~2km E
    },
    {
        name: 'Anil Bhagat',
        email: 'demo_anil@fuelnfix.com',
        shopName: 'Bhagat Service Station',
        providerCategory: ['Mechanic', 'Fuel Delivery'],
        services: [
            { name: 'Towing', active: true },
            { name: 'Engine Trouble', active: true },
            { name: 'Petrol', active: true },
            { name: 'Diesel', active: true }
        ],
        address: 'Warud Naka, Amravati',
        location: { type: 'Point', coordinates: [77.7500, 20.9400] } // ~3km W
    },
    {
        name: 'Sanjay Raut',
        email: 'demo_sanjay@fuelnfix.com',
        shopName: 'Raut Complete Care',
        providerCategory: ['Mechanic', 'Fuel Delivery'],
        services: [
            { name: 'Flat Tire', active: true },
            { name: 'Key Lockout', active: true },
            { name: 'Petrol', active: true }
        ],
        address: 'Anjangaon Naka, Amravati',
        location: { type: 'Point', coordinates: [77.8100, 20.9380] } // ~3km E
    },
    {
        name: 'Deepak More',
        email: 'demo_deepak@fuelnfix.com',
        shopName: 'More Motors & Fuel',
        providerCategory: ['Mechanic', 'Fuel Delivery'],
        services: [
            { name: 'Dead Battery', active: true },
            { name: 'Towing', active: true },
            { name: 'Diesel', active: true }
        ],
        address: 'Achalpur Road, Amravati',
        location: { type: 'Point', coordinates: [77.7400, 20.9600] } // ~4km NW
    },
    {
        name: 'Vijay Kale',
        email: 'demo_vijay@fuelnfix.com',
        shopName: 'Kale Roadside Assist',
        providerCategory: ['Mechanic', 'Fuel Delivery'],
        services: [
            { name: 'Flat Tire', active: true },
            { name: 'Dead Battery', active: true },
            { name: 'Engine Trouble', active: true },
            { name: 'Petrol', active: true },
            { name: 'Diesel', active: true }
        ],
        address: 'Shivaji Nagar, Amravati',
        location: { type: 'Point', coordinates: [77.7750, 20.9480] } // ~1km N
    },
    {
        name: 'Ganesh Sawant',
        email: 'demo_ganesh@fuelnfix.com',
        shopName: 'Sawant Auto Hub',
        providerCategory: ['Mechanic', 'Fuel Delivery'],
        services: [
            { name: 'Towing', active: true },
            { name: 'Key Lockout', active: true },
            { name: 'Petrol', active: true },
            { name: 'Diesel', active: true }
        ],
        address: 'Rukmini Nagar, Amravati',
        location: { type: 'Point', coordinates: [77.7680, 20.9220] } // ~2km S
    }
];

async function seedDemoProviders() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete existing demo providers (by email pattern)
        const deleteResult = await User.deleteMany({ email: /^demo_.*@fuelnfix\.com$/ });
        console.log(`Deleted ${deleteResult.deletedCount} existing demo providers.`);

        // Insert new demo providers
        for (const provider of DEMO_PROVIDERS) {
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

        console.log(`\n✅ Successfully seeded ${DEMO_PROVIDERS.length} demo providers!`);
        console.log('\nDemo Provider Emails (for reference):');
        DEMO_PROVIDERS.forEach(p => {
            console.log(`- ${p.email}: ${p.shopName} [${p.providerCategory.join(', ')}]`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedDemoProviders();
