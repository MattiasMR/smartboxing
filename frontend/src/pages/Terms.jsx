import './Terms.css';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Aceptación',
    body: 'El uso de SmartBoxing implica la aceptación íntegra de estos Términos y Condiciones. Si no estás de acuerdo, no uses la plataforma.',
  },
  {
    title: '2. Cuentas y Acceso',
    body: 'Eres responsable de tus credenciales y de toda actividad realizada bajo tu cuenta. Notifica inmediatamente accesos no autorizados.',
  },
  {
    title: '3. Uso Permitido',
    body: 'No debes interferir con el servicio, intentar eludir medidas de seguridad ni usar la plataforma para actividades ilegales o sin la autorización del tenant.',
  },
  {
    title: '4. Datos y Privacidad',
    body: 'Procesamos datos conforme a las políticas del tenant y a la normativa aplicable. Tú mantienes la propiedad de tus datos; SmartBoxing los procesa para operar el servicio.',
  },
  {
    title: '5. Disponibilidad',
    body: 'Procuramos alta disponibilidad, pero puede haber mantenimientos o interrupciones. En planes con SLA se aplican los compromisos contractuales específicos.',
  },
  {
    title: '6. Contenido del Usuario',
    body: 'No subas contenido que infrinja derechos de terceros o sea ilícito. Podemos suspender acceso ante incumplimientos.',
  },
  {
    title: '7. Límites de Responsabilidad',
    body: 'SmartBoxing no será responsable por daños indirectos o pérdida de datos. La responsabilidad total se limita al monto pagado por el servicio durante los últimos 3 meses.',
  },
  {
    title: '8. Terminación',
    body: 'Podemos suspender o cerrar cuentas que incumplan estos términos. Puedes dejar de usar el servicio en cualquier momento; los datos serán tratados según la política del tenant.',
  },
  {
    title: '9. Cambios en los Términos',
    body: 'Podemos actualizar estos términos; notificaremos cambios relevantes. El uso continuado implica aceptación de las modificaciones.',
  },
  {
    title: '10. Contacto',
    body: 'Para consultas sobre estos Términos, contáctanos en soporte@smartboxing.dev.',
  },
];

export default function TermsPage() {
  return (
    <div className="terms-page">
      <nav className="static-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon">📦</div>
            <span>SmartBoxing</span>
          </Link>
          <div className="nav-links">
            <Link to="/about">Sobre Nosotros</Link>
            <Link to="/terms">Términos y Condiciones</Link>
            <Link to="/login" className="btn-nav-secondary">Iniciar Sesión</Link>
            <Link to="/register" className="btn-nav-primary">Comenzar Gratis</Link>
          </div>
          <div className="nav-mobile-actions">
            <Link to="/login" className="btn-nav-secondary">Iniciar Sesión</Link>
          </div>
        </div>
      </nav>

      <header className="terms-hero">
        <div>
          <p className="terms-tag">Términos y Condiciones</p>
          <h1>Condiciones de uso de SmartBoxing</h1>
          <p className="terms-subtitle">
            Revisa las reglas de uso del servicio. Si tienes dudas, contáctanos antes de continuar.
          </p>
        </div>
        <div className="terms-actions">
          <Link to="/" className="btn-terms-secondary">Volver al Home</Link>
        </div>
      </header>

      <main className="terms-content">
        {sections.map((section) => (
          <article key={section.title} className="terms-card">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </main>
    </div>
  );
}
