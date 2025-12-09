import { useState } from 'react';
import { seedDatabase, clearDatabase } from '../api/seed';
import './SeedPage.css';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({
    numBoxes: 10,
    numStaff: 8,
    numAppointments: 15
  });

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setProgress({ step: 'starting', message: 'Iniciando...' });

    try {
      const result = await seedDatabase({
        ...config,
        numDoctors: config.numStaff,
        onProgress: (prog) => setProgress(prog)
      });
      setResults(result);
      setProgress(null);
    } catch (err) {
      setError(err.message);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro? Esto borrará TODOS los registros de la base de datos.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setProgress({ step: 'starting', message: 'Borrando todo...' });

    try {
      const result = await clearDatabase({
        onProgress: (prog) => setProgress(prog)
      });
      setResults(result);
      setProgress(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const getProgressMessage = () => {
    if (!progress) return '';
    
    const { step, current, total, message } = progress;
    
    if (message) return message;
    
    const stepNames = {
      boxes: '📦 Recursos agendables',
      staff: '👥 Staff',
      doctors: '👥 Staff',
      appointments: '📅 Citas'
    };
    
    return `${stepNames[step] || step}: ${current}/${total}`;
  };

  return (
    <div className="seed-page">
      <div className="seed-container">
        <h1>🌱 Poblar Base de Datos</h1>
        <p className="seed-description">
          Crea datos de prueba realistas usando Faker.js. Los IDs serán correlativos 
          <code>001</code>, <code>002</code>, etc. para recursos agendables, staff y citas.
        </p>

        <div className="seed-config">
          <h2>Configuración</h2>
          <div className="config-grid">
            <div className="config-item">
              <label htmlFor="numBoxes">Recursos agendables:</label>
              <input
                id="numBoxes"
                type="number"
                min="1"
                max="50"
                value={config.numBoxes}
                onChange={(e) => setConfig({ ...config, numBoxes: parseInt(e.target.value) || 1 })}
                disabled={loading}
              />
            </div>
            <div className="config-item">
              <label htmlFor="numStaff">Staff:</label>
              <input
                id="numStaff"
                type="number"
                min="1"
                max="50"
                value={config.numStaff}
                onChange={(e) => setConfig({ ...config, numStaff: parseInt(e.target.value) || 1 })}
                disabled={loading}
              />
            </div>
            <div className="config-item">
              <label htmlFor="numAppointments">Citas:</label>
              <input
                id="numAppointments"
                type="number"
                min="1"
                max="100"
                value={config.numAppointments}
                onChange={(e) => setConfig({ ...config, numAppointments: parseInt(e.target.value) || 1 })}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="seed-actions">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="btn-seed"
          >
            {loading ? '⏳ Procesando...' : '🌱 Poblar BD (API)'}
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="btn-clear"
          >
            {loading ? '⏳ Procesando...' : '🗑️ Limpiar BD'}
          </button>
        </div>

        {progress && (
          <div className="seed-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: progress.total ? `${(progress.current / progress.total) * 100}%` : '100%'
                }}
              />
            </div>
            <p className="progress-text">{getProgressMessage()}</p>
          </div>
        )}

        {error && (
          <div className="seed-error">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div className="seed-results">
            <h3>✅ Completado</h3>
            {results.boxes && (
              <div className="result-section">
                <h4>📦 Recursos agendables</h4>
                <p>
                  ✓ Creados: {results.boxes.success || results.boxes.deleted || 0}
                  {(results.boxes.failed > 0) && <span> | ✗ Fallidos: {results.boxes.failed}</span>}
                </p>
              </div>
            )}
            {(results.staff || results.doctors) && (
              <div className="result-section">
                <h4>👥 Staff</h4>
                <p>
                  ✓ Creados: {(results.staff?.success || results.staff?.deleted || results.doctors?.success || results.doctors?.deleted || 0)}
                  {((results.staff?.failed || results.doctors?.failed || 0) > 0) && <span> | ✗ Fallidos: {results.staff?.failed || results.doctors?.failed}</span>}
                </p>
              </div>
            )}
            {results.appointments && (
              <div className="result-section">
                <h4>📅 Citas</h4>
                <p>
                  ✓ Creadas: {results.appointments.success || results.appointments.deleted || 0}
                  {(results.appointments.failed > 0) && <span> | ✗ Fallidos: {results.appointments.failed}</span>}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="seed-info">
          <h3>ℹ️ Información</h3>
          <ul>
            <li><strong>Poblar BD (API):</strong> Crea registros uno por uno usando los endpoints normales. Más lento pero con progreso detallado.</li>
            <li><strong>Recursos agendables:</strong> Se crean con IDs correlativos (001, 002, ...)</li>
            <li><strong>Staff:</strong> Nombres realistas en español con roles o cargos</li>
            <li><strong>Citas:</strong> Fechas entre -7 días y +14 días, horarios 8:00-18:00</li>
            <li><strong>Limpiar BD:</strong> Borra todos los registros (citas → staff → recursos agendables)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
