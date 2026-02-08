const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/demo-login/:email', authController.demoLogin); // Demo provider login
// router.post('/verify-otp', authController.verifyOTP);
router.put('/profile', authController.updateProfile);
router.get('/profile/:userId', authController.getUserProfile);
router.post('/vehicles', authController.addVehicle);
router.put('/vehicles/:vehicleId', authController.updateVehicle);
router.delete('/vehicles', authController.deleteVehicle);

// Provider Routes
router.put('/provider/status', authController.toggleProviderStatus);
router.put('/provider/service', authController.toggleServiceStatus);
router.post('/provider/service', authController.addService);
router.delete('/provider/service', authController.deleteService);
router.put('/provider/service/name', authController.updateServiceName);
router.get('/provider/dashboard/:userId', authController.getProviderDashboardData);
router.put('/provider/force-location', authController.forceLocationUpdate); // DEV ONLY

// Admin Routes
router.get('/admin/pending-providers', authController.getPendingProviders);
router.put('/admin/verify', authController.verifyProvider);
router.delete('/admin/reject', authController.rejectProvider);

// New Admin Routes
router.get('/admin/verified-providers', authController.getVerifiedProviders);
router.put('/admin/revoke', authController.revokeVerification);
router.get('/admin/users', authController.getAllUsers);
router.delete('/admin/delete-user', authController.deleteUser);

// Change Requests
router.put('/request-profile-update', authController.requestProfileUpdate);
router.put('/admin/approve-update', authController.approveProfileUpdate);
router.put('/admin/reject-update', authController.rejectProfileUpdate);

module.exports = router;
