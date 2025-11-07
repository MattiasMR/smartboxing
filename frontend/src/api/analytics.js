import { api } from './client';

/**
 * Obtiene las métricas del dashboard
 * 
 * @param {Object} params - Parámetros opcionales
 * @param {string} params.startDate - Fecha inicio (ISO format)
 * @param {string} params.endDate - Fecha fin (ISO format)
 * @returns {Promise} Dashboard metrics
 */
export const getDashboardMetrics = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `/analytics/dashboard${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get(url);
  return response.data;
};
