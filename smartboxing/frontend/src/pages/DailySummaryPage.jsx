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

        // Try to fetch boxes for occupancy calculation
        try {
          const boxesResponse = await fetchBoxes();
          const boxes = boxesResponse.data?.boxes || boxesResponse.data || [];
          console.log('📦 DailySummary got boxes:', boxes.length, 'Sample:', boxes[0]);
          
          const activeBoxes = boxes.filter(box => box.operational_status === 'ACTIVE');
          console.log('📊 Active boxes:', activeBoxes.length);
          
          if (activeBoxes.length > 0) {
            // Since real data doesn't have occupancy_percentage, calculate based on assignments
            const todayAssignments = summaryData?.total_assignments || 0;
            const avgOccupancy = Math.min((todayAssignments / activeBoxes.length) * 100, 100);
            setAverageOccupancy(avgOccupancy);
            console.log('📈 Calculated occupancy:', avgOccupancy.toFixed(1) + '%');
          } else {
            setAverageOccupancy(0);
          }
        } catch (boxError) {
          console.error('Boxes API failed:', boxError);
          console.warn('Using calculated occupancy from assignments instead');
          // Calculate occupancy from assignments data
          const todayAssignments = summaryData?.total_assignments || 0;
          const totalBoxes = summaryData?.total_boxes || 1;
          const calculatedOccupancy = Math.min((todayAssignments / totalBoxes) * 100, 100);
          setAverageOccupancy(calculatedOccupancy);
        }

      } catch (error) {
        console.warn("API unavailable, using mock data for dashboard");
        
        // Set mock data as fallback
        const mockSummary = {
          total_appointments: 24,
          completed_appointments: 18,
          pending_appointments: 4,
          cancelled_appointments: 2,
          total_boxes: 12,
          active_boxes: 10,
          total_assignments: 8,
          doctors_on_duty: [
            { id: 1, name: 'Dr. Ana García', specialty: 'Cardiología' },
            { id: 2, name: 'Dr. Carlos Ruiz', specialty: 'Neurología' },
            { id: 3, name: 'Dr. María López', specialty: 'Pediatría' }
          ],
          specialties_distribution: [
            { specialty: 'Cardiología', count: 8 },
            { specialty: 'Neurología', count: 6 },
            { specialty: 'Pediatría', count: 5 },
            { specialty: 'Ginecología', count: 3 },
            { specialty: 'Traumatología', count: 2 }
          ],
          date: new Date().toISOString().split('T')[0]
        };
        
        setSummaryData(mockSummary);
        setAverageOccupancy(72.5);
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
            {summaryData.doctors_on_duty && summaryData.doctors_on_duty.length > 0 ? (
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
            {summaryData.specialties_distribution && summaryData.specialties_distribution.length > 0 ? (
              summaryData.specialties_distribution.map(spec => (
                <div key={spec.specialty} className="specialty-item">
                  <span>{spec.specialty}</span>
                  <strong>{spec.count} consultas</strong>
                </div>
              ))
            ) : (
              <p className="no-data-message">No hay datos de especialidades disponibles.</p>
            )}
           </div>
        </SummaryCard>

      </div>
    </div>
  );
}

export default DailySummaryPage;