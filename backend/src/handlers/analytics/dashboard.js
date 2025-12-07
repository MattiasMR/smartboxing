import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ok, fail, handler } from '../../lib/http.js';
import { logger, metrics, MetricUnit, trackBusinessMetric } from '../../lib/obs.js';

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

/**
 * Configuración de tablas con validación
 * Las variables de entorno deben estar definidas en serverless.yml
 */
const getTables = () => {
  const tables = {
    appointments: process.env.T_APPOINTMENTS,
    boxes: process.env.T_BOXES,
    staff: process.env.T_STAFF,
    patients: process.env.T_PATIENTS,
  };
  
  // Validar que las tablas críticas están configuradas
  const missingTables = Object.entries(tables)
    .filter(([key, value]) => !value && key !== 'patients') // patients es opcional
    .map(([key]) => key);
  
  if (missingTables.length > 0) {
    logger.error('Missing required table environment variables', { missingTables });
    throw new Error(`Missing table configuration: ${missingTables.join(', ')}`);
  }
  
  return tables;
};

/**
 * Normalización de estados - Soporta español e inglés
 * Alineado con la estructura de datos del seed
 */
const BOX_STATUS_ALIASES = {
  // Español (usado en seed)
  disponible: 'available',
  ocupado: 'occupied',
  mantenimiento: 'maintenance',
  // Inglés
  available: 'available',
  occupied: 'occupied',
  maintenance: 'maintenance',
};

const STAFF_STATUS_ALIASES = {
  activo: 'active',
  inactivo: 'inactive',
  active: 'active',
  inactive: 'inactive',
};

const normalizeBoxStatus = (status) => {
  if (!status) return 'unknown';
  const key = String(status).toLowerCase().trim();
  return BOX_STATUS_ALIASES[key] || key;
};

const normalizeStaffStatus = (status) => {
  if (!status) return 'unknown';
  const key = String(status).toLowerCase().trim();
  return STAFF_STATUS_ALIASES[key] || key;
};

const normalizeAppointmentStatus = (status) => {
  if (!status) return 'scheduled'; // Default para citas sin estado
  return String(status).toLowerCase().trim();
};

/**
 * GET /analytics/dashboard
 * 
 * Retorna métricas agregadas del sistema:
 * - Ocupación de boxes
 * - Estadísticas de citas
 * - Staff activo
 * - Tasa de no-show
 * - Pacientes registrados (si la tabla existe)
 * 
 * Query params opcionales:
 * - startDate: ISO date (default: hace 30 días)
 * - endDate: ISO date (default: hoy)
 * - boxId: ID de box específico (opcional)
 * - staffId: ID de miembro del staff
 */
export const main = handler(async (event) => {
  const params = event.queryStringParameters || {};
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'];
  
  // Require tenant for dashboard
  if (!tenantId) {
    return {
      statusCode: 403,
      error: 'No tenant assigned. Please request a tenancy first.',
      metrics: null,
    };
  }
  
  logger.info('Dashboard request', { tenantId, params });
  
  // Validar configuración de tablas
  const TABLES = getTables();
  
  // Calcular rango de fechas (default: últimos 30 días)
  const endDate = params.endDate || new Date().toISOString();
  const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Filtros opcionales
  const staffFilter = params.staffId || params.doctorId;
  const filters = {
    boxId: params.boxId || null,
    staffId: staffFilter || null,
  };

  // Ejecutar todas las queries en paralelo
  const [
    appointmentsData,
    boxesData,
    staffData,
    patientsData,
  ] = await Promise.all([
    getAppointmentsMetrics(TABLES.appointments, tenantId, startDate, endDate, filters),
    getBoxesMetrics(TABLES.boxes, tenantId),
    getStaffMetrics(TABLES.staff, tenantId),
    TABLES.patients ? getPatientsMetrics(TABLES.patients, tenantId) : Promise.resolve({ total: 0, active: 0, inactive: 0 }),
  ]);

  // Métricas de negocio para CloudWatch
  trackBusinessMetric('DashboardViews', 1, MetricUnit.Count, { tenantId });
  trackBusinessMetric('ActiveBoxes', boxesData.active, MetricUnit.Count, { tenantId });
  trackBusinessMetric('ActiveStaff', staffData.active, MetricUnit.Count, { tenantId });
  trackBusinessMetric('TotalAppointments', appointmentsData.total, MetricUnit.Count, { tenantId });

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
      totalPatients: patientsData.total,
      noShowRate: appointmentsData.noShowRate,
      occupancyRate: boxesData.occupancyRate,
    },
    appointments: appointmentsData,
    boxes: boxesData,
    staff: staffData,
    patients: patientsData,
    timestamp: new Date().toISOString(),
  };

  logger.info('Dashboard generated', {
    appointmentsCount: appointmentsData.total,
    boxesCount: boxesData.total,
    staffCount: staffData.total,
  });

  return dashboard;
}, 'analytics-dashboard');

/**
 * Métricas de citas
 * @param {string} tableName - Nombre de la tabla de DynamoDB
 * @param {string} tenantId - ID del tenant
 * @param {string} startDate - Fecha de inicio (ISO)
 * @param {string} endDate - Fecha de fin (ISO)
 * @param {object} filters - Filtros opcionales (boxId, staffId)
 */
