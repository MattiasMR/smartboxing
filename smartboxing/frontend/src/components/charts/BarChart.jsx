// src/components/charts/BarChart.jsx
import { Bar } from 'react-chartjs-2';

function BarChart({ chartData, chartOptions }) {
  return <Bar options={chartOptions} data={chartData} />;
}

export default BarChart;