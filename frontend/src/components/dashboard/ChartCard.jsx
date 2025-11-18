import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './ChartCard.css';

const THEME_COLORS = [
  'var(--primary)',
  'var(--primary-light)',
  'var(--secondary)',
  'var(--accent)',
  'var(--info)'
];

const TooltipCard = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <ul className="chart-tooltip__list">
        {payload.map((entry) => (
          <li key={entry.name} style={{ color: entry.color }}>
            <span>{entry.name}</span>
            <strong>{entry.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Tarjeta con gráfico
 */
const ChartCard = ({ title, type = 'bar', data, dataKey, xKey, colors, height = 300 }) => {
  const palette = (colors && colors.length > 0) ? colors : THEME_COLORS;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey={xKey} 
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <Tooltip content={<TooltipCard />} cursor={{ fill: 'rgba(0, 0, 0, 0.08)' }} />
              <Legend />
              <Bar 
                dataKey={dataKey} 
                fill={palette[0]}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry[xKey]}: ${entry[dataKey]}`}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={palette[index % palette.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<TooltipCard />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Tipo de gráfico no soportado</div>;
    }
  };

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">{title}</h3>
      <div className="chart-card__body">
        {data && data.length > 0 ? (
          renderChart()
        ) : (
          <div className="chart-card__empty">
            No hay datos disponibles para este período
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartCard;