async function getAppointmentsMetrics(tableName, tenantId, startDate, endDate, filters = {}) {
  try {
    logger.debug('Fetching appointments metrics', { tableName, tenantId, startDate, endDate, filters });
    
    // Scan con filtro de tenantId
    const command = new ScanCommand({
      TableName: tableName,
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
      appointments = appointments.filter(apt => apt.idBox === filters.boxId);
    }
    if (filters.staffId) {
      appointments = appointments.filter(apt => apt.idStaff === filters.staffId);
    }

    // Agrupar por estado
    const byStatus = appointments.reduce((acc, apt) => {
      const normalizedStatus = normalizeAppointmentStatus(apt.status);
      acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
      return acc;
    }, {});

    // Calcular tasa de no-show
    const noShows = byStatus['no-show'] || byStatus['noshow'] || 0;
    const completed = byStatus['completed'] || byStatus['completado'] || 0;
    const total = appointments.length;
    const noShowRate = total > 0 ? parseFloat(((noShows / total) * 100).toFixed(2)) : 0;
    const completionRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(2)) : 0;

    // Agrupar por día
    const byDay = appointments.reduce((acc, apt) => {
      if (apt.startAt) {
        const day = apt.startAt.split('T')[0]; // YYYY-MM-DD
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {});

    // Convertir a array ordenado para gráficos
    const dailyData = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Agrupar por box (top 5)
    const byBox = appointments.reduce((acc, apt) => {
      if (apt.idBox) {
        acc[apt.idBox] = (acc[apt.idBox] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topBoxes = Object.entries(byBox)
      .map(([boxId, count]) => ({ boxId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Agrupar por staff (top 5)
    const byStaff = appointments.reduce((acc, apt) => {
      if (apt.idStaff) {
        acc[apt.idStaff] = (acc[apt.idStaff] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topStaff = Object.entries(byStaff)
      .map(([staffId, count]) => ({ staffId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    logger.debug('Appointments metrics calculated', { total, noShowRate, completionRate });

    return {
      total,
      byStatus,
      noShowRate,
      completionRate,
      dailyData,
      topBoxes,
      topStaff,
      completed,
      scheduled: byStatus['scheduled'] || 0,
      cancelled: byStatus['cancelled'] || byStatus['cancelado'] || 0,
      confirmed: byStatus['confirmed'] || byStatus['confirmado'] || 0,
      inProgress: byStatus['in-progress'] || byStatus['en-progreso'] || 0,
    };
  } catch (error) {
    logger.error('Error fetching appointments metrics', { error: error.message });
    return {
      total: 0,
      byStatus: {},
      noShowRate: 0,
      completionRate: 0,
      dailyData: [],
      topBoxes: [],
      topStaff: [],
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
 * @param {string} tableName - Nombre de la tabla de DynamoDB
 * @param {string} tenantId - ID del tenant
 */
async function getBoxesMetrics(tableName, tenantId) {
  try {
    logger.debug('Fetching boxes metrics', { tableName, tenantId });
    
    const command = new ScanCommand({
      TableName: tableName,
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

    // Agrupar por estado (soportando español 'estado' del seed)
    const byStatus = boxes.reduce((acc, box) => {
      const normalizedStatus = normalizeBoxStatus(box.status || box.estado);
      acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
      return acc;
    }, {});

    // Calcular tasa de ocupación
    const available = byStatus['available'] || 0;
    const occupied = byStatus['occupied'] || 0;
    const total = boxes.length;
    const occupancyRate = total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0;

    logger.debug('Boxes metrics calculated', { total, occupancyRate });

    return {
      total,
      active: available + occupied,
      byStatus,
      occupancyRate,
      available,
      occupied,
      maintenance: byStatus['maintenance'] || 0,
    };
  } catch (error) {
    logger.error('Error fetching boxes metrics', { error: error.message });
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
 * @param {string} tableName - Nombre de la tabla de DynamoDB
 * @param {string} tenantId - ID del tenant
 */
async function getStaffMetrics(tableName, tenantId) {
  try {
    logger.debug('Fetching staff metrics', { tableName, tenantId });
    
    const command = new ScanCommand({
      TableName: tableName,
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

    // Agrupar por especialidad (soportando español 'especialidad' del seed)
    const bySpecialty = staff.reduce((acc, member) => {
      const specialty = member.specialty || member.especialidad || 'Sin especialidad';
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {});

    // Contar activos (soportando español 'estado' del seed)
    const activeCount = staff.filter(member => {
      const status = normalizeStaffStatus(member.status || member.estado);
      return status === 'active';
    }).length;

    logger.debug('Staff metrics calculated', { total: staff.length, active: activeCount });

    return {
      total: staff.length,
      active: activeCount,
      bySpecialty,
    };
  } catch (error) {
    logger.error('Error fetching staff metrics', { error: error.message });
    return {
      total: 0,
      active: 0,
      bySpecialty: {},
    };
  }
}

/**
 * Métricas de pacientes
 * @param {string} tableName - Nombre de la tabla de DynamoDB
 * @param {string} tenantId - ID del tenant
 */
async function getPatientsMetrics(tableName, tenantId) {
  try {
    logger.debug('Fetching patients metrics', { tableName, tenantId });
    
    const command = new ScanCommand({
      TableName: tableName,
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
    const active = patients.filter(p => 
      (p.status || p.estado || '').toLowerCase() === 'active' ||
      (p.status || p.estado || '').toLowerCase() === 'activo'
    ).length;

    logger.debug('Patients metrics calculated', { total: patients.length, active });

    return {
      total: patients.length,
      active,
      inactive: patients.length - active,
    };
  } catch (error) {
    logger.error('Error fetching patients metrics', { error: error.message });
    return {
      total: 0,
      active: 0,
      inactive: 0,
    };
  }
}
