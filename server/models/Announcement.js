const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    target: { type: String, enum: ['all', 'providers', 'users'], default: 'all' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
