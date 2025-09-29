function NotFoundPage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ color: '#dc2626' }}>Página no encontrada</h1>
      <p style={{ color: '#6b7280' }}>La página que buscas no existe.</p>
      <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
        Volver al inicio
      </a>
    </div>
  );
}

export default NotFoundPage;