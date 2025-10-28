import { useState } from 'react';
import { seedDatabase, clearDatabaseBulk } from '../api/seed';
import { api } from '../api/client';
import './SeedPage.css';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({
    numBoxes: 10,
    numDoctors: 8,
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

  const handleBulkSeed = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setProgress({ step: 'starting', message: 'Llamando endpoint bulk...' });

    try {
      const response = await api.post('/seed/bulk', config);
      setResults({
        boxes: { success: response.data.results.boxes.success, failed: response.data.results.boxes.failed },
        doctors: { success: response.data.results.doctors.success, failed: response.data.results.doctors.failed },
        appointments: { success: response.data.results.appointments.success, failed: response.data.results.appointments.failed }
      });
      setProgress(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
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
      const result = await clearDatabaseBulk();
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
      boxes: '📦 Boxes',
      doctors: '👨‍⚕️ Doctores',
      appointments: '📅 Citas'
    };
    
    return `${stepNames[step] || step}: ${current}/${total}`;
  };

  return (
    <div className="seed-page">
      <div className="seed-container">
        <h1>🌱 Poblar Base de Datos</h1>
        <p className="seed-description">
          Crea datos de prueba realistas usando Faker.js. Todos los IDs serán del formato 
          <code>BOX-A1</code>, <code>DOCTOR-001</code>, <code>APPT-001</code>.
        </p>

        <div className="seed-config">
          <h2>Configuración</h2>
          <div className="config-grid">
            <div className="config-item">
              <label htmlFor="numBoxes">Boxes:</label>
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
              <label htmlFor="numDoctors">Doctores:</label>
              <input
                id="numDoctors"
                type="number"
                min="1"
                max="50"
                value={config.numDoctors}
                onChange={(e) => setConfig({ ...config, numDoctors: parseInt(e.target.value) || 1 })}
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
            onClick={handleBulkSeed}
            disabled={loading}
            className="btn-seed-bulk"
          >
            {loading ? '⏳ Procesando...' : '⚡ Poblar BD (Bulk)'}
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
                <h4>📦 Boxes</h4>
                <p>
                  ✓ Creados: {results.boxes.success || results.boxes.deleted || 0}
                  {(results.boxes.failed > 0) && <span> | ✗ Fallidos: {results.boxes.failed}</span>}
                </p>
              </div>
            )}
            {results.doctors && (
              <div className="result-section">
                <h4>👨‍⚕️ Doctores</h4>
                <p>
                  ✓ Creados: {results.doctors.success || results.doctors.deleted || 0}
                  {(results.doctors.failed > 0) && <span> | ✗ Fallidos: {results.doctors.failed}</span>}
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
            <li><strong>Poblar BD (Bulk):</strong> Usa BatchWrite de DynamoDB. Hasta 10x más rápido, pero sin progreso intermedio.</li>
            <li><strong>Boxes:</strong> Se crean con IDs aleatorios (BOX-A1, BOX-B3, etc.)</li>
            <li><strong>Doctores:</strong> Nombres realistas en español con especialidades médicas</li>
            <li><strong>Citas:</strong> Fechas entre -7 días y +14 días, horarios 8:00-18:00</li>
            <li><strong>Limpiar BD:</strong> Borra todos los registros (citas → doctores → boxes)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
