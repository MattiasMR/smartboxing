import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './Landing.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleScrollTop = (event) => {
    event.preventDefault();
    const scrollElement = document.scrollingElement || document.documentElement;
    if (scrollElement?.scrollTo) {
      scrollElement.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollElement.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTop = 0;
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="landing-page" id="top">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <a href="#top" className="nav-logo" onClick={handleScrollTop}>
            <div className="nav-logo-icon">📦</div>
            <span>SmartBoxing</span>
          </a>
          {/* Mobile login button - always visible */}
          {!user && (
            <Link to="/login" className="nav-mobile-login">
              Iniciar Sesión
            </Link>
          )}
          {user && (
            <Link to="/dashboard" className="nav-mobile-login">
              Dashboard
            </Link>
          )}
          <div className="nav-links">
            <a href="#features">Características</a>
            <a href="#pricing">Precios</a>
            {user ? (
              <Link to="/dashboard" className="btn-nav-primary">
                Ir al Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-nav-secondary">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="btn-nav-primary">
                  Comenzar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">✨</span>
              Gestión de Espacios Inteligente
            </div>
            <h1 className="hero-title">
              Gestiona tus <span className="hero-highlight">Espacios Físicos</span>
              <br />
              de forma simple y eficiente
            </h1>
            <p className="hero-description">
              Plataforma SaaS todo-en-uno para reservas, gestión de personal y análisis.
              Perfecta para coworkings, clínicas, estudios, gimnasios y más.
            </p>
            <div className="hero-cta">
              <button onClick={handleGetStarted} className="btn-hero-primary">
                Comenzar Gratis
                <span className="btn-arrow">→</span>
              </button>
              <a href="#pricing" className="btn-hero-secondary">
                Ver Precios
              </a>
            </div>
            <p className="hero-footnote">
              ✓ Sin tarjeta de crédito  ✓ Configuración en 5 minutos  ✓ Soporte 24/7
            </p>
          </div>
          <div className="hero-visual">
            <div className="visual-card visual-card-1">
              <div className="card-header">
                <div className="card-icon">📊</div>
                <div className="card-title">Dashboard</div>
              </div>
              <div className="card-content">
                <div className="stat-row">
                  <span className="stat-label">Reservas Hoy</span>
                  <span className="stat-value">24</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Ocupación</span>
                  <span className="stat-value">87%</span>
                </div>
                <div className="chart-bar" style={{width: '85%'}}></div>
                <div className="chart-bar" style={{width: '65%'}}></div>
                <div className="chart-bar" style={{width: '92%'}}></div>
              </div>
            </div>
            <div className="visual-card visual-card-2">
              <div className="card-header">
                <div className="card-icon">📅</div>
                <div className="card-title">Próximas Reservas</div>
              </div>
              <div className="card-content">
                <div className="booking-item">
                  <div className="booking-dot"></div>
                  <div className="booking-info">
                    <div className="booking-name">Sala A - 10:00</div>
                    <div className="booking-time">Marketing Team</div>
                  </div>
                </div>
                <div className="booking-item">
                  <div className="booking-dot"></div>
                  <div className="booking-info">
                    <div className="booking-name">Sala B - 14:30</div>
                    <div className="booking-time">Product Design</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="features-container">
          <div className="section-header">
            <h2>Todo lo que necesitas para gestionar tus espacios</h2>
            <p>Potentes herramientas diseñadas para simplificar tu día a día</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Reservas Inteligentes</h3>
              <p>
                Sistema de calendario avanzado con disponibilidad en tiempo real,
                confirmaciones automáticas y recordatorios.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Gestión de Personal</h3>
              <p>
                Administra tu equipo, horarios, permisos y roles desde un solo lugar.
                Control total y visibilidad completa.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics en Tiempo Real</h3>
              <p>
                Dashboard con métricas clave: ocupación, ingresos, tendencias y KPIs.
                Toma decisiones basadas en datos.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Seguridad Enterprise</h3>
              <p>
                Autenticación multi-factor, encriptación end-to-end y cumplimiento
                con estándares internacionales.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Personalización Total</h3>
              <p>
                Adapta la plataforma a tu marca: logos, colores, textos y flujos.
                100% white-label.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Multi-dispositivo</h3>
              <p>
                Acceso desde cualquier dispositivo: web, tablet, móvil.
                Experiencia optimizada en todas las pantallas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="pricing-container">
          <div className="section-header">
            <h2>Precios transparentes y simples</h2>
            <p>Sin costos ocultos. Cancela cuando quieras.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Starter</h3>
                <p>Perfecto para comenzar</p>
              </div>
              <div className="pricing-price">
                <span className="price-currency">$</span>
                <span className="price-amount">0</span>
                <span className="price-period">/mes</span>
              </div>
              <ul className="pricing-features">
                <li>✓ Hasta 5 espacios</li>
                <li>✓ 50 reservas/mes</li>
                <li>✓ 3 usuarios</li>
                <li>✓ Soporte por email</li>
                <li>✓ Analytics básicos</li>
              </ul>
              <button onClick={handleGetStarted} className="btn-pricing">
                Comenzar Gratis
              </button>
            </div>

            <div className="pricing-card pricing-card-featured">
              <div className="pricing-badge">Más Popular</div>
              <div className="pricing-header">
                <h3>Professional</h3>
                <p>Para equipos en crecimiento</p>
              </div>
              <div className="pricing-price">
                <span className="price-currency">$</span>
                <span className="price-amount">49</span>
                <span className="price-period">/mes</span>
              </div>
              <ul className="pricing-features">
                <li>✓ Espacios ilimitados</li>
                <li>✓ Reservas ilimitadas</li>
                <li>✓ 10 usuarios</li>
                <li>✓ Soporte prioritario</li>
                <li>✓ Analytics avanzados</li>
                <li>✓ Personalización completa</li>
                <li>✓ API access</li>
              </ul>
              <button onClick={handleGetStarted} className="btn-pricing btn-pricing-featured">
                Comenzar Prueba
              </button>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Enterprise</h3>
                <p>Para grandes organizaciones</p>
              </div>
              <div className="pricing-price">
                <span className="price-label">Personalizado</span>
              </div>
              <ul className="pricing-features">
                <li>✓ Todo en Professional</li>
                <li>✓ Usuarios ilimitados</li>
                <li>✓ SLA garantizado</li>
                <li>✓ Soporte dedicado 24/7</li>
                <li>✓ On-premise disponible</li>
                <li>✓ Capacitación incluida</li>
                <li>✓ Integraciones custom</li>
              </ul>
              <Link to="/about" className="btn-pricing">
                Contactar Ventas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2>¿Listo para optimizar tu gestión?</h2>
          <p>Únete a cientos de negocios que ya confían en SmartBoxing</p>
          <button onClick={handleGetStarted} className="btn-cta">
            Comenzar Gratis Ahora
            <span className="btn-arrow">→</span>
          </button>
          <p className="cta-footnote">
            No se requiere tarjeta de crédito • Configuración instantánea
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">📦</div>
              <span>SmartBoxing</span>
            </div>
            <p>La plataforma de gestión de espacios más simple y poderosa.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Producto</h4>
              <a href="#features">Características</a>
              <a href="#pricing">Precios</a>
            </div>
            <div className="footer-column">
              <h4>Compañía</h4>
              <Link to="/about">Sobre Nosotros</Link>
              <Link to="/about">Blog</Link>
              <Link to="/about">Contacto</Link>
              <Link to="/about">Carreras</Link>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <Link to="/terms">Privacidad</Link>
              <Link to="/terms">Términos</Link>
              <Link to="/terms">Seguridad</Link>
              <Link to="/terms">GDPR</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 SmartBoxing. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
