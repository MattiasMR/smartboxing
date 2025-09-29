// src/components/charts/PieChart.jsx
import { Pie } from 'react-chartjs-2';

function PieChart({ chartData, chartOptions }) {
  const defaultOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right', // Posiciona la leyenda a la derecha como en tu mockup
      },
    },
  };
  return <Pie data={chartData} options={chartOptions || defaultOptions} />;
}

export default PieChart;