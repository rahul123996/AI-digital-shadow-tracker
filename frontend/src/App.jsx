import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import AIAssistant from './components/AIAssistant.jsx';
import { AppProvider, useApp } from './state/AppContext.jsx';

function ProtectedShell({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <div className="bg-aurora" aria-hidden />
      <Sidebar />
      <main className="app-main page-fade">{children}</main>
      <AIAssistant />
    </div>
  );
}

function Routed() {
  const { user } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && window.location.pathname === '/login') navigate('/dashboard');
  }, [user, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedShell><DashboardPage /></ProtectedShell>} />
      <Route path="/upload" element={<ProtectedShell><UploadPage /></ProtectedShell>} />
      <Route path="/alerts" element={<ProtectedShell><AlertsPage /></ProtectedShell>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Routed />
    </AppProvider>
  );
}
