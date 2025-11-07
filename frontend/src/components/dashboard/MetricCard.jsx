import './MetricCard.css';

/**
 * Tarjeta de métrica individual
 */
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary',
  trend 
}) => {
  return (
    <div className={`metric-card metric-card--${color}`}>
      <div className="metric-card__header">
        <div className="metric-card__icon">{icon}</div>
        <h3 className="metric-card__title">{title}</h3>
      </div>
      
      <div className="metric-card__body">
        <div className="metric-card__value">{value}</div>
        {subtitle && (
          <div className="metric-card__subtitle">{subtitle}</div>
        )}
        {trend && (
          <div className={`metric-card__trend metric-card__trend--${trend.direction}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
