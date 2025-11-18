import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import { useTheme } from './hooks/useTheme.js';
import { useEffect } from 'react';
import Login from './pages/Login.jsx';
import Callback from './pages/Callback.jsx';

import BoxesList from './pages/BoxesList.jsx';
import BoxForm from './pages/BoxForm.jsx';

import DoctorsList from './pages/DoctorsList.jsx';
import DoctorForm from './pages/DoctorForm.jsx';

import AppointmentsList from './pages/AppointmentsList.jsx';
import AppointmentForm from './pages/AppointmentForm.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/SettingsNew.jsx';
import SeedPage from './pages/SeedPage.jsx';

const qc = new QueryClient();

function AppContent() {
  const { initializeTheme } = useTheme();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />

        {/* Rutas protegidas con Layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
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

        <Route path="*" element={<Login />} />
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
