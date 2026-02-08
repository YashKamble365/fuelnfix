const User = require('../models/User');
const ServiceRate = require('../models/ServiceRate');
const Announcement = require('../models/Announcement');

// --- Pricing ---
exports.getServiceRates = async (req, res) => {
    try {
        const rates = await ServiceRate.find();
        res.json(rates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addServiceRate = async (req, res) => {
    try {
        const { serviceName, category, fuelType, basePrice, pricePerKm, pricePerLitre, description } = req.body;
        const newRate = new ServiceRate({
            serviceName,
            category: category || 'Mechanic',
            fuelType: category === 'Fuel Delivery' ? fuelType : null,
            basePrice,
            pricePerKm,
            pricePerLitre: category === 'Fuel Delivery' ? pricePerLitre : 0,
            description
        });
        await newRate.save();
        res.status(201).json(newRate);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateServiceRate = async (req, res) => {
    try {
        const { id } = req.params;
        const { serviceName, category, fuelType, basePrice, pricePerKm, pricePerLitre, description } = req.body;

        const updateData = {
            serviceName,
            category,
            basePrice,
            pricePerKm,
            description
        };

        if (category === 'Fuel Delivery') {
            updateData.fuelType = fuelType;
            updateData.pricePerLitre = pricePerLitre;
        }

        const rate = await ServiceRate.findByIdAndUpdate(id, updateData, { new: true });
        res.json(rate);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteServiceRate = async (req, res) => {
    try {
        const { id } = req.params;
        await ServiceRate.findByIdAndDelete(id);
        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Analytics ---
exports.getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalProviders = await User.countDocuments({ role: 'provider' });
        const pendingProviders = await User.countDocuments({ role: 'provider', isVerified: false });

        // Get the last 6 months of data
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Aggregate users by month
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    role: 'user'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Aggregate providers by month
        const providerGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    role: 'provider'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Build growth data for the last 6 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const growthData = [];

        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // 1-indexed for MongoDB

            const userEntry = userGrowth.find(u => u._id.year === year && u._id.month === month);
            const providerEntry = providerGrowth.find(p => p._id.year === year && p._id.month === month);

            growthData.push({
                name: monthNames[month - 1],
                users: userEntry ? userEntry.count : 0,
                providers: providerEntry ? providerEntry.count : 0
            });
        }

        res.json({
            counts: { totalUsers, totalProviders, pendingProviders },
            growthData
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// --- Broadcasts ---
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message, target } = req.body;
        const announcement = new Announcement({
            title,
            message,
            target
        });
        await announcement.save();

        // Broadcast to connected users/providers via Socket.io
        const io = req.app.get('socketio');
        if (io) {
            // target can be 'all', 'providers', or 'users'
            io.emit('new_announcement', announcement);
        }

        res.status(201).json(announcement);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await Announcement.findByIdAndDelete(id);

        // Broadcast deletion
        const io = req.app.get('socketio');
        if (io) {
            io.emit('delete_announcement', id);
        }

        res.json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
