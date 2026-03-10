const express = require('express');
const router = express.Router();
const { Cashfree, CFEnvironment } = require('cashfree-pg');

const User = require('../models/User');

// Create Order endpoint
router.post('/create-order', async (req, res) => {
    try {
        console.log("Cashfree Init - AppID Prefix:", process.env.CASHFREE_APP_ID?.slice(0, 5));

        const { orderAmount, customerId, customerPhone, customerName, providerId } = req.body;

        const orderId = `ORDER_${Date.now()}`;

        const request = {
            order_amount: orderAmount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: customerId,
                customer_phone: customerPhone,
                customer_name: customerName || "Customer"
            },
            order_meta: {
                return_url: "https://your-website.com/return?order_id={order_id}",
                notify_url: null
            },
            order_note: "FuelnFix - Roadside Assistance"
        };

        // If providerId is passed, fetch the vendor ID and apply Split logic
        if (providerId) {
            const provider = await User.findById(providerId);
            if (provider && provider.cashfreeVendorId) {
                // Easy Split: Send 95% to the Provider's Cashfree Vendor Account, keep 5% on platform
                request.order_splits = [
                    {
                        vendor_id: provider.cashfreeVendorId,
                        percentage: 95
                    }
                ];
                console.log(`[Payment] Applying Easy Split for Vendor: ${provider.cashfreeVendorId}`);
            } else {
                console.log(`[Payment] Provider ${providerId} has no Cashfree Vendor ID. Processing as standard payment without split.`);
            }
        }

        const cashfree = new Cashfree(
            CFEnvironment.SANDBOX,
            process.env.CASHFREE_APP_ID,
            process.env.CASHFREE_SECRET_KEY
        );
        const response = await cashfree.PGCreateOrder(request);
        res.json(response.data);

    } catch (error) {
        console.error("Error creating order:", error);
        // Log detailed error from Cashfree if available
        if (error.response && error.response.data) {
            console.error("Cashfree API Error:", JSON.stringify(error.response.data, null, 2));
        }
        res.status(500).json({ error: error.message });
    }
});

// Verify Payment endpoint
router.post('/verify-payment', async (req, res) => {
    try {
        Cashfree.XClientId = process.env.CASHFREE_APP_ID;
        Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
        Cashfree.XEnvironment = CFEnvironment.SANDBOX;

        const { orderId } = req.body;
        const cashfree = new Cashfree(
            CFEnvironment.SANDBOX,
            process.env.CASHFREE_APP_ID,
            process.env.CASHFREE_SECRET_KEY
        );
        const response = await cashfree.PGOrderFetchPayments(orderId);
        res.json(response.data);
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: error.message });
    }
});

const axios = require('axios');

// Add Vendor for Easy Split
router.post('/add-vendor', async (req, res) => {
    try {
        const { providerId, accountNumber, ifscCode, accountHolderName } = req.body;

        const provider = await User.findById(providerId);
        if (!provider) return res.status(404).json({ message: "Provider not found" });

        const vendorId = `VENDOR_${provider._id}`;

        const payload = {
            vendor_id: vendorId,
            name: provider.name || provider.shopName,
            email: provider.email || `vendor_${providerId}@fuelnfix.com`,
            phone: provider.phone || "9999999999",
            bank: [
                {
                    account_number: accountNumber,
                    account_holder: accountHolderName,
                    ifsc: ifscCode
                }
            ],
            verify_account: false
        };

        const response = await axios.post('https://sandbox.cashfree.com/pg/easy-split/vendors', payload, {
            headers: {
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                'x-api-version': '2022-09-01',
                'Content-Type': 'application/json'
            }
        });

        // Save Vendor Details to Provider DB
        provider.cashfreeVendorId = vendorId;
        provider.bankDetails = {
            accountNumber,
            ifscCode,
            accountHolderName
        };
        await provider.save();

        res.json({ success: true, vendor: response.data, message: "Bank account connected successfully!" });

    } catch (error) {
        console.error("Error adding vendor:", error);
        if (error.response && error.response.data) {
            console.error("Cashfree API Error:", JSON.stringify(error.response.data, null, 2));
            return res.status(500).json({ error: error.response.data.message || "Failed to add vendor" });
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
