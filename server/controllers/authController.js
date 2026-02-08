const User = require('../models/User');
const admin = require('../config/firebaseAdmin');

exports.register = async (req, res) => {
    try {
        const { name, role, vehicleDetails, idToken, shopName, providerCategory, services, address, location, photoUrl } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Firebase ID token is required' });
        }

        // Verify Firebase Token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, picture, uid } = decodedToken;

        if (!email) {
            return res.status(400).json({ message: 'Email not found in token' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Create new user
        user = new User({
            name: name || decodedToken.name, // Use name from form or Google
            email,
            photoUrl: photoUrl || picture,
            role,
            // If vehicle details are provided during registration, add to array
            vehicles: vehicleDetails ? [vehicleDetails] : [],
            // Provider Fields
            shopName,
            providerCategory: providerCategory || [],
            // Map simple string array to object array if provided
            services: services ? services.map(s => ({ name: s, active: true })) : [],
            address,
            location: location || { type: 'Point', coordinates: [0, 0] },
            liveLocation: location || { type: 'Point', coordinates: [0, 0] },
            isVerified: role === 'provider' ? false : true, // Auto-verify users, verify providers manually
            verificationDocs: {
                shopPhoto: req.body.shopPhotoUrl
            }
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully', userId: user._id, user });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ message: err.message || 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Firebase ID token is required' });
        }

        // Verify Firebase Token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name, picture } = decodedToken;

        // Find user by email
        const user = await User.findOne({ email });

        // If user not found, return 404 with Google details to pre-fill registration
        if (!user) {
            return res.status(404).json({
                message: 'User not found. Please register first.',
                googleData: {
                    email,
                    name,
                    photoUrl: picture
                }
            });
        }

        // Force update profile picture and name from Google if changed or missing
        let updated = false;
        if (picture && user.photoUrl !== picture) {
            user.photoUrl = picture;
            updated = true;
        }
        if (name && !user.name) {
            user.name = name;
            updated = true;
        }

        if (updated) await user.save();

        res.json({ message: 'Login successful', user });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { userId, name, phone } = req.body;
        const user = await User.findByIdAndUpdate(userId, { name, phone }, { new: true });
        res.json({ message: 'Profile updated', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addVehicle = async (req, res) => {
    try {
        const { userId, vehicle } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            { $push: { vehicles: vehicle } },
            { new: true }
        );
        res.json({ message: 'Vehicle added', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteVehicle = async (req, res) => {
    try {
        const { userId, vehicleId } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { vehicles: { _id: vehicleId } } },
            { new: true }
        );
        res.json({ message: 'Vehicle removed', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateVehicle = async (req, res) => {
    try {
        const { userId, vehicle } = req.body;
        const { vehicleId } = req.params;

        // Use the positional $ operator to update the specific vehicle in the array
        const user = await User.findOneAndUpdate(
            { _id: userId, "vehicles._id": vehicleId },
            {
                $set: {
                    "vehicles.$.model": vehicle.model,
                    "vehicles.$.fuelType": vehicle.fuelType,
                    "vehicles.$.plateNumber": vehicle.plateNumber
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User or vehicle not found" });
        }

        res.json({ message: 'Vehicle updated', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Provider Dashboard Features ---

exports.toggleProviderStatus = async (req, res) => {
    try {
        const { userId, isOnline } = req.body;
        const user = await User.findByIdAndUpdate(userId, { isOnline }, { new: true });
        res.json({ message: isOnline ? 'You are now Online' : 'You are Offline', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleServiceStatus = async (req, res) => {
    try {
        const { userId, serviceName } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const serviceIndex = user.services.findIndex(s => s.name === serviceName);
        if (serviceIndex > -1) {
            user.services[serviceIndex].active = !user.services[serviceIndex].active;
            await user.save();
            res.json({ message: 'Service status updated', services: user.services });
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addService = async (req, res) => {
    try {
        const { userId, serviceName } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if exists
        if (user.services.find(s => s.name.toLowerCase() === serviceName.toLowerCase())) {
            return res.status(400).json({ message: 'Service already exists' });
        }

        user.services.push({ name: serviceName, active: true });
        await user.save();
        res.json({ message: 'Service added', services: user.services });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { userId, serviceName } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { services: { name: serviceName } } },
            { new: true }
        );
        res.json({ message: 'Service removed', services: user.services });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateServiceName = async (req, res) => {
    try {
        const { userId, oldName, newName } = req.body;
        const user = await User.findOneAndUpdate(
            { _id: userId, "services.name": oldName },
            { $set: { "services.$.name": newName } },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'User or Service not found' });
        res.json({ message: 'Service updated', services: user.services });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProviderDashboardData = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Auto-migrate legacy services (array of strings) to objects
        if (user.services && user.services.length > 0 && typeof user.services[0] === 'string') {
            user.services = user.services.map(s => ({ name: s, active: true }));
            await user.save();
        }

        // Mock Stats for now (Hook up to real orders later)
        const stats = {
            earnings: 1250,
            todayEarnings: 450,
            jobsCompleted: 12,
            rating: 4.8,
            activeRequests: 0
        };

        // Mock Requests (Hook up to Order model later)
        const activeRequests = [];

        res.json({
            user,
            stats,
            activeRequests
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Admin Endpoints
exports.getPendingProviders = async (req, res) => {
    try {
        const providers = await User.find({
            role: 'provider',
            $or: [
                { isVerified: false },
                { 'pendingUpdate.status': 'Pending' }
            ]
        });
        res.json(providers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyProvider = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
        res.json({ message: 'Provider verified successfully', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.rejectProvider = async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findByIdAndDelete(userId);
        res.json({ message: 'Provider rejected and removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVerifiedProviders = async (req, res) => {
    try {
        const providers = await User.find({ role: 'provider', isVerified: true });
        res.json(providers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.revokeVerification = async (req, res) => {
    try {
        const { userId } = req.body;
        console.log(`[REVOKE] Request for userId: ${userId}`);

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await User.findByIdAndUpdate(userId, { isVerified: false }, { new: true });

        if (!user) {
            console.log(`[REVOKE] User not found: ${userId}`);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[REVOKE] Success for user: ${user.email}`);
        res.json({ message: 'Verification revoked', user });
    } catch (err) {
        console.error(`[REVOKE] Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        // Fetch all users who are NOT admins
        const users = await User.find({ role: { $ne: 'admin' } });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findByIdAndDelete(userId);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Profile Change Requests ---

exports.requestProfileUpdate = async (req, res) => {
    try {
        const { userId, shopName, address, phone, location } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            {
                pendingUpdate: {
                    status: 'Pending',
                    data: { shopName, address, phone, location },
                    requestedAt: new Date()
                }
            },
            { new: true }
        );
        res.json({ message: 'Update requested', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.approveProfileUpdate = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user || user.pendingUpdate.status !== 'Pending') {
            return res.status(400).json({ message: 'No pending update found' });
        }

        const { shopName, address, phone, location } = user.pendingUpdate.data;

        // Apply changes
        if (shopName) user.shopName = shopName;
        if (address) user.address = address;
        if (phone) user.phone = phone;
        if (location && location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
            // Ensure strictly valid GeoJSON to prevent "Can't extract geo keys" error
            const newLocation = {
                type: 'Point',
                coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
            };
            user.location = newLocation;
            // SYNC: Reset liveLocation to the new Shop Location so the map updates immediately
            user.liveLocation = newLocation;
        }

        // Clear pending status
        user.pendingUpdate = { status: 'None', data: {}, requestedAt: null };

        await user.save();
        res.json({ message: 'Update approved', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.rejectProfileUpdate = async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findByIdAndUpdate(
            userId,
            { pendingUpdate: { status: 'Rejected', data: {}, requestedAt: null } }
        );
        res.json({ message: 'Update rejected' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DEV ONLY: Force Update Location (Bypass Admin)
exports.forceLocationUpdate = async (req, res) => {
    try {
        const { userId, location } = req.body;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update BOTH locations immediately
        if (location && location.coordinates) {
            user.location = location;
            user.liveLocation = location;
        }

        await user.save();
        res.json({ message: 'Location Forced Successfully', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Demo Login - For testing purposes only
exports.demoLogin = async (req, res) => {
    try {
        const { email } = req.params;

        // Only allow demo accounts
        if (!email.endsWith('@fuelnfix.com')) {
            return res.status(403).json({ message: 'Only demo accounts allowed' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Demo provider not found' });
        }

        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
