const express = require('express');
const router = express.Router();
const { Cashfree, CFEnvironment } = require('cashfree-pg');

// Create Order endpoint
router.post('/create-order', async (req, res) => {
    try {
        console.log("Cashfree Init - AppID Prefix:", process.env.CASHFREE_APP_ID?.slice(0, 5));

        const { orderAmount, customerId, customerPhone, customerName } = req.body;

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

module.exports = router;
