import { Link } from 'react-router-dom';
import './About.css';

const team = [
  {
    name: 'Francisco Polo',
    email: 'f.polov@udd.cl',
    phone: '+56941166845',
    role: 'Ingeniería Civil en Informática e Innovación Tecnológica',
  },
  {
    name: 'Mattias Morales',
    email: 'm.moralesr@udd.cl',
    phone: '+56967895978',
    role: 'Ingeniería Civil en Informática e Innovación Tecnológica',
  },
  {
    name: 'Milan Kurte',
    email: 'm.kurtec@udd.cl',
    phone: '+56965240485',
    role: 'Ingeniería Civil en Informática e Innovación Tecnológica',
  },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <header className="about-hero">
        <div className="about-hero__content">
          <p className="about-tag">FM IT Solutions</p>
          <h1>Sobre Nosotros</h1>
          <p className="about-subtitle">
            Construimos SmartBoxing para que la gestión de espacios sea sencilla, segura y lista para crecer.
          </p>
          <div className="about-actions">
            <Link to="/" className="btn-about-secondary">Volver al Home</Link>
            <Link to="/register" className="btn-about-primary">Comenzar Gratis</Link>
          </div>
        </div>
        <div className="about-hero__card">
          <h3>Contactar Ventas</h3>
          <p>Hablemos de cómo SmartBoxing se adapta a tu organización.</p>
          <div className="about-contact-chip">
            <span>f.polov@udd.cl</span>
          </div>
          <Link to="/register" className="btn-about-primary ghost">Agenda una demo</Link>
        </div>
      </header>

      <section className="about-section">
        <div className="about-grid">
          <div className="about-card">
            <h2>Quiénes somos</h2>
            <p>
              Somos FM IT Solutions, un equipo apasionado por diseñar y operar productos SaaS críticos. 
              SmartBoxing nace de la necesidad de gestionar espacios físicos con eficiencia, visibilidad
              en tiempo real y una experiencia cuidada para administradores y equipos.
            </p>
          </div>
          <div className="about-card">
            <h2>Lo que hacemos</h2>
            <p>
              Acompañamos a coworkings, clínicas, gimnasios y organizaciones que requieren control absoluto
              de sus espacios. Combinamos backend serverless en AWS, autenticación con Cognito y un frontend
              optimizado para que la adopción sea rápida y segura.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section__header">
          <h2>Equipo</h2>
          <p>Tu punto de contacto directo para soporte, onboarding y evolución del producto.</p>
        </div>
        <div className="about-team">
          {team.map((member) => (
            <div className="about-team-card" key={member.email}>
              <div className="about-team-card__header">
                <div className="avatar">{member.name.charAt(0)}</div>
                <div>
                  <h3>{member.name}</h3>
                  <p className="role">{member.role}</p>
                </div>
              </div>
              <div className="about-team-card__contacts">
                <a href={`mailto:${member.email}`}>{member.email}</a>
                <a href={`tel:${member.phone}`}>{member.phone}</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section about-bottom-cta">
        <div className="about-bottom-cta__content">
          <h2>¿Listo para hablar con nosotros?</h2>
          <p>Cuéntanos tu caso y te ayudamos a configurar tu tenant y tus flujos de reserva.</p>
        </div>
        <div className="about-bottom-cta__actions">
          <Link to="/" className="btn-about-secondary">Volver al Home</Link>
          <Link to="/register" className="btn-about-primary">Crear cuenta</Link>
        </div>
      </section>
    </div>
  );
}
