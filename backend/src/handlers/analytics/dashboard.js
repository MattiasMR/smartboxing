import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ok, fail } from '../../lib/http.js';

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const TABLES = {
  appointments: process.env.APPOINTMENTS_TABLE,
  boxes: process.env.BOXES_TABLE,
  doctors: process.env.DOCTORS_TABLE,
  patients: process.env.PATIENTS_TABLE,
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
 */
export const main = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    
    // Calcular rango de fechas (default: últimos 30 días)
    const endDate = params.endDate || new Date().toISOString();
    const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Ejecutar todas las queries en paralelo
    const [
      appointmentsData,
      boxesData,
      doctorsData,
      patientsData,
    ] = await Promise.all([
      getAppointmentsMetrics(startDate, endDate),
      getBoxesMetrics(),
      getDoctorsMetrics(),
      getPatientsMetrics(),
    ]);

    const dashboard = {
      period: {
        startDate,
        endDate,
      },
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
async function getAppointmentsMetrics(startDate, endDate) {
  try {
    // Query usando GSI ByStartAt
    const command = new QueryCommand({
      TableName: TABLES.appointments,
      IndexName: 'ByStartAt',
      KeyConditionExpression: '#pk = :pk AND #startAt BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#pk': 'PK',
        '#startAt': 'startAt',
      },
      ExpressionAttributeValues: {
        ':pk': 'APPOINTMENT',
        ':start': startDate,
        ':end': endDate,
      },
    });

    const result = await dynamo.send(command);
    const appointments = result.Items || [];

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

    return {
      total,
      byStatus,
      noShowRate: parseFloat(noShowRate),
      dailyData,
      completed,
      scheduled: byStatus['scheduled'] || 0,
      cancelled: byStatus['cancelled'] || 0,
    };
  } catch (error) {
    console.error('Error fetching appointments metrics:', error);
    return {
      total: 0,
      byStatus: {},
      noShowRate: 0,
      dailyData: [],
      completed: 0,
      scheduled: 0,
      cancelled: 0,
    };
  }
}

/**
 * Métricas de boxes
 */
async function getBoxesMetrics() {
  try {
    const command = new ScanCommand({
      TableName: TABLES.boxes,
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
async function getDoctorsMetrics() {
  try {
    const command = new ScanCommand({
      TableName: TABLES.doctors,
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
async function getPatientsMetrics() {
  try {
    const command = new ScanCommand({
      TableName: TABLES.patients,
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
