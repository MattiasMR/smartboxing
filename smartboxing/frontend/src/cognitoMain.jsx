// src/cognitoMain.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CognitoApp from './CognitoApp.jsx';
import { initImageCache } from './utils/imageCache.js';
import { DEMO_MODE, API_CONFIG, COGNITO_CONFIG } from './config.js';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/responsive-global.css';
import './styles/production-responsive.css';

// --- Chart.js Global Configuration ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// --- Initialize Image Cache ---
initImageCache();

// --- Development vs Production Check ---
const isDevelopment = import.meta.env.DEV;
console.log(`🚀 SmartBoxing Frontend starting in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log('🔧 Environment variables:', {
  API_BASE: import.meta.env.VITE_API_BASE,
  COGNITO_DOMAIN: import.meta.env.VITE_COGNITO_DOMAIN,
  COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID?.substring(0, 8) + '...',
  REDIRECT_URI: import.meta.env.VITE_REDIRECT_URI,
  LOGOUT_URI: import.meta.env.VITE_LOGOUT_URI,
});
console.log('🔧 Computed configuration from config.js:', {
  DEMO_MODE,
  API_BASE_URL: API_CONFIG.BASE_URL,
  COGNITO_DOMAIN: COGNITO_CONFIG.DOMAIN,
  REDIRECT_URI: COGNITO_CONFIG.REDIRECT_URI,
  LOGOUT_URI: COGNITO_CONFIG.LOGOUT_URI,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CognitoApp />
    </BrowserRouter>
  </React.StrictMode>,
);