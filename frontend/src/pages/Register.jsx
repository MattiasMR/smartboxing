import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, confirmSignUp } from '../auth/cognitoAuth';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('signup'); // 'signup' or 'confirm'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Create user without tenant - they will request a tenancy after registration
      await signUp(email, password, {
        name,
        // No tenantId - user will request tenancy after registration
      });
      setSuccess('¡Cuenta creada! Revisa tu email para el código de verificación.');
      setStep('confirm');
    } catch (err) {
      console.error('SignUp error:', err);
      
      if (err.code === 'UsernameExistsException') {
        setError('Este email ya está registrado');
      } else if (err.code === 'InvalidPasswordException') {
        setError('La contraseña no cumple los requisitos');
      } else if (err.code === 'InvalidParameterException') {
        setError('Email inválido');
      } else {
        setError(err.message || 'Error al crear cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmSignUp(email, code);
      setSuccess('¡Email verificado! Redirigiendo al login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Confirmation error:', err);
      
      if (err.code === 'CodeMismatchException') {
        setError('Código incorrecto');
      } else if (err.code === 'ExpiredCodeException') {
        setError('Código expirado. Solicita uno nuevo');
      } else {
        setError(err.message || 'Error al verificar código');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <div className="logo-icon">📦</div>
            <span className="logo-text">SmartBoxing</span>
          </Link>
          <h1>{step === 'signup' ? 'Crear Cuenta' : 'Verificar Email'}</h1>
          <p>
            {step === 'signup'
              ? 'Comienza gratis. No necesitas tarjeta de crédito.'
              : 'Ingresa el código que enviamos a tu email.'}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="auth-success">
            <span className="success-icon">✓</span>
            <p>{success}</p>
          </div>
        )}

        {step === 'signup' ? (
          <form onSubmit={handleSignUp} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Nombre Completo</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Juan Pérez"
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>

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
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                disabled={loading}
                minLength={8}
              />
              <small className="form-hint">
                Debe incluir mayúsculas, minúsculas y números
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                autoComplete="new-password"
                disabled={loading}
                minLength={8}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta Gratis'
              )}
            </button>

            <p className="form-terms">
              Al crear una cuenta, aceptas nuestros{' '}
              <Link to="/terms" className="link-secondary">Términos de Servicio</Link> y{' '}
              <Link to="/terms" className="link-secondary">Política de Privacidad</Link>.
            </p>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="auth-form">
            <div className="form-group">
              <label htmlFor="code">Código de Verificación</label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                autoComplete="one-time-code"
                disabled={loading}
                maxLength={6}
              />
              <small className="form-hint">
                Revisa tu email ({email}) para obtener el código de 6 dígitos
              </small>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verificando...
                </>
              ) : (
                'Verificar Email'
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('signup')}
              className="btn-secondary"
              disabled={loading}
            >
              Volver
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="link-primary">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
