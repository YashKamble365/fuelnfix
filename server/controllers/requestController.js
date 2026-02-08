const Request = require('../models/Request');
const User = require('../models/User');
const { logToFile } = require('../utils/logger');
const ServiceRate = require('../models/ServiceRate');
const Review = require('../models/Review'); // Move to top

// Helper: Haversine Distance Calculation (km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

exports.getProviderStats = async (req, res) => {
    try {
        const { providerId } = req.params;
        console.log(`[getProviderStats] Fetching stats for provider: ${providerId}`);

        // 1. Get Completed Requests Stats (Earnings & Job Count)
        const completedRequests = await Request.find({
            provider: providerId,
            status: 'Completed'
        });

        const jobsCompleted = completedRequests.length;
        const totalEarnings = completedRequests.reduce((sum, r) => sum + (r.pricing?.totalAmount || 0), 0);

        // Calculate Today's Earnings
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const todayEarnings = completedRequests
            .filter(r => new Date(r.timestamps?.completedAt || r.updatedAt) >= startOfToday)
            .reduce((sum, r) => sum + (r.pricing?.totalAmount || 0), 0);

        console.log(`[getProviderStats] Total: ${totalEarnings}, Today: ${todayEarnings}, Jobs: ${jobsCompleted}`);

        // 2. Get Rating Stats
        console.log(`[getProviderStats] Calling Review.getAverageRating...`);
        const ratingData = await Review.getAverageRating(providerId, 'Provider');
        console.log(`[getProviderStats] Rating Data:`, ratingData);

        // 3. Get Recent Reviews
        console.log(`[getProviderStats] Fetching recent reviews...`);
        const recentReviews = await Review.find({
            reviewee: providerId,
            revieweeType: 'Provider'
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('reviewer', 'name photoUrl');

        res.json({
            earnings: totalEarnings,
            todayEarnings,
            jobsCompleted,
            rating: ratingData.averageRating.toFixed(1),
            totalReviews: ratingData.totalReviews,
            recentReviews
        });

    } catch (err) {
        console.error("Get Provider Stats Error - Full Stack:", err);
        res.status(500).json({ message: err.message, stack: err.stack });
    }
};

exports.searchProviders = async (req, res) => {
    try {
        const { serviceName, serviceNames, originLat, originLng, category } = req.body;

        const originLatNum = parseFloat(originLat);
        const originLngNum = parseFloat(originLng);

        if (isNaN(originLatNum) || isNaN(originLngNum)) {
            return res.status(400).json({ message: 'Invalid location coordinates' });
        }

        // Handle Single vs Multi Service
        const servicesToFind = serviceNames && Array.isArray(serviceNames) ? serviceNames : [serviceName];

        console.log(`[Search] Category: ${category}, Near: [${originLngNum}, ${originLatNum}], Services: ${JSON.stringify(servicesToFind)}`);

        // Determine service for rate lookup
        // Use the requested service names directly for both Mechanic and Fuel (e.g., 'Petrol', 'Diesel')
        const servicesForRate = servicesToFind;

        // 1. Get Service Rates for ALL services
        const rates = await ServiceRate.find({ serviceName: { $in: servicesForRate } });

        // Fallback: If specific fuel rate not found (e.g. 'Petrol'), try generic 'Fuel Delivery'
        if (category === 'Fuel Delivery' && rates.length === 0) {
            const genericRate = await ServiceRate.findOne({ category: 'Fuel Delivery' });
            if (genericRate) rates.push(genericRate);
            else rates.push({ basePrice: 50, pricePerKm: 10, serviceName: 'Fuel Delivery' }); // Hard Fallback
        } else if (rates.length !== servicesForRate.length) {
            return res.status(404).json({ message: 'One or more services not configured' });
        }

        // Calculate Pricing Config for the bundle
        // Base Fee = Sum of all base fees
        // Price Per Km = Max of all (assuming the most expensive vehicle needed dictates the rate)
        const bundleBasePrice = rates.reduce((sum, r) => sum + r.basePrice, 0);
        const bundlePricePerKm = Math.max(...rates.map(r => r.pricePerKm));

        // 2. Build Query
        const query = {
            role: 'provider',
            // Production Settings: Strict Verification and Online Status
            isVerified: true,
            isOnline: true,
            providerCategory: category || 'Mechanic',
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [originLngNum, originLatNum] },
                    $maxDistance: 50000 // 50km Production Radius
                }
            }
        };

        // Filter providers who have ALL requested services active (Only for Mechanic)
        if (category !== 'Fuel Delivery') {
            query['services.active'] = true;
            if (servicesToFind.length > 0) {
                query.services = {
                    $all: servicesToFind.map(name => ({
                        $elemMatch: { name: { $regex: new RegExp(`^${name}$`, 'i') }, active: true }
                    }))
                };
            }
        }

        // 2. Find ALL Nearby Active Providers
        const providers = await User.find(query).limit(50);

        if (providers.length === 0) {
            return res.status(200).json([]);
        }

        // 3. Calculate Estimate for EACH valid provider
        const results = providers
            .filter(p => p.location && p.location.coordinates && p.location.coordinates.length === 2)
            .map(provider => {
                // PER USER REQUEST: Always use Static Shop Location for booking/pricing.
                // Do NOT use liveLocation here.
                const loc = provider.location;

                const pLat = loc.coordinates[1];
                const pLng = loc.coordinates[0];
                const dist = calculateDistance(originLatNum, originLngNum, pLat, pLng);

                // Formula: Base + (Dist * Rate)
                const distanceFee = dist * bundlePricePerKm;
                const totalEstimate = bundleBasePrice + distanceFee;

                return {
                    baseFee: bundleBasePrice,
                    pricePerKm: bundlePricePerKm,
                    pricePerLitre: (category === 'Fuel Delivery' && rates.length > 0) ? rates[0].pricePerLitre : 0,
                    distance: dist.toFixed(2),
                    distanceFee: distanceFee.toFixed(2),
                    totalEstimate: Math.ceil(totalEstimate),
                    provider: {
                        id: provider._id,
                        name: provider.name,
                        shopName: provider.shopName,
                        rating: provider.averageRating || 0,
                        totalReviews: provider.totalReviews || 0,
                        photoUrl: provider.photoUrl,
                        location: loc // Send the actual used location to frontend
                    }
                };
            });

        res.json(results);

    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.createRequest = async (req, res) => {
    try {
        const { customerId, category, fuelDetails, serviceType, serviceTypes, location, pricing, providerId, vehicle } = req.body;

        // Default to Mechanic if not specified (backward compatibility)
        const requestCategory = category || 'Mechanic';
        let combinedServiceTypes = [];

        if (requestCategory === 'Mechanic' || requestCategory === 'EV Support') {
            combinedServiceTypes = serviceTypes || [serviceType];
        } else {
            // For Fuel, use the actual requested fuel type (e.g. ['Petrol'])
            // If serviceTypes is passed, use it. Otherwise fallback to generic.
            combinedServiceTypes = serviceTypes && serviceTypes.length > 0 ? serviceTypes : ['Fuel Delivery'];
        }

        // Prepare Fuel Details with Rate
        let finalFuelDetails = undefined;
        if (requestCategory === 'Fuel Delivery') {
            finalFuelDetails = {
                ...(fuelDetails || {}),
                rate: pricing.pricePerLitre || 0 // Store the rate used for estimate
            };
        }

        const newRequest = new Request({
            customer: customerId,
            provider: providerId, // Assign specific provider found in estimate
            category: requestCategory,
            fuelDetails: finalFuelDetails,
            serviceTypes: combinedServiceTypes,
            serviceType: combinedServiceTypes[0], // Deprecated, keep for legacy
            status: 'Pending',
            location,
            vehicle, // Save Vehicle Info
            problemPhotoUrl: req.body.problemPhotoUrl,
            pricing: {
                baseFee: pricing.baseFee,
                pricePerKm: pricing.pricePerKm,
                distanceMetric: pricing.distance,
                distanceFee: pricing.distanceFee,
                totalAmount: pricing.totalEstimate // Initial total (Delivery only for Fuel)
            }
        });

        const savedRequest = await newRequest.save();

        // Populate customer details for the notification
        await savedRequest.populate('customer', 'name phone photoUrl');

        // Real-time Notification
        const io = req.app.get('socketio');
        io.to(providerId).emit('new_request', savedRequest);

        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.body; // Assuming requestId is sent in the body

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Check if the request is already accepted or completed
        if (request.status !== 'Pending') {
            return res.status(400).json({ message: 'Request cannot be accepted in its current state' });
        }

        request.status = 'Accepted';
        request.timestamps.acceptedAt = new Date();

        // Assign Person (Provider themselves or a technician)
        const { assignedName, assignedPhone } = req.body;
        if (assignedName || assignedPhone) {
            request.assignedPerson = {
                name: assignedName,
                phone: assignedPhone
            };
        }

        // Generate 4-digit Service OTP for verification
        const serviceOtp = Math.floor(1000 + Math.random() * 9000).toString();
        request.serviceOtp = serviceOtp;
        request.otpGeneratedAt = new Date();
        request.otpVerified = false;

        console.log(`[Accept Request] Generated OTP for Req ${requestId}: ${serviceOtp}`);

        const updatedRequest = await request.save();
        console.log(`[Accept Request] Request saved. Status: ${updatedRequest.status}, OTP: ${updatedRequest.serviceOtp}`);

        // Real-time Notification to customer
        const io = req.app.get('socketio');
        // Assuming customer field is populated or is a valid ObjectId
        io.to(updatedRequest.customer.toString()).emit('request_accepted', updatedRequest);

        // Populate customer details before returning to provider
        await updatedRequest.populate('customer', 'name phone photoUrl');

        res.json(updatedRequest);
    } catch (err) {
        console.error("Accept Request Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.cancelRequest = async (req, res) => {
    try {
        const { requestId, reason } = req.body;
        const request = await Request.findById(requestId);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (!['Pending', 'Accepted', 'Arrived'].includes(request.status)) {
            return res.status(400).json({ message: 'Can only cancel active jobs' });
        }

        request.status = 'Cancelled';
        request.timestamps.completedAt = new Date(); // Using completedAt to mark end time

        // Notify customer
        const io = req.app.get('socketio');
        // Assuming customer field is populated or is a valid ObjectId
        io.to(request.customer.toString()).emit('request_cancelled', {
            requestId: request._id,
            reason: reason || 'Provider cancelled the job'
        });

        await request.save();
        res.json({ message: 'Job cancelled successfully', request });

    } catch (err) {
        console.error("Cancel Request Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.getProviderRequests = async (req, res) => {
    try {
        const { providerId } = req.params;
        const requests = await Request.find({ provider: providerId, status: { $ne: 'Completed' } })
            .populate('customer', 'name phone photoUrl')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
    }
};

exports.getProviderRequestHistory = async (req, res) => {
    try {
        const { providerId } = req.params;
        const requests = await Request.find({
            provider: providerId,
            status: { $in: ['Completed', 'Cancelled', 'Expired'] }
        })
            .populate('customer', 'name phone photoUrl')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUserActiveRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const request = await Request.findOne({
            customer: userId,
            status: { $in: ['Pending', 'Accepted', 'Arrived', 'In Progress'] }
        }).populate('provider', 'name phone photoUrl location');
        res.json(request);
    } catch (err) {
    }
};

exports.getUserRequestHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const requests = await Request.find({
            customer: userId,
            status: { $in: ['Completed', 'Cancelled', 'Expired'] }
        })
            .populate('provider', 'name phone photoUrl')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { requestId, status } = req.body;
        const request = await Request.findByIdAndUpdate(requestId, { status }, { new: true });
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.completeRequest = async (req, res) => {
    try {
        const { requestId, materialCost } = req.body;
        const request = await Request.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        const finalTotal = request.pricing.baseFee + request.pricing.distanceFee + Number(materialCost);

        request.status = 'Completed';
        request.pricing.materialCost = Number(materialCost);
        request.pricing.totalAmount = Math.ceil(finalTotal);
        request.timestamps.completedAt = new Date();

        await request.save();
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Send Itemized Bill to Customer
exports.sendBill = async (req, res) => {
    try {
        const { requestId, billItems } = req.body;
        // billItems: [{ name: string, cost: number }, ...]

        const request = await Request.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Calculate materials cost
        let materialsCost = 0;

        if (request.category === 'Fuel Delivery') {
            const { fuelQuantity } = req.body;
            const qty = Number(fuelQuantity) || 0;
            const type = request.fuelDetails?.fuelType || 'Petrol';

            // Fetch Dynamic Rate from DB
            const fuelRateDoc = await ServiceRate.findOne({
                category: 'Fuel Delivery',
                fuelType: type
            });

            const rate = fuelRateDoc?.pricePerLitre || (type === 'Petrol' ? 102 : 92); // Fallback to hardcoded

            materialsCost = qty * rate;

            // Auto-generate Bill Item
            request.bill = [{
                name: `${qty}L ${type} (₹${rate}/L)`,
                cost: materialsCost
            }];

            // Update Fuel Quantity
            if (!request.fuelDetails) request.fuelDetails = {};
            request.fuelDetails.quantity = qty;
            request.fuelDetails.rate = rate; // Save rate used
        } else {
            // Mechanic Logic
            materialsCost = billItems.reduce((sum, item) => sum + Number(item.cost), 0);
            request.bill = billItems;
        }

        // Total = Base Fee + Distance Fee + Materials
        const baseFee = request.pricing?.baseFee || 0;
        const distanceFee = request.pricing?.distanceFee || 0;
        const totalAmount = baseFee + distanceFee + materialsCost;

        // Update request with bill
        request.billSent = true;
        request.billSentAt = new Date();
        request.pricing.materialCost = materialsCost;
        request.pricing.totalAmount = totalAmount; // Removed Math.ceil for exact amount

        await request.save();

        // Populate provider to get name
        await request.populate('provider', 'name shopName');

        // Emit bill to customer via Socket.io (include full pricing breakdown)
        const io = req.app.get('socketio');
        io.to(request.customer.toString()).emit('bill_received', {
            requestId: request._id,
            bill: request.bill, // Use the constructed bill (works for both Fuel & Mechanic)
            baseFee,
            distanceFee,
            materialsCost,
            totalAmount: totalAmount, // Removed Math.ceil
            serviceTypes: request.serviceTypes,
            distance: request.pricing.distanceMetric, // Added distance for receipt
            providerId: request.provider?._id,
            providerName: request.provider?.shopName || request.provider?.name || 'Service Provider'
        });

        res.json({ success: true, totalAmount: totalAmount, request });
    } catch (err) {
        console.error("Send Bill Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Confirm Payment and Complete Job
exports.confirmPayment = async (req, res) => {
    try {
        const { requestId, paymentId, status } = req.body;

        const request = await Request.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.paymentStatus = status; // 'success' or 'failed'
        request.paymentId = paymentId;

        if (status === 'success') {
            request.paymentCompletedAt = new Date();
            request.status = 'Completed';
            request.timestamps.completedAt = new Date();
        }

        await request.save();

        // Populate customer to get customer details
        await request.populate('customer', 'name');

        // Notify provider of payment status (with customer details for feedback)
        const io = req.app.get('socketio');
        io.to(request.provider.toString()).emit('payment_confirmed', {
            requestId: request._id,
            paymentStatus: status,
            paymentId,
            customerId: request.customer?._id,
            customerName: request.customer?.name || 'Customer',
            serviceTypes: request.serviceTypes // Added for Feedback Modal
        });

        res.json({ success: true, request });
    } catch (err) {
        console.error("Confirm Payment Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Verify Service OTP
exports.verifyServiceOtp = async (req, res) => {
    try {
        const { requestId, otp } = req.body;

        logToFile(`[Verify OTP Entry] Payload: ${JSON.stringify(req.body)}`);

        if (!requestId || !otp) {
            logToFile(`[Verify OTP] Missing Data. RequestId: ${requestId}, OTP: ${otp}`);
            console.log("Missing ID or OTP", { requestId, otp });
            return res.status(400).json({ success: false, message: 'Request ID and OTP are required' });
        }

        const request = await Request.findById(requestId);
        if (!request) {
            console.log("Request not found for OTP verify", requestId);
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        console.log(`[Verify OTP] ReqID: ${requestId}, Received: '${otp}', Stored: '${request.serviceOtp}'`);

        if (request.otpVerified) {
            return res.json({ success: true, message: 'OTP already verified' });
        }

        const storedOtp = String(request.serviceOtp).trim();
        const receivedOtp = String(otp).trim();

        // const logMsg = `[Verify OTP] ReqID: ${requestId}, Received: '${receivedOtp}', Stored: '${storedOtp}', VerifiedStatus: ${request.otpVerified}`;
        // console.log(logMsg);
        // logToFile(logMsg);

        if (storedOtp === receivedOtp) {
            request.otpVerified = true;
            request.otpVerifiedAt = new Date();
            request.status = 'In Progress';

            let updatedRequest;
            try {
                updatedRequest = await request.save();
                console.log("[Verify OTP] Save successful");
            } catch (saveError) {
                console.error("[Verify OTP] Save Failed! Validation Error?", saveError);
                return res.status(500).json({ success: false, message: 'Database save failed: ' + saveError.message });
            }

            try {
                // Populate customer details before returning
                await updatedRequest.populate('customer', 'name phone photoUrl');

                const io = req.app.get('socketio');

                // Notify Customer that job started
                if (updatedRequest.customer && updatedRequest.customer._id) {
                    io.to(updatedRequest.customer._id.toString()).emit('status_changed', 'In Progress');
                    io.to(updatedRequest.customer._id.toString()).emit('otp_verified', {
                        requestId: updatedRequest._id,
                        message: 'OTP Verified! Work starting now.'
                    });
                }

                // Room notification
                io.to(updatedRequest._id.toString()).emit('status_changed', 'In Progress');

            } catch (socketError) {
                console.error("Socket/Populate Error during verification:", socketError);
                // Don't fail the request if just notification fails, but good to know
            }

            return res.json({ success: true, message: 'OTP Verified', request: updatedRequest });
        }

        return res.status(400).json({ success: false, message: 'Invalid OTP' });
    } catch (err) {
        console.error("Verify OTP Error:", err);
        return res.status(500).json({ success: false, message: 'Server error during verification' });
    }
};
