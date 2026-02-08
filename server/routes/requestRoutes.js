const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

router.post('/search-providers', requestController.searchProviders);
router.post('/create', requestController.createRequest);
router.put('/accept', requestController.acceptRequest);
router.put('/complete', requestController.completeRequest); // New Endpoint
router.get('/provider/:providerId', requestController.getProviderRequests);
router.get('/provider/stats/:providerId', requestController.getProviderStats); // New Stats Endpoint
router.get('/provider/history/:providerId', requestController.getProviderRequestHistory);
router.get('/user/active/:userId', requestController.getUserActiveRequest);
router.get('/user/history/:userId', requestController.getUserRequestHistory);
router.put('/status', requestController.updateStatus);
router.put('/complete', requestController.completeRequest);
router.put('/cancel', requestController.cancelRequest); // New Endpoint
router.post('/send-bill', requestController.sendBill);
router.post('/confirm-payment', requestController.confirmPayment);
router.post('/verify-otp', requestController.verifyServiceOtp);

module.exports = router;

