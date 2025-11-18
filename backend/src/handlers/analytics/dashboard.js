import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ok, fail } from '../../lib/http.js';

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const TABLES = {
  appointments: process.env.T_APPOINTMENTS,
  boxes: process.env.T_BOXES,
  doctors: process.env.T_DOCTORS,
  patients: process.env.T_PATIENTS,
};

/**
 * GET /analytics/dashboard
 * 
 * Retorna métricas agregadas del sistema:
 * - Ocupación de boxes
 * - Estadísticas de citas
 * - Médicos activos
 * - Tasa de no-show
 * - Pacientes registrados
 * 
 * Query params opcionales:
 * - startDate: ISO date (default: hace 30 días)
 * - endDate: ISO date (default: hoy)
 * - boxId: ID de box específico (opcional)
 * - doctorId: ID de doctor específico (opcional)
 */
export const main = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
    const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
    
    // Calcular rango de fechas (default: últimos 30 días)
    const endDate = params.endDate || new Date().toISOString();
    const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Filtros opcionales
    const filters = {
      boxId: params.boxId,
      doctorId: params.doctorId,
    };

    // Ejecutar todas las queries en paralelo
    const [
      appointmentsData,
      boxesData,
      doctorsData,
      patientsData,
    ] = await Promise.all([
      getAppointmentsMetrics(tenantId, startDate, endDate, filters),
      getBoxesMetrics(tenantId),
      getDoctorsMetrics(tenantId),
      getPatientsMetrics(tenantId),
    ]);

    const dashboard = {
      tenantId,
      period: {
        startDate,
        endDate,
      },
      filters,
      summary: {
        totalAppointments: appointmentsData.total,
        activeBoxes: boxesData.active,
        activeDoctors: doctorsData.active,
        totalPatients: patientsData.total,
      },
      appointments: appointmentsData,
      boxes: boxesData,
      doctors: doctorsData,
      patients: patientsData,
      timestamp: new Date().toISOString(),
    };

    return ok(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return fail(error);
  }
};

/**
 * Métricas de citas
 */
async function getAppointmentsMetrics(tenantId, startDate, endDate, filters = {}) {
  try {
    // Scan con filtro de tenantId
    const command = new ScanCommand({
      TableName: TABLES.appointments,
      FilterExpression: '#tenantId = :tenantId AND #startAt BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#tenantId': 'tenantId',
        '#startAt': 'startAt',
      },
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
        ':start': startDate,
        ':end': endDate,
      },
    });

    const result = await dynamo.send(command);
    let appointments = result.Items || [];

    // Aplicar filtros adicionales
    if (filters.boxId) {
      appointments = appointments.filter(apt => apt.boxId === filters.boxId);
    }
    if (filters.doctorId) {
      appointments = appointments.filter(apt => apt.doctorId === filters.doctorId);
    }

    // Agrupar por estado
    const byStatus = appointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    // Calcular tasa de no-show
    const noShows = byStatus['no-show'] || 0;
    const completed = byStatus['completed'] || 0;
    const total = appointments.length;
    const noShowRate = total > 0 ? ((noShows / total) * 100).toFixed(2) : 0;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;

    // Agrupar por día
    const byDay = appointments.reduce((acc, apt) => {
      const day = apt.startAt.split('T')[0]; // YYYY-MM-DD
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    // Convertir a array ordenado para gráficos
    const dailyData = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Agrupar por box (top 5)
    const byBox = appointments.reduce((acc, apt) => {
      if (apt.boxId) {
        acc[apt.boxId] = (acc[apt.boxId] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topBoxes = Object.entries(byBox)
      .map(([boxId, count]) => ({ boxId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Agrupar por doctor (top 5)
    const byDoctor = appointments.reduce((acc, apt) => {
      if (apt.doctorId) {
        acc[apt.doctorId] = (acc[apt.doctorId] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topDoctors = Object.entries(byDoctor)
      .map(([doctorId, count]) => ({ doctorId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      byStatus,
      noShowRate: parseFloat(noShowRate),
      completionRate: parseFloat(completionRate),
      dailyData,
      topBoxes,
      topDoctors,
      completed,
      scheduled: byStatus['scheduled'] || 0,
      cancelled: byStatus['cancelled'] || 0,
      confirmed: byStatus['confirmed'] || 0,
      inProgress: byStatus['in-progress'] || 0,
    };
  } catch (error) {
    console.error('Error fetching appointments metrics:', error);
    return {
      total: 0,
      byStatus: {},
      noShowRate: 0,
      completionRate: 0,
      dailyData: [],
      topBoxes: [],
      topDoctors: [],
      completed: 0,
      scheduled: 0,
      cancelled: 0,
      confirmed: 0,
      inProgress: 0,
    };
  }
}

/**
 * Métricas de boxes
 */
async function getBoxesMetrics(tenantId) {
  try {
    const command = new ScanCommand({
      TableName: TABLES.boxes,
      FilterExpression: '#tenantId = :tenantId',
      ExpressionAttributeNames: {
        '#tenantId': 'tenantId',
      },
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
      },
    });

    const result = await dynamo.send(command);
    const boxes = result.Items || [];

    // Agrupar por estado
    const byStatus = boxes.reduce((acc, box) => {
      acc[box.status] = (acc[box.status] || 0) + 1;
      return acc;
    }, {});

    // Calcular tasa de ocupación
    const available = byStatus['available'] || 0;
    const occupied = byStatus['occupied'] || 0;
    const total = boxes.length;
    const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(2) : 0;

    return {
      total,
      active: (byStatus['available'] || 0) + (byStatus['occupied'] || 0),
      byStatus,
      occupancyRate: parseFloat(occupancyRate),
      available,
      occupied,
      maintenance: byStatus['maintenance'] || 0,
    };
  } catch (error) {
    console.error('Error fetching boxes metrics:', error);
    return {
      total: 0,
      active: 0,
      byStatus: {},
      occupancyRate: 0,
      available: 0,
      occupied: 0,
      maintenance: 0,
    };
  }
}

/**
 * Métricas de médicos
 */
async function getDoctorsMetrics(tenantId) {
  try {
    const command = new ScanCommand({
      TableName: TABLES.doctors,
      FilterExpression: '#tenantId = :tenantId',
      ExpressionAttributeNames: {
        '#tenantId': 'tenantId',
      },
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
      },
    });

    const result = await dynamo.send(command);
    const doctors = result.Items || [];

    // Agrupar por especialidad
    const bySpecialty = doctors.reduce((acc, doc) => {
      const specialty = doc.specialty || 'Sin especialidad';
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {});

    return {
      total: doctors.length,
      active: doctors.length, // Todos los médicos registrados están activos
      bySpecialty,
    };
  } catch (error) {
    console.error('Error fetching doctors metrics:', error);
    return {
      total: 0,
      active: 0,
      bySpecialty: {},
    };
  }
}

/**
 * Métricas de pacientes
 */
async function getPatientsMetrics(tenantId) {
  try {
    const command = new ScanCommand({
      TableName: TABLES.patients,
      FilterExpression: '#tenantId = :tenantId',
      ExpressionAttributeNames: {
        '#tenantId': 'tenantId',
      },
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
      },
    });

    const result = await dynamo.send(command);
    const patients = result.Items || [];

    // Filtrar activos
    const active = patients.filter(p => p.status === 'active').length;

    return {
      total: patients.length,
      active,
      inactive: patients.length - active,
    };
  } catch (error) {
    console.error('Error fetching patients metrics:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
    };
  }
}
