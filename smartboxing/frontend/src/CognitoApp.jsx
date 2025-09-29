// src/CognitoApp.jsx
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import CognitoProtectedRoute from './components/common/CognitoProtectedRoute';
import CognitoLoginPage from './pages/CognitoLoginPage';
import CallbackPage from './pages/CallbackPage';
import DailySummaryPage from './pages/DailySummaryPage';
import BoxesDashboardPage from './pages/BoxesDashboardPage';
import DoctorsPage from './pages/DoctorsPage';
import ReportsPage from './pages/ReportsPage';
import AgendaPage from './pages/AgendaPage';
import BoxDetailPage from './pages/BoxDetailPage';
import DoctorDetailPage from './pages/DoctorDetailPage';
import AnalystPage from './pages/AnalystPage';
import PersonalizationPage from './pages/PersonalizationPage';
import NotFoundPage from './pages/NotFoundPage';

import { CognitoAuthProvider } from './context/CognitoAuthContext';
import { useTheme } from './hooks/useTheme';

function AppContent() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<CognitoLoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      
      {/* Protected routes */}
      <Route element={<CognitoProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DailySummaryPage />} />
          <Route path="boxes" element={<BoxesDashboardPage />} />
          <Route path="boxes/:boxId" element={<BoxDetailPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="doctors/:doctorId" element={<DoctorDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="analista" element={<AnalystPage />} />
          <Route path="personalizar" element={<PersonalizationPage />} />
        </Route>
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function CognitoApp() {
  // Initialize theme on app load
  const { isLoading } = useTheme();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: 'var(--background-primary)',
        color: 'var(--text-primary)'
      }}>
        Cargando tema...
      </div>
    );
  }

  return (
    <CognitoAuthProvider>
      <AppContent />
    </CognitoAuthProvider>
  );
}

export default CognitoApp;