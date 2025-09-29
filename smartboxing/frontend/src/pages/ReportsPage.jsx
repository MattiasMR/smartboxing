// src/pages/ReportsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../components/layout/PageHeader';
import {
    fetchDoctorRanking,
    fetchSpecialtyDistribution,
    fetchConsultationsByTimeslot,
    fetchBoxRanking,
} from '../api/services';
import BarChart from '../components/charts/BarChart';
import './ReportsPage.css';

const ReportCard = ({ title, children, className = '', headerContent = null }) => (
    <div className={`report-card ${className}`}>
        <div className="report-card-header">
            <h3>{title}</h3>
            {headerContent}
        </div>
        <div className="report-card-content">{children}</div>
    </div>
);

function ReportsPage() {
    // Estados para cada pieza de datos
    const [rankingData, setRankingData] = useState([]);
    const [allSpecialtiesDistribution, setAllSpecialtiesDistribution] = useState([]);
    const [timeslotData, setTimeslotData] = useState(null);
    const [boxRanking, setBoxRanking] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const fetchData = useCallback(() => {
        setIsLoading(true);
        // Usamos Promise.all para que todas las llamadas se hagan en paralelo
        Promise.all([
            fetchDoctorRanking(filters),
            fetchSpecialtyDistribution(filters),
            fetchConsultationsByTimeslot(filters),
            fetchBoxRanking(filters)
        ]).then(([
            rankingRes,
            specialtyRes,
            timeslotRes,
            boxRankingRes
        ]) => {
            // Actualizamos todos los estados con los nuevos datos
            setRankingData(rankingRes.data);
            setBoxRanking(boxRankingRes.data);

            // Procesar datos para la lista de todas las especialidades
            const allSpecialtyApiData = specialtyRes.data;
            setAllSpecialtiesDistribution(allSpecialtyApiData);

            // Procesar datos para gráfico de franja horaria
            const timeslotApiData = timeslotRes.data;
            const labels = Array.from({ length: 10 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);
            const dataPoints = Array(10).fill(0);
            timeslotApiData.forEach(item => {
                const index = item.hour - 8;
                if (index >= 0 && index < dataPoints.length) {
                    dataPoints[index] = item.count;
                }
            });
            // Get the actual secondary color value from CSS variable
            const secondaryColor = getComputedStyle(document.documentElement)
              .getPropertyValue('--secondary-color').trim() || '#df0b6f';
              
            setTimeslotData({
                labels,
                datasets: [{ label: 'Nº de Consultas', data: dataPoints, backgroundColor: secondaryColor }]
            });

        }).catch(error => {
            console.error("Failed to fetch report data:", error);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const chartOptions = { responsive: true, maintainAspectRatio: false };

    return (
        <div className="reports-page-container">
            <PageHeader title="Reportes y Estadísticas" />
            {isLoading ? <p style={{ textAlign: 'center' }}>Cargando reportes...</p> : (
                <div className="reports-grid-layout">
                    <div className="chart-section">
                        <ReportCard 
                            title="Consultas por Franja Horaria" 
                            className="chart-card-with-filters"
                            headerContent={
                                <div className="chart-filters-container">
                                    <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
                                    <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
                                </div>
                            }
                        >
                            <div className="chart-container-large">
                                {timeslotData ? <BarChart chartData={timeslotData} chartOptions={chartOptions} /> : <p>Cargando...</p>}
                            </div>
                        </ReportCard>
                    </div>
                    <div className="rankings-section">
                        <ReportCard title="Ranking de Médicos" className="scrollable-list-card top-ranking-card">
                            {rankingData.length > 0 ? (
                                <ol className="ranking-list">
                                    {rankingData.slice(0, 3).map((doctor, index) => {
                                        const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze';
                                        return (
                                            <li key={index} className="ranking-item">
                                                <div className={`ranking-medal ${medalClass}`}>{index + 1}</div>
                                                <span className="ranking-name">{doctor.full_name}</span>
                                                <span className="ranking-value">{doctor.consultation_count} consultas</span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (<p>No hay datos.</p>)}
                        </ReportCard>
                        <ReportCard title="Ranking de Boxes" className="scrollable-list-card top-ranking-card">
                            {boxRanking.length > 0 ? (
                                <ol className="ranking-list">
                                    {boxRanking.slice(0, 3).map((box, index) => {
                                        const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze';
                                        return (
                                            <li key={index} className="ranking-item">
                                                <div className={`ranking-medal ${medalClass}`}>{index + 1}</div>
                                                <span className="ranking-name">Box {box.box_number}</span>
                                                <span className="ranking-value">{box.total_hours} horas</span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (<p>No hay datos.</p>)}
                        </ReportCard>
                    </div>
                    <div className="specialties-section">
                        <ReportCard title="TOP 3 Especialidades" className="scrollable-list-card specialties-full-width">
                            {allSpecialtiesDistribution.length > 0 ? (
                                <ol className="ranking-list ranking-list-horizontal">
                                    {allSpecialtiesDistribution.slice(0, 3).map((spec, index) => {
                                        const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze';
                                        return (
                                            <li key={index}>
                                                <div className={`ranking-medal ${medalClass}`}>{index + 1}</div>
                                                <span className="rank-name">{spec.name}</span>
                                                <span className="rank-value">{spec.consultation_count} consultas</span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (<p>No hay datos de especialidades.</p>)}
                        </ReportCard>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportsPage;