import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { useAuth } from './auth/useAuth.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import { useTheme } from './hooks/useTheme.js';
import { useEffect } from 'react';

// Pages
import LandingPage from './pages/Landing.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';

import BoxesList from './pages/BoxesList.jsx';
import BoxForm from './pages/BoxForm.jsx';

import DoctorsList from './pages/DoctorsList.jsx';
import DoctorForm from './pages/DoctorForm.jsx';

import AppointmentsList from './pages/AppointmentsList.jsx';
import AppointmentForm from './pages/AppointmentForm.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/Settings.jsx';
import SeedPage from './pages/SeedPage.jsx';

const qc = new QueryClient();

// Componente para redirigir root según autenticación
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: '50px', height: '50px', border: '4px solid #f3f4f6', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    </div>;
  }

  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function AppContent() {
  const { initializeTheme } = useTheme();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: Landing o Dashboard según auth */}
        <Route path="/" element={<RootRedirect />} />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas protegidas con Layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/boxes" element={<BoxesList />} />
          <Route path="/boxes/new" element={<BoxForm />} />
          <Route path="/boxes/:id/edit" element={<BoxForm />} />

          <Route path="/doctors" element={<DoctorsList />} />
          <Route path="/doctors/new" element={<DoctorForm />} />
          <Route path="/doctors/:id/edit" element={<DoctorForm />} />

          <Route path="/appointments" element={<AppointmentsList />} />
          <Route path="/appointments/new" element={<AppointmentForm />} />
          <Route path="/appointments/:id/edit" element={<AppointmentForm />} />

          <Route path="/settings" element={<Settings />} />
          <Route path="/seed" element={<SeedPage />} />
        </Route>

        {/* Ruta no encontrada: redirige a root (que mostrará Landing o Dashboard) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
