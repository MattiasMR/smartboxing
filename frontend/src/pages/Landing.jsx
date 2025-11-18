import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useEffect } from 'react';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/login'); // Cognito hosted UI tiene signup
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="gradient-overlay"></div>
        </div>
        
        <nav className="landing-nav">
          <div className="nav-container">
            <div className="logo-section">
              <div className="logo-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" rx="8" fill="url(#gradient1)"/>
                  <path d="M12 12h6v6h-6zM22 12h6v6h-6zM12 22h6v6h-6zM22 22h6v6h-6z" fill="white" opacity="0.9"/>
                  <defs>
                    <linearGradient id="gradient1" x1="0" y1="0" x2="40" y2="40">
                      <stop offset="0%" stopColor="#3B82F6"/>
                      <stop offset="100%" stopColor="#8B5CF6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="logo-text">SmartBoxing</span>
            </div>
            
            <div className="nav-actions">
              <button className="btn-secondary" onClick={handleLogin}>
                Iniciar Sesión
              </button>
              <button className="btn-primary" onClick={handleSignup}>
                Comenzar Gratis
              </button>
            </div>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">⚡</span>
            <span>Gestión de Espacios Inteligente</span>
          </div>
          
          <h1 className="hero-title">
            Gestiona tus <span className="gradient-text">Espacios Físicos</span>
            <br />
            de forma simple y eficiente
          </h1>
          
          <p className="hero-description">
            Plataforma SaaS todo-en-uno para reservas, gestión de personal y análisis. 
            Perfecta para coworkings, clínicas, estudios, gimnasios y más.
          </p>

          <div className="hero-cta">
            <button className="btn-primary btn-large" onClick={handleSignup}>
              <span>Comenzar Gratis</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3l7 7-7 7M17 10H3"/>
              </svg>
            </button>
            <button className="btn-secondary btn-large" onClick={handleLogin}>
              Ver Demo
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Espacios Gestionados</div>
            </div>
            <div className="stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Empresas Confían</div>
            </div>
            <div className="stat">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Todo lo que necesitas</h2>
            <p className="section-description">
              Herramientas profesionales para gestionar tus espacios de forma eficiente
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <h3 className="feature-title">Gestión de Espacios</h3>
              <p className="feature-description">
                Administra múltiples espacios, define capacidad, equipamiento y disponibilidad en tiempo real.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="feature-title">Personal & Clientes</h3>
              <p className="feature-description">
                Gestiona tu equipo y base de clientes. Perfiles completos, historial y métricas de rendimiento.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h3 className="feature-title">Reservas Inteligentes</h3>
              <p className="feature-description">
                Sistema de reservas con validación automática, recordatorios y prevención de conflictos.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="20" x2="12" y2="10"/>
                  <line x1="18" y1="20" x2="18" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="16"/>
                </svg>
              </div>
              <h3 className="feature-title">Analytics Avanzado</h3>
              <p className="feature-description">
                Reportes en tiempo real, ocupación, tendencias y KPIs para tomar decisiones informadas.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="feature-title">Multi-Tenant</h3>
              <p className="feature-description">
                Datos aislados por cliente. Personalización completa: logos, colores, horarios y políticas.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h3 className="feature-title">API Completa</h3>
              <p className="feature-description">
                REST API documentada. Integra SmartBoxing con tus sistemas existentes fácilmente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Planes para cada necesidad</h2>
            <p className="section-description">
              Comienza gratis, escala cuando lo necesites
            </p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Starter</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">0</span>
                  <span className="period">/mes</span>
                </div>
              </div>
              <ul className="features-list">
                <li>✓ Hasta 5 espacios</li>
                <li>✓ 1 usuario administrador</li>
                <li>✓ 100 reservas/mes</li>
                <li>✓ Reportes básicos</li>
                <li>✓ Soporte por email</li>
              </ul>
              <button className="btn-secondary btn-block" onClick={handleSignup}>
                Comenzar Gratis
              </button>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-badge">Más Popular</div>
              <div className="pricing-header">
                <h3>Professional</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">29</span>
                  <span className="period">/mes</span>
                </div>
              </div>
              <ul className="features-list">
                <li>✓ Espacios ilimitados</li>
                <li>✓ Hasta 10 usuarios</li>
                <li>✓ Reservas ilimitadas</li>
                <li>✓ Analytics avanzado</li>
                <li>✓ Personalización completa</li>
                <li>✓ Soporte prioritario</li>
                <li>✓ API access</li>
              </ul>
              <button className="btn-primary btn-block" onClick={handleSignup}>
                Probar 14 días gratis
              </button>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Enterprise</h3>
                <div className="price">
                  <span className="amount">Custom</span>
                </div>
              </div>
              <ul className="features-list">
                <li>✓ Todo en Professional</li>
                <li>✓ Usuarios ilimitados</li>
                <li>✓ SLA garantizado</li>
                <li>✓ Soporte 24/7</li>
                <li>✓ Implementación dedicada</li>
                <li>✓ Ambiente aislado</li>
              </ul>
              <button className="btn-secondary btn-block">
                Contactar Ventas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>¿Listo para optimizar tu gestión?</h2>
            <p>Únete a cientos de empresas que ya confían en SmartBoxing</p>
            <button className="btn-primary btn-large" onClick={handleSignup}>
              Comenzar Gratis - Sin Tarjeta
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo-section">
                <div className="logo-icon">
                  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="8" fill="url(#gradient2)"/>
                    <path d="M12 12h6v6h-6zM22 12h6v6h-6zM12 22h6v6h-6zM22 22h6v6h-6z" fill="white" opacity="0.9"/>
                    <defs>
                      <linearGradient id="gradient2" x1="0" y1="0" x2="40" y2="40">
                        <stop offset="0%" stopColor="#3B82F6"/>
                        <stop offset="100%" stopColor="#8B5CF6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span>SmartBoxing</span>
              </div>
              <p className="footer-tagline">
                Gestión inteligente de espacios físicos
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Producto</h4>
                <ul>
                  <li><a href="#features">Características</a></li>
                  <li><a href="#pricing">Precios</a></li>
                  <li><a href="#demo">Demo</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Empresa</h4>
                <ul>
                  <li><a href="#about">Nosotros</a></li>
                  <li><a href="#blog">Blog</a></li>
                  <li><a href="#contact">Contacto</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#privacy">Privacidad</a></li>
                  <li><a href="#terms">Términos</a></li>
                  <li><a href="#security">Seguridad</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 SmartBoxing. Todos los derechos reservados.</p>
            <div className="footer-social">
              <a href="#twitter" aria-label="Twitter">𝕏</a>
              <a href="#linkedin" aria-label="LinkedIn">in</a>
              <a href="#github" aria-label="GitHub">⚡</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
