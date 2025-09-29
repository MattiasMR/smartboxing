// src/pages/DailySummaryPage.jsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../components/layout/PageHeader';
import { fetchDailySummary, fetchBoxes } from '../api/services';
import { Doughnut } from 'react-chartjs-2';
import MiniDoctorCard from '../components/doctors/MiniDoctorCard';
import './DailySummaryPage.css'; // Import the new CSS file

// A simple card component for this page
const SummaryCard = ({ title, children, className = '' }) => (
  <div className={`summary-card ${className}`}>
    <h3>{title}</h3>
    {children}
  </div>
);

function DailySummaryPage() {
  const [summaryData, setSummaryData] = useState(null);
  const [averageOccupancy, setAverageOccupancy] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summaryResponse = await fetchDailySummary();
        setSummaryData(summaryResponse.data);

        const boxesResponse = await fetchBoxes();
        const boxes = boxesResponse.data;
        
        const enabledBoxes = boxes.filter(box => box.operational_status === 'ENABLED');
        
        if (enabledBoxes.length > 0) {
          const totalOccupancyPercentage = enabledBoxes.reduce((sum, box) => sum + box.occupancy_percentage, 0);
          const avgOccupancy = totalOccupancyPercentage / enabledBoxes.length;
          setAverageOccupancy(avgOccupancy);
        } else {
          setAverageOccupancy(0); // Default to 0 if no enabled boxes
        }

      } catch (error) {
        console.error("Failed to fetch data for summary page:", error);
      }
    };

    fetchData();
  }, []);

  if (!summaryData) {
    return <p>Loading summary...</p>;
  }

  const occupationChartData = {
    labels: ['Ocupación', 'Disponibilidad'],
    datasets: [{
      data: [averageOccupancy, 100 - averageOccupancy], 
      backgroundColor: ['#dc3545', '#e9ecef'], // Cambiado a rojo
      borderWidth: 0,
    }],
  };

  return (
    <div>
      <PageHeader title="Resumen" showControls={false} />
      <div className="summary-grid">
        
        <SummaryCard title="Consultas de hoy">
          <p className="consultas-count">
            {summaryData.consultas_today_count}
          </p>
        </SummaryCard>

        <SummaryCard title="Ocupación Promedio de Boxes">
           <div className="occupation-chart-container">
            <Doughnut data={occupationChartData} options={{ cutout: '60%' }} />
           </div>
        </SummaryCard>

        <SummaryCard title="Doctores de hoy">
          <div className="doctors-list">
            {summaryData.doctors_on_duty.length > 0 ? (
              summaryData.doctors_on_duty.map(doc => (
                <MiniDoctorCard key={doc.id} doctor={doc} />
              ))
            ) : (
              <p className="no-doctors-message">No hay doctores de guardia hoy.</p>
            )}
          </div>
        </SummaryCard>

        <SummaryCard title="Distribución de consultas por especialidad" className="full-width-card">
           <div className="specialty-distribution-list">
            {summaryData.specialties_distribution.map(spec => (
              <div key={spec.name} className="specialty-item">
                <span>{spec.name}</span>
                <strong>{spec.consultation_count} consultas</strong>
              </div>
            ))}
           </div>
        </SummaryCard>

      </div>
    </div>
  );
}

export default DailySummaryPage;