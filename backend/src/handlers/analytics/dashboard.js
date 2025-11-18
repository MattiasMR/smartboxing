import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ok, fail } from '../../lib/http.js';

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const TABLES = {
  appointments: process.env.T_APPOINTMENTS,
  boxes: process.env.T_BOXES,
  staff: process.env.T_STAFF,
  patients: process.env.T_PATIENTS,
};
TABLES.doctors = TABLES.staff; // backward compatibility while frontend migrates

const BOX_STATUS_ALIASES = {
  disponible: 'available',
  available: 'available',
  ocupado: 'occupied',
  occupied: 'occupied',
  mantenimiento: 'maintenance',
  maintenance: 'maintenance',
};

const normalizeBoxStatus = (status) => {
  if (!status) return 'unknown';
  const key = status.toLowerCase();
  return BOX_STATUS_ALIASES[key] || key;
};

const normalizeAppointmentStatus = (status) => {
  if (!status) return 'sin-estado';
  return String(status).toLowerCase();
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
 * - staffId: ID de miembro del staff (alias doctorId)
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
    const staffFilter = params.staffId || params.doctorId;
    const filters = {
      boxId: params.boxId,
      staffId: staffFilter,
      doctorId: staffFilter,
    };

    // Ejecutar todas las queries en paralelo
    const [
      appointmentsData,
      boxesData,
      staffData,
      patientsData,
    ] = await Promise.all([
      getAppointmentsMetrics(tenantId, startDate, endDate, filters),
      getBoxesMetrics(tenantId),
      getStaffMetrics(tenantId),
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
        activeStaff: staffData.active,
        activeDoctors: staffData.active,
        totalPatients: patientsData.total,
      },
      appointments: appointmentsData,
      boxes: boxesData,
      staff: staffData,
      doctors: staffData,
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
      appointments = appointments.filter(apt => (apt.idBox ?? apt.boxId) === filters.boxId);
    }
    if (filters.staffId || filters.doctorId) {
      const staffFilterId = filters.staffId || filters.doctorId;
      appointments = appointments.filter((apt) => {
        const staffId = apt.idStaff ?? apt.idDoctor ?? apt.doctorId;
        return staffId === staffFilterId;
      });
    }

    // Agrupar por estado
    const byStatus = appointments.reduce((acc, apt) => {
      const normalizedStatus = normalizeAppointmentStatus(apt.status || apt.estado);
      acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
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
      const boxId = apt.idBox ?? apt.boxId;
      if (boxId) {
        acc[boxId] = (acc[boxId] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topBoxes = Object.entries(byBox)
      .map(([boxId, count]) => ({ boxId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Agrupar por staff (top 5)
    const byStaff = appointments.reduce((acc, apt) => {
      const staffId = apt.idStaff ?? apt.idDoctor ?? apt.doctorId;
      if (staffId) {
        acc[staffId] = (acc[staffId] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topStaff = Object.entries(byStaff)
      .map(([staffId, count]) => ({ staffId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      byStatus,
      noShowRate: parseFloat(noShowRate),
      completionRate: parseFloat(completionRate),
      dailyData,
      topBoxes,
      topStaff,
      topDoctors: topStaff,
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
      topStaff: [],
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
      const normalizedStatus = normalizeBoxStatus(box.status || box.estado);
      acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
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
 * Métricas de staff
 */
async function getStaffMetrics(tenantId) {
  try {
    const command = new ScanCommand({
      TableName: TABLES.staff,
      FilterExpression: '#tenantId = :tenantId',
      ExpressionAttributeNames: {
        '#tenantId': 'tenantId',
      },
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
      },
    });

    const result = await dynamo.send(command);
    const staff = result.Items || [];

    // Agrupar por especialidad
    const bySpecialty = staff.reduce((acc, doc) => {
      const specialty = doc.specialty || doc.especialidad || 'Sin especialidad';
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {});

    return {
      total: staff.length,
      active: staff.length, // Todos los miembros registrados están activos
      bySpecialty,
    };
  } catch (error) {
    console.error('Error fetching staff metrics:', error);
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
