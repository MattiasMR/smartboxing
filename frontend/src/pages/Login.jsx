import { loginUrl } from '../auth/cognito.js';
import { FaUserMd, FaSignInAlt } from 'react-icons/fa';
import './Login.css';

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">
            <FaUserMd />
          </div>
          <h1 className="login-title">SmartBoxing</h1>
          <p className="login-subtitle">Sistema de Gestión Médica</p>
        </div>

        <div className="login-content">
          <p className="login-description">
            Bienvenido al sistema de gestión de boxes y citas médicas. 
            Inicia sesión para acceder a tu cuenta.
          </p>
          
          <a href={loginUrl()} className="login-button">
            <FaSignInAlt /> Iniciar Sesión con Cognito
          </a>
        </div>

        <div className="login-footer">
          <p>Sistema desarrollado para gestión hospitalaria</p>
        </div>
      </div>
    </div>
  );
}
