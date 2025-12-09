/**
 * AI Report Generator - Generates intelligent summaries using OpenAI
 * This endpoint gathers all tenant data and creates an executive summary
 */

import { ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { requireTenantAdmin, ROLES } from '../../lib/auth.js';
import { doc } from '../../lib/db.js';
import { logger } from '../../lib/obs.js';

const T_APPOINTMENTS = process.env.T_APPOINTMENTS;
const T_BOXES = process.env.T_BOXES;
const T_STAFF = process.env.T_STAFF;
const T_PATIENTS = process.env.T_PATIENTS;
const T_TENANTS = process.env.T_TENANTS;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * POST /analytics/ai-report
 * 
 * Generates an AI-powered executive summary of tenant data
 * Requires tenant_admin role and active tenancy
 */
export const main = handler(async (event) => {
  // VPC disabled for internet access
  const user = requireTenantAdmin(event);
  
  const tenantId = user.tenantId;
  
  if (!tenantId) {
    const error = new Error('Active tenancy required to generate AI report');
    error.statusCode = 403;
    throw error;
  }
  
  // Check if OpenAI is configured
  if (!OPENAI_API_KEY) {
    const error = new Error('AI service not configured. Please set OPENAI_API_KEY in environment variables.');
    error.statusCode = 503;
    throw error;
  }
  
  logger.info('Generating AI report', { tenantId, userId: user.cognitoSub });
  
  // Get tenant info for personalization
  const tenantResult = await doc.send(new GetCommand({
    TableName: T_TENANTS,
    Key: { id: tenantId },
  }));
  
  const tenant = tenantResult.Item;
  if (!tenant) {
    const error = new Error('Tenant not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Calculate date range (last 30 days)
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Gather all metrics in parallel
  const [
    appointmentsData,
    boxesData,
    staffData,
    patientsData,
  ] = await Promise.all([
    getAppointmentsData(tenantId, startDate, endDate),
    getBoxesData(tenantId),
    getStaffData(tenantId),
    T_PATIENTS ? getPatientsData(tenantId) : Promise.resolve({ total: 0, active: 0 }),
  ]);
  
  // Build data summary for AI
  const dataSummary = buildDataSummary({
    tenant,
    appointments: appointmentsData,
    boxes: boxesData,
    staff: staffData,
    patients: patientsData,
    period: { startDate, endDate },
  });
  
  // Generate AI summary
  const aiSummary = await generateAISummary(tenant, dataSummary);
  
  return {
    summary: aiSummary,
    tenant: {
      name: tenant.name,
      description: tenant.description,
    },
    period: {
      startDate,
      endDate,
      days: 30,
    },
    dataPoints: {
      totalAppointments: appointmentsData.total,
      completedAppointments: appointmentsData.completed,
      noShowRate: appointmentsData.noShowRate,
      totalBoxes: boxesData.total,
      activeBoxes: boxesData.available + boxesData.occupied,
      occupancyRate: boxesData.occupancyRate,
      totalStaff: staffData.total,
      activeStaff: staffData.active,
      topSpecialty: staffData.topSpecialty,
      totalPatients: patientsData.total,
    },
    generatedAt: new Date().toISOString(),
  };
}, 'ai-report');

/**
 * Build a text summary of all data for the AI
 */
function buildDataSummary({ tenant, appointments, boxes, staff, patients, period }) {
  const lines = [
    `## Datos de ${tenant.name}`,
    `Período de análisis: ${period.startDate.split('T')[0]} a ${period.endDate.split('T')[0]} (30 días)`,
    '',
    '### Citas/Reservaciones',
    `- Total de citas: ${appointments.total}`,
    `- Completadas: ${appointments.completed}`,
    `- Programadas: ${appointments.scheduled}`,
    `- Confirmadas: ${appointments.confirmed}`,
    `- Canceladas: ${appointments.cancelled}`,
    `- No-show: ${appointments.noShow}`,
    `- Tasa de no-show: ${appointments.noShowRate}%`,
    `- Tasa de completación: ${appointments.completionRate}%`,
    '',
    '### Espacios/Boxes',
    `- Total de boxes: ${boxes.total}`,
    `- Disponibles: ${boxes.available}`,
    `- Ocupados: ${boxes.occupied}`,
    `- En mantenimiento: ${boxes.maintenance}`,
    `- Tasa de ocupación: ${boxes.occupancyRate}%`,
    '',
    '### Personal/Staff',
    `- Total del personal: ${staff.total}`,
    `- Personal activo: ${staff.active}`,
    `- Especialidades más frecuentes: ${staff.specialtiesText}`,
    '',
    '### Clientes/Pacientes',
    `- Total registrados: ${patients.total}`,
    `- Activos: ${patients.active}`,
    '',
    '### Distribución por día de la semana',
    appointments.byDayOfWeek.map(d => `- ${d.day}: ${d.count} citas`).join('\n'),
    '',
    '### Top 3 Boxes más utilizados',
    appointments.topBoxes.slice(0, 3).map((b, i) => `${i + 1}. Box ${b.boxId}: ${b.count} citas`).join('\n'),
    '',
    '### Top 3 Staff más activos',
    appointments.topStaff.slice(0, 3).map((s, i) => `${i + 1}. Staff ${s.staffId}: ${s.count} citas`).join('\n'),
  ];
  
  return lines.join('\n');
}

/**
 * Generate AI summary using OpenAI
 */
async function generateAISummary(tenant, dataSummary) {
  const tenantType = tenant.type || 'organización';
  const tenantDescription = tenant.description || 'gestión de espacios físicos y citas';
  
  const systemPrompt = `Eres un analista senior de operaciones para "${tenant.name}".
${tenant.description ? `Descripción de la organización: ${tenantDescription}` : ''}
Tipo de organización: ${tenantType}

Tu tarea es analizar los datos de rendimiento y generar un resumen ejecutivo profesional en español.

Analiza los siguientes datos y proporciona:
1. Un resumen general del período (2-3 oraciones)
2. Puntos destacados positivos (3-5 puntos)
3. Áreas de preocupación o mejora (2-4 puntos si las hay)
4. Tendencias observadas (2-3 puntos)
5. Recomendaciones breves (3-5 acciones concretas)

Importante:
- Mantén el tono profesional pero accesible
- El resumen debe ser útil para la dirección
- Formatea en Markdown para buena presentación
- Adapta el análisis al tipo de organización (${tenantType})`;

  const userPrompt = `Analiza los siguientes datos de "${tenant.name}":\n\n${dataSummary}\n\nGenera un resumen ejecutivo completo y profesional en formato Markdown.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('OpenAI API error', { status: response.status, error: errorData });
      throw new Error('Error generating AI summary');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    logger.error('Error calling OpenAI', { error: error.message });
    
    // Return a fallback summary based on data
    return generateFallbackSummary(tenant, dataSummary);
  }
}

/**
 * Generate a basic summary if AI fails
 */
function generateFallbackSummary(tenant, dataSummary) {
  return `# Resumen Ejecutivo - ${tenant.name}

⚠️ *Resumen generado automáticamente (sin análisis de IA)*

${dataSummary}

---
*Para obtener un análisis más detallado, por favor contacte al administrador del sistema.*
`;
}

/**
 * Get appointments data for tenant
 */
async function getAppointmentsData(tenantId, startDate, endDate) {
  try {
    const result = await doc.send(new ScanCommand({
      TableName: T_APPOINTMENTS,
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
    }));

    const appointments = result.Items || [];
    
    // Group by status
    const byStatus = appointments.reduce((acc, apt) => {
      const status = (apt.status || 'scheduled').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Group by day of week
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const byDayOfWeek = appointments.reduce((acc, apt) => {
      if (apt.startAt) {
        const dayIndex = new Date(apt.startAt).getDay();
        acc[dayIndex] = (acc[dayIndex] || 0) + 1;
      }
      return acc;
    }, {});
    
    const byDayOfWeekArr = dayNames.map((day, index) => ({
      day,
      count: byDayOfWeek[index] || 0,
    }));

    // Group by box
    const byBox = appointments.reduce((acc, apt) => {
      if (apt.idBox) {
        acc[apt.idBox] = (acc[apt.idBox] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topBoxes = Object.entries(byBox)
      .map(([boxId, count]) => ({ boxId, count }))
      .sort((a, b) => b.count - a.count);

    // Group by staff
    const byStaff = appointments.reduce((acc, apt) => {
      if (apt.idStaff) {
        acc[apt.idStaff] = (acc[apt.idStaff] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topStaff = Object.entries(byStaff)
      .map(([staffId, count]) => ({ staffId, count }))
      .sort((a, b) => b.count - a.count);

    const total = appointments.length;
    const completed = byStatus['completed'] || byStatus['completado'] || 0;
    const noShow = byStatus['no-show'] || byStatus['noshow'] || 0;
    const noShowRate = total > 0 ? parseFloat(((noShow / total) * 100).toFixed(2)) : 0;
    const completionRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(2)) : 0;

    return {
      total,
      completed,
      scheduled: byStatus['scheduled'] || byStatus['programado'] || 0,
      confirmed: byStatus['confirmed'] || byStatus['confirmado'] || 0,
      cancelled: byStatus['cancelled'] || byStatus['cancelado'] || 0,
      noShow,
      noShowRate,
      completionRate,
      byDayOfWeek: byDayOfWeekArr,
      topBoxes,
      topStaff,
    };
  } catch (error) {
    logger.error('Error fetching appointments data', { error: error.message });
    return {
      total: 0, completed: 0, scheduled: 0, confirmed: 0, cancelled: 0, noShow: 0,
      noShowRate: 0, completionRate: 0, byDayOfWeek: [], topBoxes: [], topStaff: [],
    };
  }
}

/**
 * Get boxes data for tenant
 */
async function getBoxesData(tenantId) {
  try {
    const result = await doc.send(new ScanCommand({
      TableName: T_BOXES,
      FilterExpression: '#tenantId = :tenantId',
      ExpressionAttributeNames: { '#tenantId': 'tenantId' },
      ExpressionAttributeValues: { ':tenantId': tenantId },
    }));

    const boxes = result.Items || [];
    
    const byStatus = boxes.reduce((acc, box) => {
      const status = (box.status || box.estado || 'available').toLowerCase();
      const normalized = status === 'disponible' ? 'available' 
        : status === 'ocupado' ? 'occupied'
        : status === 'mantenimiento' ? 'maintenance'
        : status;
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {});

    const total = boxes.length;
    const available = byStatus['available'] || 0;
    const occupied = byStatus['occupied'] || 0;
    const maintenance = byStatus['maintenance'] || 0;
    const occupancyRate = total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0;

    return { total, available, occupied, maintenance, occupancyRate };
  } catch (error) {
    logger.error('Error fetching boxes data', { error: error.message });
    return { total: 0, available: 0, occupied: 0, maintenance: 0, occupancyRate: 0 };
  }
}

/**
 * Get staff data for tenant
 */
async function getStaffData(tenantId) {
  try {
    const result = await doc.send(new ScanCommand({
      TableName: T_STAFF,
      FilterExpression: '#tenantId = :tenantId',
      ExpressionAttributeNames: { '#tenantId': 'tenantId' },
      ExpressionAttributeValues: { ':tenantId': tenantId },
    }));

    const staff = result.Items || [];
    
    // Count active
    const active = staff.filter(s => {
      const status = (s.status || s.estado || 'active').toLowerCase();
      return status === 'active' || status === 'activo';
    }).length;

    // Group by specialty
    const bySpecialty = staff.reduce((acc, s) => {
      const specialty = s.specialty || s.especialidad || 'Sin especialidad';
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {});

    const specialtiesSorted = Object.entries(bySpecialty)
      .sort((a, b) => b[1] - a[1]);
    
    const topSpecialty = specialtiesSorted[0] ? specialtiesSorted[0][0] : 'N/A';
    const specialtiesText = specialtiesSorted.slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)
      .join(', ') || 'No hay datos';

    return {
      total: staff.length,
      active,
      topSpecialty,
      specialtiesText,
    };
  } catch (error) {
    logger.error('Error fetching staff data', { error: error.message });
    return { total: 0, active: 0, topSpecialty: 'N/A', specialtiesText: 'No hay datos' };
  }
}

/**
 * Get patients data for tenant
 */
async function getPatientsData(tenantId) {
  try {
    const result = await doc.send(new ScanCommand({
      TableName: T_PATIENTS,
      FilterExpression: '#tenantId = :tenantId',
      ExpressionAttributeNames: { '#tenantId': 'tenantId' },
      ExpressionAttributeValues: { ':tenantId': tenantId },
    }));

    const patients = result.Items || [];
    const active = patients.filter(p => {
      const status = (p.status || p.estado || '').toLowerCase();
      return status === 'active' || status === 'activo';
    }).length;

    return { total: patients.length, active };
  } catch (error) {
    logger.error('Error fetching patients data', { error: error.message });
    return { total: 0, active: 0 };
  }
}
