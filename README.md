# FuelNFix

## Prerequisites
- Node.js
- MongoDB (running locally on port 27017)

## Getting Started

### 1. Start the Backend Server
```bash
cd server
npm install
node index.js
```
Server runs on http://localhost:5001

### 2. Start the Frontend Client
Open a new terminal:
```bash
cd client
npm install
npm run dev
```
Client runs on http://localhost:5173

## Features Implemented
- **Authentication**: Login and Register pages.
- **Routing**: Home, Login, Register, Dashboard (Protected).
- **Styling**: Tailwind CSS used for responsive design.

## Firebase Storage Rules

If uploads still fail with `storage/unauthorized` after these code fixes, deploy the storage rules file:

```bash
firebase deploy --only storage
```

The repository includes [storage.rules](/Users/yashkamble/Documents/fuelnfix/storage.rules) with scoped rules for:
- `problem_photos/{uid}/**`
- `problem_photos/{displayName}/**` (legacy compatibility for older clients)
- `shop-photos/{uid}/**`
- `shop-photos/{fileName}` (legacy compatibility for older clients)
