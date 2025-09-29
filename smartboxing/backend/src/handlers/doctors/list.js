import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { doc } from "../../lib/db.js";
import { assertFreshJwt } from "../../lib/jwtGuard.js";

const T_DOCTOR   = process.env.T_DOCTOR;
const T_VACATION = process.env.T_VACATION;
const T_ASSIGN   = process.env.T_ASSIGN;

function toISODate(d){ return new Date(d).toISOString().slice(0,10); }

export const handler = async (event) => {
  const c = event.requestContext.authorizer.jwt.claims;
  assertFreshJwt(c);
  const q = event.queryStringParameters || {};
  const status = q.status;
  const search = q.search; // haremos contains local

  // Base: todos los doctores
  const all = await doc.send(new ScanCommand({ TableName: T_DOCTOR }));
  let doctors = all.Items ?? [];

  const today = toISODate(Date.now());

  if (status) {
    // On duty hoy => assignments que se solapan con hoy
    if (status === 'ON_DUTY') {
      const a = await doc.send(new QueryCommand({
        TableName: T_ASSIGN, IndexName: "AssignmentsByDate",
        KeyConditionExpression: "#d = :today",
        ExpressionAttributeNames: { "#d":"date" },
        ExpressionAttributeValues: { ":today": today }
      }));
      const onDutyIds = new Set((a.Items||[]).map(it => it.doctorId));
      doctors = doctors.filter(d => onDutyIds.has(d.id));
    }
    // On vacation hoy
    if (status === 'ON_VACATION') {
      const v = await doc.send(new QueryCommand({
        TableName: T_VACATION, IndexName: "VacationByDoctor",
        KeyConditionExpression: "doctorId = :doc",
        ExpressionAttributeValues: { ":doc": "__all__" } // (si no tienes todos, haremos Scan)
      })).catch(()=>({Items:[]}));
      // Para simplificar: Scan y filtrado por fecha
      const vs = (await doc.send(new ScanCommand({ TableName: T_VACATION }))).Items || [];
      const onVac = new Set(vs.filter(x => x.start_date <= today && x.end_date >= today).map(x => x.doctorId));
      doctors = doctors.filter(d => onVac.has(d.id));
    }
    // Available: ni on duty ni on vacation
    if (status === 'AVAILABLE') {
      const a = await doc.send(new QueryCommand({
        TableName: T_ASSIGN, IndexName: "AssignmentsByDate",
        KeyConditionExpression: "#d = :today",
        ExpressionAttributeNames: { "#d":"date" },
        ExpressionAttributeValues: { ":today": today }
      }));
      const vs = (await doc.send(new ScanCommand({ TableName: T_VACATION }))).Items || [];
      const onDuty = new Set((a.Items||[]).map(it => it.doctorId));
      const onVac  = new Set(vs.filter(x => x.start_date <= today && x.end_date >= today).map(x => x.doctorId));
      doctors = doctors.filter(d => !onDuty.has(d.id) && !onVac.has(d.id));
    }
  }

  if (search) {
    const s = search.toLowerCase();
    doctors = doctors.filter(d => (d.full_name||'').toLowerCase().includes(s));
  }

  return { statusCode: 200, body: JSON.stringify(doctors) };
};
