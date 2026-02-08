const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Pricing
router.get('/pricing', adminController.getServiceRates);
router.post('/pricing', adminController.addServiceRate);
router.put('/pricing/:id', adminController.updateServiceRate);
router.delete('/pricing/:id', adminController.deleteServiceRate);

// Analytics
router.get('/analytics', adminController.getAnalytics);

// Broadcasts
router.post('/announcements', adminController.createAnnouncement);
router.get('/announcements', adminController.getAnnouncements);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

module.exports = router;
