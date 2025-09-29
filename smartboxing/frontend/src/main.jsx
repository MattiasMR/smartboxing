// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { initImageCache } from './utils/imageCache.js';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/theme-variables.css'; // Import CSS variables for theming
import './styles/responsive-global.css'; // Import global responsive styles
import './styles/production-responsive.css'; // Import production-specific responsive fixes

// --- Chart.js Global Configuration ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement, // <-- Import ArcElement for Pie/Doughnut charts
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement, // <-- Register ArcElement
  Title,
  Tooltip,
  Legend
);
// --- End Configuration ---

// Initialize image cache when app starts
initImageCache();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);