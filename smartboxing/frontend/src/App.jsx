// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute'; // <-- Import
import LoginPage from './pages/LoginPage';
import DailySummaryPage from './pages/DailySummaryPage';
import BoxesDashboardPage from './pages/BoxesDashboardPage';
import DoctorsPage from './pages/DoctorsPage';
import ReportsPage from './pages/ReportsPage';
import AgendaPage from './pages/AgendaPage';
import BoxDetailPage from './pages/BoxDetailPage'; // <-- Import BoxDetailPage
import DoctorDetailPage from './pages/DoctorDetailPage'; // <-- Import DoctorDetailPage
import AnalystPage from './pages/AnalystPage'; // <-- Import AnalystPage
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* All routes inside here are now protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DailySummaryPage />} />
          <Route path="boxes" element={<BoxesDashboardPage />} />
          <Route path="boxes/:boxId" element={<BoxDetailPage />} /> {/* <-- Add route for BoxDetailPage */}
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="doctors/:doctorId" element={<DoctorDetailPage />} /> {/* <-- Add route for DoctorDetailPage */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="analista" element={<AnalystPage />} /> {/* <-- Add route for AnalystPage */}
        </Route>
      </Route>

      {/* Login page is not protected */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;