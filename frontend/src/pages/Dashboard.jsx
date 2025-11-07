import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '../api/analytics';
import MetricCard from '../components/dashboard/MetricCard';
import ChartCard from '../components/dashboard/ChartCard';
import './Dashboard.css';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', dateRange],
    queryFn: () => getDashboardMetrics({
      startDate: new Date(dateRange.startDate).toISOString(),
      endDate: new Date(dateRange.endDate + 'T23:59:59').toISOString(),
    }),
    refetchInterval: 60000, // Refetch cada minuto
  });

  const handleDateChange = (e) => {
    setDateRange(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleApplyFilters = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">
          <div className="spinner"></div>
          <p>Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">
          <p>⚠️ Error al cargar métricas: {error.message}</p>
          <button onClick={() => refetch()} className="btn btn--primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Preparar datos para gráfico de estados de citas
  const appointmentStatusData = Object.entries(metrics?.appointments?.byStatus || {}).map(
    ([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
    })
  );

  // Preparar datos para gráfico de especialidades
  const specialtyData = Object.entries(metrics?.doctors?.bySpecialty || {}).map(
    ([specialty, count]) => ({
      name: specialty,
      value: count,
    })
  );

  return (
    <div className="dashboard">
      {/* Header con filtros */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">📊 Dashboard de KPIs</h1>
          <p className="dashboard__subtitle">
            Período: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
          </p>
        </div>

        <div className="dashboard__filters">
          <div className="dashboard__filter-group">
            <label htmlFor="startDate">Desde</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="dashboard__date-input"
            />
          </div>

          <div className="dashboard__filter-group">
            <label htmlFor="endDate">Hasta</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="dashboard__date-input"
            />
          </div>

          <button 
            onClick={handleApplyFilters}
            className="btn btn--primary"
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="dashboard__metrics-grid">
        <MetricCard
          title="Total Citas"
          value={metrics?.summary?.totalAppointments || 0}
          subtitle={`${metrics?.appointments?.completed || 0} completadas`}
          icon="📅"
          color="primary"
        />

        <MetricCard
          title="Boxes Activos"
          value={metrics?.summary?.activeBoxes || 0}
          subtitle={`${metrics?.boxes?.occupancyRate || 0}% ocupación`}
          icon="🏥"
          color="success"
        />

        <MetricCard
          title="Médicos Activos"
          value={metrics?.summary?.activeDoctors || 0}
          subtitle={`${Object.keys(metrics?.doctors?.bySpecialty || {}).length} especialidades`}
          icon="👨‍⚕️"
          color="info"
        />

        <MetricCard
          title="Tasa No-Show"
          value={`${metrics?.appointments?.noShowRate || 0}%`}
          subtitle={`${metrics?.appointments?.byStatus?.['no-show'] || 0} ausencias`}
          icon="⚠️"
          color="warning"
        />
      </div>

      {/* Métricas secundarias */}
      <div className="dashboard__secondary-metrics">
        <MetricCard
          title="Pacientes Registrados"
          value={metrics?.summary?.totalPatients || 0}
          subtitle={`${metrics?.patients?.active || 0} activos`}
          icon="👥"
          color="info"
        />

        <MetricCard
          title="Citas Programadas"
          value={metrics?.appointments?.scheduled || 0}
          subtitle="Pendientes de atención"
          icon="🕐"
          color="primary"
        />

        <MetricCard
          title="Citas Completadas"
          value={metrics?.appointments?.completed || 0}
          subtitle="En este período"
          icon="✅"
          color="success"
        />

        <MetricCard
          title="Boxes Disponibles"
          value={metrics?.boxes?.available || 0}
          subtitle={`${metrics?.boxes?.occupied || 0} ocupados`}
          icon="🟢"
          color="success"
        />
      </div>

      {/* Gráficos */}
      <div className="dashboard__charts">
        <ChartCard
          title="Citas por Día"
          type="bar"
          data={metrics?.appointments?.dailyData || []}
          xKey="date"
          dataKey="count"
          height={300}
        />

        <ChartCard
          title="Distribución de Estados"
          type="pie"
          data={appointmentStatusData}
          xKey="name"
          dataKey="value"
          height={300}
        />

        <ChartCard
          title="Médicos por Especialidad"
          type="pie"
          data={specialtyData}
          xKey="name"
          dataKey="value"
          height={300}
        />
      </div>

      {/* Última actualización */}
      <div className="dashboard__footer">
        <p className="dashboard__timestamp">
          Última actualización: {new Date(metrics?.timestamp).toLocaleString()}
        </p>
        <button onClick={() => refetch()} className="btn btn--secondary">
          🔄 Actualizar
        </button>
      </div>
    </div>
  );
};

// Labels de estados en español
const statusLabels = {
  'scheduled': 'Programadas',
  'confirmed': 'Confirmadas',
  'in-progress': 'En Curso',
  'completed': 'Completadas',
  'cancelled': 'Canceladas',
  'no-show': 'No Asistió',
};

export default Dashboard;
