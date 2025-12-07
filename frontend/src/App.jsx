import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { useAuth } from './auth/useAuth.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import { useTheme } from './hooks/useTheme.js';
import { useEffect } from 'react';

// New pages with custom Cognito auth
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

// Admin pages
import TenantsList from './pages/admin/TenantsList.jsx';
import TenantForm from './pages/admin/TenantForm.jsx';
import UsersList from './pages/admin/UsersList.jsx';
import UserForm from './pages/admin/UserForm.jsx';

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

          <Route path="/staff" element={<DoctorsList />} />
          <Route path="/staff/new" element={<DoctorForm />} />
          <Route path="/staff/:id/edit" element={<DoctorForm />} />
          <Route path="/doctors/*" element={<Navigate to="/staff" replace />} />

          <Route path="/appointments" element={<AppointmentsList />} />
          <Route path="/appointments/new" element={<AppointmentForm />} />
          <Route path="/appointments/:id/edit" element={<AppointmentForm />} />

          <Route path="/settings" element={<Settings />} />
          <Route path="/seed" element={<SeedPage />} />
        </Route>

        {/* Admin routes - require tenant_admin or super_admin */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          {/* Tenants - super_admin only */}
          <Route path="/admin/tenants" element={<AdminRoute requireSuperAdmin><TenantsList /></AdminRoute>} />
          <Route path="/admin/tenants/new" element={<AdminRoute requireSuperAdmin><TenantForm /></AdminRoute>} />
          <Route path="/admin/tenants/:id/edit" element={<AdminRoute requireSuperAdmin><TenantForm /></AdminRoute>} />
          
          {/* Users - tenant_admin or super_admin */}
          <Route path="/admin/users" element={<UsersList />} />
          <Route path="/admin/users/new" element={<UserForm />} />
          <Route path="/admin/users/:id/edit" element={<UserForm />} />
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
