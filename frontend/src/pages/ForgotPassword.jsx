import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../auth/cognitoAuth';
import './AuthPages.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setStep(2);
      setSuccess('Código de verificación enviado a tu email.');
    } catch (err) {
      console.error('Forgot password error:', err);
      if (err.code === 'UserNotFoundException') {
        setError('No existe una cuenta con este email.');
      } else if (err.code === 'LimitExceededException') {
        setError('Demasiados intentos. Por favor espera un momento.');
      } else {
        setError(err.message || 'Error al enviar el código.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPassword(email, code, newPassword);
      setSuccess('Contraseña restablecida exitosamente.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.code === 'CodeMismatchException') {
        setError('El código de verificación es incorrecto.');
      } else if (err.code === 'ExpiredCodeException') {
        setError('El código ha expirado. Solicita uno nuevo.');
      } else if (err.code === 'InvalidPasswordException') {
        setError('La contraseña no cumple con los requisitos de seguridad.');
      } else {
        setError(err.message || 'Error al restablecer la contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/login" className="auth-back">
          <span>←</span> Volver al Login
        </Link>
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <div className="logo-icon">📦</div>
            <span className="logo-text">SmartBoxing</span>
          </Link>
          <h1>Recuperar Contraseña</h1>
          <p>
            {step === 1 
              ? 'Ingresa tu email para recibir un código de recuperación.' 
              : 'Ingresa el código recibido y tu nueva contraseña.'}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="auth-success" style={{ 
            backgroundColor: '#d1fae5', 
            color: '#065f46', 
            padding: '0.75rem', 
            borderRadius: '0.375rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>✓</span>
            <p>{success}</p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="auth-form">
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

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Enviando código...
                </>
              ) : (
                'Enviar Código'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="code">Código de Verificación</label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
              />
              <p className="form-hint">Mínimo 8 caracteres, mayúsculas, minúsculas y números.</p>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Restableciendo...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </button>
            
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setStep(1)}
              style={{ marginTop: '1rem', width: '100%' }}
              disabled={loading}
            >
              Volver a enviar código
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
