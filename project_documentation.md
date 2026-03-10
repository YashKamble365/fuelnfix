# FuelNFix: The Technical Reference Manual

---

## 🔐 1. Executive Summary
**FuelNFix** is a hyper-local, on-demand roadside assistance platform often described as "Uber for Mechanics". It solves the critical problem of vehicle breakdowns in unfamiliar locations by instantly connecting stranded motorists with the nearest verified service providers.

**Core Capabilities:**
*   **Instant Matching**: Algorithms find the closest provider within a 50km radius.
*   **Real-Time Tracking**: Users can watch the provider's approach on a live map (like Uber).
*   **Transparent Pricing**: Algorithmic estimates based on base fees + distance.
*   **Secure Payments**: Integrated digital payments via Cashfree.
*   **Role-Based Access**: Dedicated interfaces for Customers, Providers, and Admins.

---

## 🏗️ 2. System Architecture

The system follows a modern **MERN Stack** (MongoDB, Express, React, Node.js) architecture with **Socket.IO** for real-time bidirectional communication.

### High-Level Diagram
```mermaid
graph TD
    User[User Client (React)] <-->|HTTP REST| Server[Node.js/Express Server]
    Provider[Provider Client (React)] <-->|HTTP REST| Server
    Admin[Admin Client (React)] <-->|HTTP REST| Server
    
    User <-->|WebSocket (Socket.IO)| Server
    Provider <-->|WebSocket (Socket.IO)| Server
    
    Server <-->|Query/Write| DB[(MongoDB Atlas)]
    Server <-->|Auth| Firebase[Firebase Auth]
    Server <-->|Payment| Cashfree[Cashfree Gateway]
```

---

## 🛠️ 3. Technology Stack

### Frontend (Client)
*   **React 18** (Vite): Component-based UI library.
*   **React Router Dom**: Client-side routing.
*   **TailwindCSS**: Utility-first styling framework.
*   **Framer Motion**: Smooth animations.
*   **Socket.IO Client**: Real-time event handling.
*   **Google Maps API**: Mapping, Geocoding, and Directions.
*   **Axios**: HTTP requests.

### Backend (Server)
*   **Node.js**: JavaScript runtime.
*   **Express.js**: Web server framework.
*   **Socket.IO**: Real-time engine.
*   **Mongoose**: ODM for MongoDB.
*   **Firebase Admin SDK**: Server-side token verification.

### Database
*   **MongoDB Atlas**: Cloud-hosted NoSQL database.
*   **GeoJSON**: Used for storing locations as `[longitude, latitude]` points to enable geospatial queries (`$near`, `$geometry`).

---

## 🗄️ 4. Database Schema Design

### 4.1 `User` Collection (Customers & Providers)
One collection handles all user types to simplify auth.
```javascript
{
  name: String,
  email: String, // Unique
  role: String, // 'user' | 'provider' | 'admin'
  phone: String,
  
  // LOCATION (Crucial) -> 2dsphere Indexed
  location: { type: "Point", coordinates: [Lng, Lat] }, 
  liveLocation: { type: "Point", coordinates: [Lng, Lat] }, // For tracking
  
  // Provider Specifics
  isVerified: Boolean,
  isOnline: Boolean,
  services: [ { name: "Flat Tire", active: Boolean } ],
  providerCategory: String // 'Mechanic' | 'Fuel Delivery'
}
```

### 4.2 `Request` Collection (Jobs)
Tracks the lifecycle of a service request.
```javascript
{
  customer: ObjectId(User),
  provider: ObjectId(User),
  status: 'Pending' | 'Accepted' | 'Arrived' | 'In Progress' | 'Completed',
  
  category: 'Mechanic' | 'Fuel Delivery',
  serviceTypes: ["Flat Tire"],
  location: { coordinates: [Lng, Lat] }, // Breakdown location
  
  // Pricing Snapshot (Locked at creation)
  pricing: {
    baseFee: Number,
    distanceFee: Number, // Calculated
    totalAmount: Number
  },
  
  // Security
  serviceOtp: String, // 4-digit code
  otpVerified: Boolean
}
```

---

## 🧠 5. Key Logic & Code Snippets

