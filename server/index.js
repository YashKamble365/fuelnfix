const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const User = require('./models/User');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for development
        methods: ["GET", "POST"]
    }
});

// Make io accessible to our router
app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); // New Admin Routes
const requestRoutes = require('./routes/requestRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin-features', adminRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/review', reviewRoutes);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fuelnfix';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log(`MongoDB connected to ${MONGO_URI}`);
        const ServiceRate = require('./models/ServiceRate');
        if (ServiceRate.seedDefaults) ServiceRate.seedDefaults();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Routes Placeholders
app.get('/', (req, res) => {
    res.send('FuelNFix API is running');
});

// Socket.io Connection
// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log('User/Provider connected:', socket.id);

    // Join a specific Request Room (e.g., RequestID)
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });


    // Provider Location Update (Live Tracking & DB Persistence)
    socket.on('provider_location_update', async ({ roomId, userId, location }) => {
        // Broadcast to specific room for active job tracking
        if (roomId) {
            io.to(roomId).emit('track_provider', location);
        }

        // Update DB for Search Visibility (if userId provided)
        if (userId) {
            try {
                await User.findByIdAndUpdate(userId, {
                    liveLocation: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    isOnline: true
                });
            } catch (err) {
                console.error("Location DB Update Error:", err);
            }
        }
    });

    // Explicit "Update Location" event (periodic background update)
    socket.on('update_location', async ({ userId, location }) => {
        try {
            await User.findByIdAndUpdate(userId, {
                liveLocation: {
                    type: 'Point',
                    coordinates: [location.lng, location.lat]
                },
                isOnline: true
            });
        } catch (err) {
            console.error("Background Location Update Error:", err);
        }
    });

    // Chat Message
    socket.on('send_message', (data) => {
        // data: { roomId, sender, message, time }
        const room = io.sockets.adapter.rooms.get(data.roomId);
        const socketsInRoom = room ? room.size : 0;
        console.log(`[CHAT] Message in room ${data.roomId} (${socketsInRoom} sockets) from ${data.sender}: ${data.message}`);
        io.to(data.roomId).emit('receive_message', data);
        console.log(`[CHAT] Broadcast complete to room ${data.roomId}`);
    });

    // Status Updates (e.g., Accepted, Arrived)
    socket.on('update_status', ({ roomId, status }) => {
        io.to(roomId).emit('status_changed', status);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
