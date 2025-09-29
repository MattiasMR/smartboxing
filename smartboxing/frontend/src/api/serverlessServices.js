// src/api/serverlessServices.js
import { API_CONFIG } from '../config';
import { getStoredToken } from '../utils/auth';

class ServerlessApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = getStoredToken();
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (response.status === 401) {
        // Token expired or invalid
        throw new Error('Unauthorized');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async getAuthMe() {
    return this.request('/auth/me');
  }

  async getPermissions() {
    return this.request('/permissions');
  }

  // Personalization endpoints
  async getPersonalization() {
    return this.request('/personalization');
  }

  async updateClientSettings(settings) {
    return this.request('/personalization/client', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateUserSettings(settings) {
    return this.request('/personalization/me', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Boxes endpoints
  async getBoxes(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/boxes${query ? `?${query}` : ''}`);
  }

  async getBox(id) {
    return this.request(`/boxes/${id}`);
  }

  async createBox(data) {
    return this.request('/boxes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBox(id, data) {
    return this.request(`/boxes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBox(id) {
    return this.request(`/boxes/${id}`, {
      method: 'DELETE',
    });
  }

  // Doctors endpoints
  async getDoctors(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/doctors${query ? `?${query}` : ''}`);
  }

  async createDoctor(data) {
    return this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDoctor(id, data) {
    return this.request(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDoctor(id) {
    return this.request(`/doctors/${id}`, {
      method: 'DELETE',
    });
  }

  // Specialties endpoints
  async getSpecialties() {
    return this.request('/specialties');
  }

  // Vacations endpoints
  async getVacations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/vacations${query ? `?${query}` : ''}`);
  }

  async createVacation(data) {
    return this.request('/vacations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteVacation(id) {
    return this.request(`/vacations/${id}`, {
      method: 'DELETE',
    });
  }

  // Box Assignments endpoints
  async getBoxAssignments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/box-assignments${query ? `?${query}` : ''}`);
  }

  async createBoxAssignment(data) {
    return this.request('/box-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBoxAssignment(id, data) {
    return this.request(`/box-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBoxAssignment(id) {
    return this.request(`/box-assignments/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointments endpoints
  async getAppointments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/appointments${query ? `?${query}` : ''}`);
  }

  async getAppointment(id) {
    return this.request(`/appointments/${id}`);
  }

  async createAppointment(data) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id, data) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAppointment(id) {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create and export instance
const serverlessApi = new ServerlessApiClient();
export default serverlessApi;

// Export individual functions for compatibility
export const {
  getAuthMe,
  getPermissions,
  getPersonalization,
  updateClientSettings,
  updateUserSettings,
  getBoxes,
  getBox,
  createBox,
  updateBox,
  deleteBox,
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getSpecialties,
  getVacations,
  createVacation,
  deleteVacation,
  getBoxAssignments,
  createBoxAssignment,
  updateBoxAssignment,
  deleteBoxAssignment,
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = serverlessApi;