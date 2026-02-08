import axios from 'axios';

const PROD_API = 'https://fuelnfix-backend-production.up.railway.app';
const LOCAL_API = 'http://localhost:5001';

// Dynamic API URL Logic:
// 1. Runtime Check: If hostname is NOT localhost/127.0.0.1, we are in production (Vercel).
// 2. Build-time Check: import.meta.env.PROD (fallback).
// 3. Dev override: VITE_API_URL.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = !isLocal
    ? PROD_API
    : (import.meta.env.VITE_API_URL || LOCAL_API);

// Create an Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
