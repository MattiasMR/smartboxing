import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseHashToTokens } from '../auth/cognito.js';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function Callback() {
  const nav = useNavigate();
  const { login } = useAuth();
  const processed = useRef(false);
  const [status, setStatus] = useState('Procesando login...');

  useEffect(() => {
    // Evitar procesamiento múltiple
    if (processed.current) return;
    processed.current = true;

    console.log('[Callback] Processing tokens from hash:', window.location.hash);
    
    const { id_token, access_token, expires_in } = parseHashToTokens(window.location.hash);
    
    console.log('[Callback] Parsed tokens:', { 
      hasAccessToken: !!access_token, 
      hasIdToken: !!id_token, 
      expires_in 
    });

    if (access_token) {
      console.log('[Callback] Valid tokens, calling login()');
      setStatus('Cargando configuración...');
      
      login({ access_token, id_token, expires_in }).then(() => {
        console.log('[Callback] Login complete, navigating to /boxes');
        nav('/boxes', { replace: true });
      }).catch(error => {
        console.error('[Callback] Error during login:', error);
        nav('/boxes', { replace: true }); // Navegar de todos modos
      });
    } else {
      console.log('[Callback] No access token, redirecting to login');
      nav('/login', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar, login y nav son estables

  return <div style={{ padding: '2rem', textAlign: 'center' }}>
    <p>{status}</p>
  </div>;
}
