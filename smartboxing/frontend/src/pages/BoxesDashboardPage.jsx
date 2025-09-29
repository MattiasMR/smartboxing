// src/pages/BoxesDashboardPage.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchBoxes } from '../api/services';
import PageHeader from '../components/layout/PageHeader';
import DashboardFilters from '../components/boxes/DashboardFilters';
import BoxGrid from '../components/boxes/BoxGrid';
import '../components/boxes/BoxSearch.css';

function BoxesDashboardPage() {
  const [allBoxes, setAllBoxes] = useState([]);
  const [filteredBoxes, setFilteredBoxes] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ hallway: '', status: '', occupancyRange: '', searchTerm: '' });
  
  // WebSocket management state
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isComponentMounted = useRef(true);
  const hasLoggedMaxAttempts = useRef(false);

  const getBoxes = useCallback(() => {
    fetchBoxes()
      .then(response => {
        setAllBoxes(response.data);
      })
      .catch(err => {
        // Silently handle API errors to avoid console spam
        if (process.env.NODE_ENV === 'development') {
          console.warn("Failed to fetch boxes:", err);
        }
      });
  }, []);

  useEffect(() => {
    getBoxes();
  }, [getBoxes]);

  useEffect(() => {
    let result = [...allBoxes];
    if (filters.hallway) {
      result = result.filter(box => box.hallway === filters.hallway);
    }
    if (filters.status) {
      result = result.filter(box => {
        const displayStatus = box.operational_status === 'ENABLED' ? box.occupancy_status : 'DISABLED';
        return displayStatus === filters.status;
      });
    }
    if (filters.occupancyRange) {
      const [min, max] = filters.occupancyRange.split('-').map(Number);
      result = result.filter(box => {
        const percentage = typeof box.occupancy_percentage === 'number' ? box.occupancy_percentage : 0;
        return percentage >= min && percentage <= max;
      });
    }
    if (filters.searchTerm) {
      result = result.filter(box => 
        box.number.toString().toLowerCase().startsWith(filters.searchTerm.toLowerCase())
      );
    }
    setFilteredBoxes(result);
  }, [filters, allBoxes]);

  const connectWebSocket = useCallback(() => {
    // Don't try to connect if component is unmounted, already connected, or max attempts reached
    if (!isComponentMounted.current || 
        wsRef.current?.readyState === WebSocket.OPEN ||
        reconnectAttempts.current >= maxReconnectAttempts) {
      return;
    }

    try {
      // Only log in development and if we haven't logged max attempts yet
      if (process.env.NODE_ENV === 'development' && !hasLoggedMaxAttempts.current) {
        console.log(`Attempting WebSocket connection (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})...`);
      }
      
      const WS_BASE = window.location.hostname;
      const socket = new WebSocket(`ws://${WS_BASE}:8000/ws/dashboard/`);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isComponentMounted.current) return;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Boxes dashboard WebSocket connected successfully!');
        }
        reconnectAttempts.current = 0;
        hasLoggedMaxAttempts.current = false;
      };

      socket.onmessage = (event) => {
        if (!isComponentMounted.current) return;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('WebSocket update received, refreshing boxes data...');
        }
        getBoxes();
      };

      socket.onclose = (event) => {
        if (!isComponentMounted.current) return;
        
        wsRef.current = null;

        // Only attempt reconnection if it wasn't a clean close (code 1000)
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          
          // Exponential backoff with jitter
          const baseDelay = 2000;
          const jitter = Math.random() * 1000;
          const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current - 1) + jitter, 10000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isComponentMounted.current) {
              connectWebSocket();
            }
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts && !hasLoggedMaxAttempts.current) {
          // Log once that we've stopped trying
          if (process.env.NODE_ENV === 'development') {
            console.warn('WebSocket: Max reconnection attempts reached. Real-time updates disabled.');
          }
          hasLoggedMaxAttempts.current = true;
        }
      };

      socket.onerror = () => {
        // Completely silent error handling to avoid console spam
        // The onclose handler will manage reconnection logic
      };

    } catch (error) {
      // Silent error handling
      if (process.env.NODE_ENV === 'development' && !hasLoggedMaxAttempts.current) {
        console.warn('Failed to create WebSocket:', error);
      }
    }
  }, [getBoxes]);

  // WebSocket connection effect
  useEffect(() => {
    console.log('🔌 WebSocket disabled - using REST API only');
    
    // WebSocket disabled temporarily - using REST API only
    /*
    // Small delay to avoid immediate connection attempts on mount
    const initTimeout = setTimeout(() => {
      if (isComponentMounted.current) {
        connectWebSocket();
      }
    }, 1000);

    return () => {
      clearTimeout(initTimeout);
      isComponentMounted.current = false;
      
      // Clear any pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clean close WebSocket if it exists
      if (wsRef.current) {
        const currentSocket = wsRef.current;
        if (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING) {
          currentSocket.close(1000, 'Component unmounting');
        }
        wsRef.current = null;
      }
    };
    */
  }, [connectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleSearchTermChange = (e) => {
    const { value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      searchTerm: value,
    }));
  };

  const handleFilterClear = () => {
    setFilters({ hallway: '', status: '', occupancyRange: '', searchTerm: '' });
  };
  
  const hallwayOptions = useMemo(() => {
    const hallways = allBoxes.map(box => box.hallway);
    return [...new Set(hallways)];
  }, [allBoxes]);

  return (
    <div>
      <PageHeader 
        title="Dashboard de Boxes" 
        onFilterClick={() => setIsFilterOpen(true)} 
        showControls={true} 
        showSearchBox={true}
        searchTerm={filters.searchTerm}
        onSearchTermChange={handleSearchTermChange}
        searchPlaceholder="Buscar por número de box..."
      />
      
      <DashboardFilters 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onFilterClear={handleFilterClear}
        hallwayOptions={hallwayOptions}
      />
      <BoxGrid boxes={filteredBoxes} />
    </div>
  );
}

export default BoxesDashboardPage;