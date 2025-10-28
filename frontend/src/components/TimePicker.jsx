import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './TimePicker.css';

/**
 * TimePicker mejorado con selector de hora y minutos en incrementos de 5
 * @param {Object} props
 * @param {string} props.value - Valor actual en formato HH:mm
 * @param {function} props.onChange - Callback cuando cambia el valor
 * @param {string} props.label - Etiqueta del campo
 * @param {boolean} props.required - Si el campo es requerido
 * @param {boolean} props.disabled - Si el campo está deshabilitado
 */
export default function TimePicker({ value, onChange, label, required, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const pickerRef = useRef(null);

  // Parsear valor inicial
  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour || '09');
      setSelectedMinute(minute || '00');
    }
  }, [value]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Generar horas (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  // Generar minutos en incrementos de 5 (00, 05, 10, ..., 55)
  const minutes = Array.from({ length: 12 }, (_, i) => 
    (i * 5).toString().padStart(2, '0')
  );

  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    const newValue = `${hour}:${selectedMinute}`;
    onChange?.(newValue);
  };

  const handleMinuteSelect = (minute) => {
    setSelectedMinute(minute);
    const newValue = `${selectedHour}:${minute}`;
    onChange?.(newValue);
  };

  const displayValue = value || `${selectedHour}:${selectedMinute}`;

  return (
    <div className="time-picker" ref={pickerRef}>
      {label && (
        <label className="time-picker-label">
          {label}
          {required && <span className="required"> *</span>}
        </label>
      )}
      
      <button
        type="button"
        className={`time-picker-input ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="time-icon">🕐</span>
        <span className="time-value">{displayValue}</span>
        <span className="dropdown-icon">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && !disabled && (
        <div className="time-picker-dropdown">
          <div className="time-picker-section">
            <div className="section-title">Hora</div>
            <div className="time-grid hours">
              {hours.map(hour => (
                <button
                  key={hour}
                  type="button"
                  className={`time-option ${selectedHour === hour ? 'selected' : ''}`}
                  onClick={() => handleHourSelect(hour)}
                >
                  {hour}
                </button>
              ))}
            </div>
          </div>

          <div className="time-picker-divider"></div>

          <div className="time-picker-section">
            <div className="section-title">Minutos</div>
            <div className="time-grid minutes">
              {minutes.map(minute => (
                <button
                  key={minute}
                  type="button"
                  className={`time-option ${selectedMinute === minute ? 'selected' : ''}`}
                  onClick={() => handleMinuteSelect(minute)}
                >
                  {minute}
                </button>
              ))}
            </div>
          </div>

          <div className="time-picker-footer">
            <button
              type="button"
              className="btn-now"
              onClick={() => {
                const now = new Date();
                const hour = now.getHours().toString().padStart(2, '0');
                // Redondear minutos al múltiplo de 5 más cercano
                const roundedMinutes = Math.round(now.getMinutes() / 5) * 5;
                const minute = roundedMinutes.toString().padStart(2, '0');
                handleHourSelect(hour);
                handleMinuteSelect(minute);
                setIsOpen(false);
              }}
            >
              🕐 Ahora
            </button>
            <button
              type="button"
              className="btn-close"
              onClick={() => setIsOpen(false)}
            >
              ✓ Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

TimePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  label: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
};

TimePicker.defaultProps = {
  value: '',
  onChange: () => {},
  label: '',
  required: false,
  disabled: false,
};
