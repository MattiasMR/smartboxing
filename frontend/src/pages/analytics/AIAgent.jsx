/**
 * AI Agent Page - Generates intelligent reports for tenant admins
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateAIReport } from '../../api/analytics.js';
import { useAuthContext } from '../../auth/AuthContext.js';
import ReactMarkdown from 'react-markdown';
import './AIAgent.css';

export default function AIAgent() {
  const { tenantName, tenantId } = useAuthContext();
  const [report, setReport] = useState(null);
  
  const generateMutation = useMutation({
    mutationFn: generateAIReport,
    onSuccess: (data) => {
      setReport(data);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleDownload = () => {
    if (!report) return;
    
    const content = `# Reporte Ejecutivo - ${report.tenant?.name || tenantName}
Generado: ${new Date(report.generatedAt).toLocaleString('es-CL')}
Período: ${report.period?.startDate?.split('T')[0]} a ${report.period?.endDate?.split('T')[0]}

---

${report.summary}

---

## Datos del Período

| Métrica | Valor |
|---------|-------|
| Total Citas | ${report.dataPoints?.totalAppointments || 0} |
| Citas Completadas | ${report.dataPoints?.completedAppointments || 0} |
| Tasa No-Show | ${report.dataPoints?.noShowRate || 0}% |
| Total Boxes | ${report.dataPoints?.totalBoxes || 0} |
| Boxes Activos | ${report.dataPoints?.activeBoxes || 0} |
| Tasa Ocupación | ${report.dataPoints?.occupancyRate || 0}% |
| Total Staff | ${report.dataPoints?.totalStaff || 0} |
| Staff Activo | ${report.dataPoints?.activeStaff || 0} |
| Total Pacientes | ${report.dataPoints?.totalPatients || 0} |

---
*Generado por SmartBoxing AI Agent*
`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${tenantName || 'ejecutivo'}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!report?.summary) return;
    
    try {
      await navigator.clipboard.writeText(report.summary);
      alert('¡Reporte copiado al portapapeles!');
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  if (!tenantId) {
    return (
      <div className="ai-agent-page">
        <div className="ai-agent-no-tenant">
          <span className="ai-icon">🤖</span>
          <h2>Agente IA no disponible</h2>
          <p>Debes tener una tenencia activa para usar el Agente IA.</p>
          <p>Ve a "Mis Tenencias" y selecciona una organización.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-agent-page">
      <header className="ai-agent-header">
        <div className="ai-agent-title-section">
          <span className="ai-icon-large">🤖</span>
          <div>
            <h1 className="ai-agent-title">Agente IA</h1>
            <p className="ai-agent-subtitle">
              Genera un resumen ejecutivo inteligente de <strong>{tenantName}</strong>
            </p>
          </div>
        </div>
      </header>

      <div className="ai-agent-content">
        {!report && (
          <div className="ai-agent-intro">
            <div className="ai-feature-card">
              <span className="feature-icon">📊</span>
              <h3>Análisis Completo</h3>
              <p>Analiza citas, boxes, staff y pacientes de los últimos 30 días</p>
            </div>
            <div className="ai-feature-card">
              <span className="feature-icon">🧠</span>
              <h3>IA Inteligente</h3>
              <p>Usa GPT para generar insights y recomendaciones personalizadas</p>
            </div>
            <div className="ai-feature-card">
              <span className="feature-icon">📝</span>
              <h3>Formato Ejecutivo</h3>
              <p>Resumen profesional listo para presentar a la dirección</p>
            </div>
          </div>
        )}

        <div className="ai-agent-actions">
          <button
            className="ai-generate-btn"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <span className="btn-spinner"></span>
                Generando reporte...
              </>
            ) : report ? (
              <>🔄 Regenerar Reporte</>
            ) : (
              <>✨ Generar Reporte con IA</>
            )}
          </button>
        </div>

        {generateMutation.isError && (
          <div className="ai-error">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error al generar el reporte</strong>
              <p>{generateMutation.error?.message || 'Inténtalo de nuevo más tarde'}</p>
            </div>
          </div>
        )}

        {report && (
          <div className="ai-report-container">
            <div className="ai-report-header">
              <div className="ai-report-meta">
                <span className="meta-item">
                  📅 Período: {report.period?.startDate?.split('T')[0]} - {report.period?.endDate?.split('T')[0]}
                </span>
                <span className="meta-item">
                  🕐 Generado: {new Date(report.generatedAt).toLocaleString('es-CL')}
                </span>
              </div>
              <div className="ai-report-actions">
                <button className="action-btn" onClick={handleCopy} title="Copiar al portapapeles">
                  📋 Copiar
                </button>
                <button className="action-btn action-btn-primary" onClick={handleDownload} title="Descargar como Markdown">
                  ⬇️ Descargar
                </button>
              </div>
            </div>

            <div className="ai-report-summary">
              <ReactMarkdown>{report.summary}</ReactMarkdown>
            </div>

            <div className="ai-report-metrics">
              <h3>📈 Métricas del Período</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-value">{report.dataPoints?.totalAppointments || 0}</span>
                  <span className="metric-label">Citas Totales</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{report.dataPoints?.completedAppointments || 0}</span>
                  <span className="metric-label">Completadas</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{report.dataPoints?.noShowRate || 0}%</span>
                  <span className="metric-label">Tasa No-Show</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{report.dataPoints?.totalBoxes || 0}</span>
                  <span className="metric-label">Boxes</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{report.dataPoints?.occupancyRate || 0}%</span>
                  <span className="metric-label">Ocupación</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{report.dataPoints?.activeStaff || 0}</span>
                  <span className="metric-label">Staff Activo</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
