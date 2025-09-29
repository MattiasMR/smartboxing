import React, { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import ReactMarkdown from 'react-markdown'; // Se mantiene el import
import './AnalystPage.css';
import { fetchAutomatedReportSummary } from '../api/services';

function AnalystPage() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [dataPoints, setDataPoints] = useState(null);
  const [period, setPeriod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Por favor, selecciona un rango de fechas válido.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSummary('');
    setDataPoints(null);
    setPeriod('');
    
    try {
      const response = await fetchAutomatedReportSummary({
        start_date: startDate,
        end_date: endDate
      });
      
      setSummary(response.data.summary);
      setDataPoints(response.data.data_points);
      setPeriod(response.data.period);
    } catch (err) {
      console.error("Error fetching automated report summary:", err);
      const errorMessage = err.response?.data?.error || 'Hubo un error al generar el resumen. Inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="analyst-page-container">
      <PageHeader title="Resúmenes Automatizados de Reportes" />
      <div className="analyst-content">
        <p className="analyst-description">
          Genera un resumen automatizado e inteligente de los datos y KPIs del hospital para el período seleccionado.
          El sistema analiza rankings de médicos, rendimiento de boxes, distribución de especialidades y más.
        </p>
        
        <form onSubmit={handleSubmit} className="analyst-form">
          <div className="date-range-container">
            <div className="date-input-group">
              <label htmlFor="start-date">Fecha de inicio:</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="date-input-group">
              <label htmlFor="end-date">Fecha de fin:</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <button type="submit" className="analyst-submit-btn" disabled={isLoading}>
            {isLoading ? 'Generando Resumen...' : 'Generar Resumen Automatizado'}
          </button>
        </form>

        {error && <p className="analyst-error">{error}</p>}
        
        {isLoading && (
          <div className="analyst-loading">
            <p>Analizando datos y generando resumen ejecutivo...</p>
            <div className="loading-spinner"></div>
          </div>
        )}

        {!isLoading && dataPoints && (
          <div className="data-points-summary">
            <h5>Datos Clave del Período:</h5>
            <div className="data-points-grid">
              <div className="data-point">
                <span className="data-label">Total de Consultas:</span>
                <span className="data-value">{dataPoints.total_consultations}</span>
              </div>
              
              {dataPoints.top_doctor && (
                <div className="data-point">
                  <span className="data-label">Médico Líder:</span>
                  <span className="data-value">
                    {dataPoints.top_doctor.full_name} ({dataPoints.top_doctor.consultation_count} consultas)
                  </span>
                </div>
              )}
              
              {dataPoints.top_box && (
                <div className="data-point">
                  <span className="data-label">Box Más Utilizado:</span>
                  <span className="data-value">
                    Box {dataPoints.top_box.box_number} ({dataPoints.top_box.total_hours} horas)
                  </span>
                </div>
              )}
              
              {dataPoints.most_demanded_specialty && (
                <div className="data-point data-point--full-width">
                  <span className="data-label">Especialidad Más Demandada:</span>
                  <span className="data-value">
                    {dataPoints.most_demanded_specialty.name} ({dataPoints.most_demanded_specialty.consultation_count} consultas)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && summary && (
          <div className="analyst-answer-section">
            <h4>Resumen Ejecutivo {period && `(${period})`}:</h4>
            
            {/* ✅ CORRECCIÓN: Se envuelve ReactMarkdown en un div con la clase. */}
            <div className="analyst-answer">
              <ReactMarkdown>
                {summary}
              </ReactMarkdown>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default AnalystPage;