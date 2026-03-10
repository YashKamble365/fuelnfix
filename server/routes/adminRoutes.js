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
router.get('/earnings', adminController.getEarnings);

// Broadcasts
router.post('/announcements', adminController.createAnnouncement);
router.get('/announcements', adminController.getAnnouncements);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// Config Routes
router.get('/config', adminController.getPlatformConfig);
router.put('/config', adminController.updatePlatformConfig);

module.exports = router;
