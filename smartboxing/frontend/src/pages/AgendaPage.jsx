// src/pages/AgendaPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
// import PageHeader from '../components/layout/PageHeader'; // Removed PageHeader
import { fetchAssignments, fetchBoxes, fetchDoctors } from '../api/services';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import Select from 'react-select';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import add from 'date-fns/add';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './AgendaPage.css'; // Import the new CSS file

const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});


function AgendaPage() {
  const [viewMode, setViewMode] = useState('box');
  const [selectedId, setSelectedId] = useState(null);
  const [events, setEvents] = useState([]);
  const [conflictCount, setConflictCount] = useState(0);
  
  const [boxes, setBoxes] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());


  const [calendarView, setCalendarView] = useState('week');

  // Detect window width for responsive view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCalendarView('day');
      } else {
        setCalendarView('week');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial view

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function detectConflicts(events) {
  const conflictedIds = new Set();

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];

      const sameBox = viewMode === 'box' && a.id !== b.id && a.start < b.end && b.start < a.end;
      const sameDoctor = viewMode === 'doctor' && a.id !== b.id && a.start < b.end && b.start < a.end;

      if (sameBox || sameDoctor) {
        conflictedIds.add(a.id);
        conflictedIds.add(b.id);
      }
    }
  }
  

  return new Set(conflictedIds);
}

  useEffect(() => {
    fetchBoxes().then(res => setBoxes(res.data));
    fetchDoctors().then(res => setDoctors(res.data));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setEvents([]);
      return;
    }
    setIsLoading(true);
    setEvents([]);
    const params = { [viewMode]: selectedId };
    fetchAssignments(params)
      .then(res => {
        const rawEvents = res.data.map(assign => ({
          id: assign.id,
          title: viewMode === 'box' ? assign.doctor.full_name : `Box ${assign.box.number}`,
          start: new Date(assign.start_time),
          end: new Date(assign.end_time),
          isNonMedical: assign.assignment_type === 'NON_MEDICAL',
          specialty: assign.doctor?.specialty?.name || 'N/A',
        }));

        const conflictIds = detectConflicts(rawEvents);
        setConflictCount(conflictIds.size);


        const formattedEvents = rawEvents.map(event => ({
          ...event,
          isConflicting: conflictIds.has(event.id)
        }));

        setEvents(formattedEvents);
      })
      .catch(error => console.error("Error al buscar asignaciones:", error))
      .finally(() => setIsLoading(false));
  }, [viewMode, selectedId]);

  const boxOptions = useMemo(() =>
    boxes.map(box => ({
      value: box.id,
      label: `Box ${box.number}`
    })), [boxes]);

  const doctorOptions = useMemo(() =>
    doctors.map(doc => ({
      value: doc.id,
      label: doc.full_name
    })), [doctors]);

  const options = viewMode === 'box' ? boxOptions : doctorOptions;
  const selectedOption = options.find(option => option.value === selectedId);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedId(null);
  };

  const handleSelectChange = (selectedOption) => {
    setSelectedId(selectedOption ? selectedOption.value : null);
  };

  const handleCalendarNavigate = (actionOrDate) => {
    if (typeof actionOrDate === 'string') { // Our custom PREV, NEXT, TODAY
        let newDate = new Date(calendarDate);
        if (actionOrDate === 'TODAY') {
          newDate = new Date();
        } else if (actionOrDate === 'PREV') {
          if (calendarView === 'day') {
            newDate = add(newDate, { days: -1 });
          } else {
            newDate = add(newDate, { weeks: -1 });
          }
        } else if (actionOrDate === 'NEXT') {
          if (calendarView === 'day') {
            newDate = add(newDate, { days: 1 });
          } else {
            newDate = add(newDate, { weeks: 1 });
          }
        }
        setCalendarDate(newDate);
    } else { // Date object from react-big-calendar onNavigate
        setCalendarDate(actionOrDate);
    }
  };

  const calendarHeaderLabel = useMemo(() => {
    if (calendarView === 'day') {
      // For day view, show just the selected day
      return format(calendarDate, "eeee, dd 'de' MMMM yyyy", { locale: es });
    }
    // For week view, show the week range
    const weekStart = startOfWeek(calendarDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(calendarDate, { weekStartsOn: 1 });
    const startMonth = format(weekStart, 'MMMM', { locale: es });
    const endMonth = format(weekEnd, 'MMMM', { locale: es });
    if (startMonth === endMonth) {
      return `${format(weekStart, 'dd')} - ${format(weekEnd, 'dd')} de ${startMonth}, ${format(weekEnd, 'yyyy')}`;
    }
    return `${format(weekStart, 'dd \'de\' MMMM')} - ${format(weekEnd, 'dd \'de\' MMMM yyyy')}`;
  }, [calendarDate, calendarView]);

  const CustomEventComponent = ({ event }) => (
    <div className="rbc-event-custom">
      <span className="event-title">{event.title}</span>
      {event.specialty && event.specialty !== 'N/A' && (
        <span className="event-specialty"><em>{event.specialty}</em></span>
      )}
    </div>
  );

  const renderControls = (isSidebar = false) => (
    <>
      <div className={isSidebar ? "control-group view-mode-buttons" : ""}>
        {isSidebar && <h4>Modo de Vista</h4>}
        <button onClick={() => handleViewModeChange('box')} style={{ fontWeight: viewMode === 'box' ? 'bold' : 'normal' }}>Ver por Box</button>
        <button onClick={() => handleViewModeChange('doctor')} style={{ marginLeft: isSidebar ? 0 : '10px', fontWeight: viewMode === 'doctor' ? 'bold' : 'normal' }}>Ver por Médico</button>
      </div>

      <div className={isSidebar ? "control-group" : "select-container"}>
        {isSidebar && <h4>Seleccionar {viewMode === 'box' ? 'Box' : 'Médico'}</h4>}
        <Select
          options={options}
          value={selectedOption}
          onChange={handleSelectChange}
          placeholder={`Buscar ${viewMode === 'box' ? 'Box' : 'Médico'}...`}
          isClearable
          isLoading={isLoading}
          classNamePrefix="react-select" // For easier global styling if needed
          menuPortalTarget={document.body}
          menuPosition="absolute"
          menuPlacement="auto"
        />
      </div>
      {isLoading && !isSidebar && <p>Cargando...</p>}

      <div className={isSidebar ? "control-group calendar-navigation-buttons" : "calendar-navigation"}>
        {isSidebar && <h4>Navegación</h4>}
        <button onClick={() => handleCalendarNavigate('PREV')}>
          {calendarView === 'day' ? '< Día Anterior' : '< Semana Anterior'}
        </button>
        <button onClick={() => handleCalendarNavigate('TODAY')}>
          {calendarView === 'day' ? 'Hoy' : 'Semana Actual'}
        </button>
        <button onClick={() => handleCalendarNavigate('NEXT')}>
          {calendarView === 'day' ? 'Día Siguiente >' : 'Semana Siguiente >'}
        </button>
        {isSidebar ? 
            <p className="calendar-header-label-sidebar">{calendarHeaderLabel}</p> :
            <strong className={calendarView === 'day' ? 'day-view' : ''}>{calendarHeaderLabel}</strong>
        }
      </div>

      <div className={isSidebar ? "control-group color-legend-sidebar" : "color-legend"}>
        {isSidebar && <h4>Leyenda</h4>}
        <div className={isSidebar ? "legend-item" : ""}>
          <span className="legend-color-box" style={{ backgroundColor: '#00796b' }}></span>
          <span className="legend-text">Horas Médicas</span>
        </div>
        <div className={isSidebar ? "legend-item" : ""}>
          <span className="legend-color-box" style={{ backgroundColor: '#868e96' }}></span>
          <span className="legend-text">Horas No Médicas</span>
        </div>
      </div>

      {conflictCount > 0 && (
        <div style={{
          marginTop: '10px',
          backgroundColor: '#fdecea',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '10px',
          borderRadius: '6px',
          fontSize: '0.95em'
        }}>
          ⚠️ Conflictos de horario: <strong>{conflictCount}</strong>
        </div>
      )}
    </>
  );

  return (
    <div className="agenda-page-container">
      {/* Controls for smaller screens - rendered above calendar */}
      <div className="agenda-controls-top">
        {renderControls(false)}
      </div>

      <div className="agenda-main-content">
        <div className="agenda-calendar-area">
          <Calendar
            localizer={localizer}
            events={events}
            date={calendarDate}
            onNavigate={handleCalendarNavigate}
            view={calendarView} // Control the view dynamically
            onView={() => {}} // Prevent user from changing view directly
            defaultView="week"
            views={['week', 'day']}
            step={30}
            timeslots={2}
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 19, 0, 0)}
            culture='es'
            messages={{ next: "Sig.", previous: "Ant.", today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
            components={{
              toolbar: () => null,
              event: CustomEventComponent,
            }}
            eventPropGetter={event => {
              let backgroundColor = event.isNonMedical ? '#868e96' : '#00796b';

              if (event.isConflicting) {
                backgroundColor = '#d32f2f';
              }

              return {
                style: {
                  backgroundColor,
                  borderColor: backgroundColor,
                  color: 'white',
                }
              };
            }}
          />
        </div>
        {/* Sidebar controls for wider screens */}
        <div className="agenda-controls-sidebar">
          {renderControls(true)}
        </div>
      </div>
    </div>
  );
}

export default AgendaPage;