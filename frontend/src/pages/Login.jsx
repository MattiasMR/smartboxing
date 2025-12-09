import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../auth/cognitoAuth';
import { useAuth } from '../auth/useAuth';
import { switchTenant } from '../api/tenancy';
import './AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, clearActiveTenant, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { accessToken, idToken } = await signIn(email, password);
      
      // Use existing auth context login
      const user = await login({ access_token: accessToken, id_token: idToken });
      
      // Force clear tenancy if one exists from a previous session
      // This ensures we always start fresh at the selection screen
      if (user && user.tenantId) {
        try {
          await switchTenant(null);
          // Also clear it from the local auth state immediately
          // so the UI doesn't think we are in a tenant
          clearActiveTenant();
          
          // IMPORTANT: Refresh the token to ensure localStorage has a token WITHOUT tenantId
          // Otherwise, a page reload would read the old token and redirect to dashboard
          if (refreshUser) {
            await refreshUser();
          }
        } catch (clearErr) {
          console.warn('Could not clear previous tenancy:', clearErr);
        }
      }

      // Redirect to My Tenancies by default, not Dashboard
      // Dashboard requires an active tenant, which we don't have yet
      navigate('/account/tenancies');
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.code === 'UserNotConfirmedException') {
        setError('Por favor confirma tu email antes de iniciar sesión');
      } else if (err.code === 'NotAuthorizedException') {
        setError('Email o contraseña incorrectos');
      } else if (err.code === 'UserNotFoundException') {
        setError('Usuario no encontrado');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="auth-back">
          <span>←</span> Volver
        </Link>
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <div className="logo-icon">📦</div>
            <span className="logo-text">SmartBoxing</span>
          </Link>
          <h1>Iniciar Sesión</h1>
          <p>Bienvenido de vuelta. Ingresa tus credenciales para continuar.</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
              minLength={8}
            />
          </div>

          <div className="form-footer">
            <Link to="/forgot-password" className="link-secondary">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="link-primary">
              Crear cuenta gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
