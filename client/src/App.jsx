import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from "./components/theme-provider"
import { ToastProvider } from "./components/Toast"
import { API_BASE_URL } from './lib/api';
import Home from './pages/Home';

import { SocketProvider } from './context/SocketContext';

// Lazy-loaded routes — only downloaded when the user navigates to them
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));
const VerificationPending = lazy(() => import('./pages/VerificationPending'));
const Legal = lazy(() => import('./pages/Legal'));
const Terms = lazy(() => import('./pages/Terms'));
const DataPolicy = lazy(() => import('./pages/DataPolicy'));

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  // Wake up the Render backend on app load so it's ready when user logs in
  useEffect(() => {
    fetch(`${API_BASE_URL}/`, { method: 'GET' }).catch(() => { });
  }, []);
  return (
    <ThemeProvider defaultTheme="system" storageKey="fuelnfix-ui-theme">
      <SocketProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/provider-dashboard" element={<ProviderDashboard />} />
              <Route path="/verification-pending" element={<VerificationPending />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/data-info" element={<DataPolicy />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </SocketProvider>
  </ThemeProvider>
);
}

export default App;

