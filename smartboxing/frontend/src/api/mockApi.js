// src/api/mockApi.js

// This function intercepts API requests and returns mock data when in development mode.
export const mockApi = (config) => {
  return new Promise((resolve, reject) => {
    const { method, url, data } = config;
    const getPromise = (data, timeout = 200) => {
      setTimeout(() => {
        resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
      }, timeout);
    };

    console.log(`Mocking ${method.toUpperCase()} request to ${url}`);

    // Mock for GET /api/summary/today/
    if (url.includes('/summary/today') && method === 'get') {
      return getPromise({
        active_boxes: 5,
        inactive_boxes: 2,
        total_doctors: 10,
        available_doctors: 8,
        unavailable_doctors: 2,
        doctors_on_duty: [], 
        specialties_distribution: [], 
      });
    }

    // Mock for GET /api/boxes/
    if (url.includes('/boxes') && method === 'get' && !url.includes('?')) {
      return getPromise([
        { id: 1, name: 'Box 1', status: 'active', last_update: new Date().toISOString(), ip_address: '192.168.1.101' },
        { id: 2, name: 'Box 2', status: 'inactive', last_update: new Date().toISOString(), ip_address: '192.168.1.102' },
        { id: 3, name: 'Box 3', status: 'active', last_update: new Date().toISOString(), ip_address: '192.168.1.103' },
      ]);
    }

    // Mock for GET /api/doctors/
    if (url.includes('/doctors') && method === 'get') {
      return getPromise([
        { id: 1, name: 'Dr. House', specialty: 'Diagnóstico', is_active: true },
        { id: 2, name: 'Dr. Strange', specialty: 'Cirugía', is_active: false },
      ]);
    }

    // Mocks for ReportsPage
    if (url.includes('/reports/doctor_ranking') && method === 'get') {
      return getPromise([]);
    }
    if (url.includes('/reports/specialty_distribution') && method === 'get') {
      return getPromise([]);
    }
    if (url.includes('/reports/consultations_by_timeslot') && method === 'get') {
      return getPromise([]);
    }
    if (url.includes('/reports/top_doctor') && method === 'get') {
      return getPromise({});
    }
    if (url.includes('/reports/top_box') && method === 'get') {
      return getPromise({});
    }
    if (url.includes('/reports/box_ranking') && method === 'get') {
      return getPromise([]);
    }
    if (url.includes('/reports/most_demanded_specialty') && method === 'get') {
      return getPromise({});
    }

    // Mock for POST /auth/login/
    if (url.includes('/auth/login') && method === 'post') {
      const { username, password } = data;
      
      // Simulate correct login
      if (username === 'admin' && password === 'admin') {
        return getPromise({ key: 'mock-auth-token-12345' });
      } else {
        // Simulate wrong password error
        setTimeout(() => {
          reject({
            response: {
              status: 400,
              data: { non_field_errors: ['Unable to log in with provided credentials.'] }
            }
          });
        }, 500);
        return;
      }
    }

    // Default mock for any other request
    return getPromise({ message: 'This is a mock response' });
  });
};