### 5.1 Geolocation Matching (The "Uber" Algorithm)
**File**: `server/controllers/requestController.js`
**Logic**: Find providers who are (1) Online, (2) Verified, (3) Offer the specific service, and (4) Are within 50km.

```javascript
// Snippet from searchProviders function
const query = {
    role: 'provider',
    isVerified: true,
    isOnline: true,
    providerCategory: category, // e.g. 'Mechanic'
    location: {
        $near: {
            $geometry: { type: "Point", coordinates: [userLng, userLat] },
            $maxDistance: 50000 // 50km Radius
        }
    },
    // Filter for specific service (e.g. "Flat Tire")
    services: {
        $elemMatch: { name: "Flat Tire", active: true }
    }
};
const providers = await User.find(query).limit(50);
```

### 5.2 Real-Time Tracking Flow
This is the most complex feature. It spans 3 distinct parts.

**Part A: Provider App (Captures Location)**
**File**: `client/src/pages/ProviderDashboard.jsx`
```javascript
navigator.geolocation.watchPosition((position) => {
    const { latitude, longitude } = position.coords;
    // Emit to Server
    socket.emit('provider_location_update', {
        roomId: activeJobId,
        location: { lat: latitude, lng: longitude }
    });
});
```

**Part B: Server (Broadcasts)**
**File**: `server/index.js`
```javascript
socket.on('provider_location_update', ({ roomId, location }) => {
    // Forward data to the room (which the user joined)
    io.to(roomId).emit('track_provider', location);
    
    // Also save to DB for persistence
    User.findByIdAndUpdate(providerId, { liveLocation: ... });
});
```

**Part C: User App (Renders Map)**
**File**: `client/src/pages/Dashboard.jsx`
```javascript
socket.on('track_provider', (coords) => {
    setProviderLocation(coords);
});

// Render Marker
<MapComponent>
   <Marker position={providerLocation} icon={CarIcon} />
</MapComponent>
```

---

## 📘 6. Comprehensive User Manual

This section serves as the end-user training guide for all three roles.

### 6.1 Customer (Motorist) Manual

#### **Getting Started**
1.  **Sign Up**: Open the app and click "Get Started". Use your Google Account or Phone Number to register.
2.  **Location Access**: **CRITICAL**. You must "Allow" location access when prompted. The app relies on GPS to find help near you.

#### **How to Request Help (Step-by-Step)**
1.  **Dashboard**: You will see a map with your current location (Blue Dot).
2.  **Choose Service**: Click "Request Help". Select your vehicle type (Car/Bike/EV) and the issue (e.g., "Flat Tire").
    *   *Tip: You can select multiple services if needed.*
3.  **Confirm Details**: The app will search for nearby providers and show an **Estimated Price** and **Arrival Time**.
4.  **Book**: Click "Confirm Request". The app will now contact the nearest provider.

#### **During the Service**
1.  **Notification**: You will hear a sound when a provider accepts your request.
2.  **Live Tracking**: The providers icon (Car/Truck) will appear on the map. You can watch them drive to you in real-time.
3.  **Authentication (OTP)**:
    *   Once the provider arrives, a **4-Digit OTP** will appear on your screen.
    *   **Do NOT share this** until you see the provider in person.
    *   Give the OTP to the provider to unlock the service.

#### **Payments**
1.  **Bill Generation**: Once the job is done, you will receive a digital bill on your screen.
2.  **Pay**: Click "Pay via Secure Gateway". You can use UPI, Credit Card, or Netbanking (via Cashfree).
3.  **Receipt**: After payment, a digital receipt is generated. You can download it for insurance claims.

---

### 6.2 Service Provider Manual

#### **Onboarding**
1.  **Registration**: Sign up as a "Service Provider".
2.  **Verification**: You **cannot receive jobs** immediately. You must upload:
    *   Shop Photo
    *   Government ID (Aadhar/License)
    *   Shop License
3.  **Approval**: Wait for Admin approval (usually 24-48 hours). You will see a "Verification Pending" screen.

#### **Daily Workflow**
1.  **Go Online**:
    *   Open `Provider Dashboard`.
    *   Toggle the "Go Online" switch. **You must keep the app open to receive requests.**
    *   *Note: This starts broadcasting your location to nearby users.*
