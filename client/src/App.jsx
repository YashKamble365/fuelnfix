import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from "./components/theme-provider"
import { ToastProvider } from "./components/Toast"
import { API_BASE_URL } from './lib/api';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import VerificationPending from './pages/VerificationPending';
import Legal from './pages/Legal';
import Terms from './pages/Terms';
import DataPolicy from './pages/DataPolicy';

function App() {
  // Wake up the Render backend on app load so it's ready when user logs in
  useEffect(() => {
    fetch(`${API_BASE_URL}/`, { method: 'GET' }).catch(() => { });
  }, []);
  return (
    <ThemeProvider defaultTheme="system" storageKey="fuelnfix-ui-theme">
      <ToastProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