2.  **Receiving a Request**:
    *   A popup will appear with: *Distance, Service Type, and Estimated Earnings*.
    *   You have 60 seconds to **Accept** or **Reject**.
3.  **Navigation**:
    *   Once accepted, click "Navigate". This opens Google Maps with directions to the customer.
4.  **Starting the Job**:
    *   Upon arrival, ask the customer for the **OTP**.
    *   Enter the OTP in your app. This marks the job as "In Progress".
5.  **Completing the Job**:
    *   Perform the repair.
    *   Click "Complete Job".
    *   (Optional) Add extra material costs (e.g., "New Tyre Tube - ₹200").
    *   Wait for the customer to pay via their app.

---

### 6.3 Administrator Manual

#### **Dashboard Overview**
*   **Login**: Access via `/admin`.
*   **Stats**: View "Total Revenue", "Active Jobs", and "New Users" at a glance.

#### **Verifying Providers**
1.  Go to the **"Pending Verification"** tab.
2.  Click "View Details" on a provider.
3.  Review their uploaded documents.
4.  **Action**:
    *   **Approve**: Activates their account. They can now receive jobs.
    *   **Reject**: Sends them back to the upload screen to fix issues.

#### **Analytics & Rates**
*   **Service Rates**: You can update the Base Price or Price-Per-KM for any service (e.g., increase Towing rates during heavy rain).
*   **Announcements**: Use the "Broadcast" feature to send alerts (e.g., "Server Maintenance at 2 AM") to all users.

---

## 📡 7. API Reference (Core Endpoints)

| Method | Endpoint | Body Payload | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | `{ token, role, ... }` | Creates user from Firebase Token. |
| `POST` | `/api/request/create` | `{ category, location, serviceType }` | Algorithms finds provider & calculates price. |
| `POST` | `/api/request/accept` | `{ requestId }` | Provider claims the job. Generates OTP. |
| `POST` | `/api/request/verify-otp` | `{ requestId, otp }` | Starts the job if OTP matches. |
| `POST` | `/api/payment/create-order` | `{ amount, userId }` | Initiates Cashfree transaction. |
| `POST` | `/api/admin-features/approve` | `{ providerId }` | Admin approves provider documents. |

---

## 🚀 8. Deployment Guide (Production)

### 8.1 Backend (Render.com)
1.  **Create Web Service**: Connect your GitHub repo.
2.  **Settings**:
    *   **Root Directory**: `server`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
3.  **Environment Variables**:
    *   `MONGO_URI`: `mongodb+srv://...`
    *   `FIREBASE_SERVICE_ACCOUNT`: (Paste content of `serviceAccountKey.json`)
    *   `CASHFREE_APP_ID`: `...`
    *   `CASHFREE_SECRET_KEY`: `...`

### 8.2 Frontend (Netlify/Vercel)
1.  **Create Site**: Connect GitHub repo.
2.  **Settings**:
    *   **Base Directory**: `client`
    *   **Build Command**: `npm run build`
    *   **Publish Directory**: `dist`
3.  **Dynamic API URL**:
    *   The code in `client/src/lib/api.js` automatically detects if it's running on `localhost`. If NOT, it uses the production URL.
    *   **Update Code**: Ensure `PROD_API` in `api.js` points to your `onrender.com` URL.

---

## ❓ 9. Q&A / FAQ

**Q: How does the application prevent fake providers?**
**A:** Providers must register and upload documents. They remain "Unverified" until an Admin reviews their profile in the Admin Dashboard and clicks "Approve". Only verified providers show up in search results.

**Q: What happens if the internet cuts out during a request?**
**A:** The app is designed to be resilient. Socket.IO attempts to auto-reconnect. If the connection is lost, state is preserved in the database. When the app reloads, it fetches the "Active Request" from the API (`/api/request/user/active`) to restore the screen state.

**Q: Is the location data secure?**
**A:** Yes. Live location is only broadcasted to the specific "Room" of the active request, meaning only the User and Provider involved in that specific job can see the tracking data.

**Q: How is the price calculated?**
**A:** Pricing is dynamic.
`Total = Base Fee (e.g. ₹500) + (Distance * Rate per km)`.
The `ServiceRate` collection in MongoDB holds the rates for each service type, which Admins can edit.

---
**End of Document**
