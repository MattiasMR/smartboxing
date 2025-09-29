import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { doc } from "../../lib/db.js";
import { assertFreshJwt } from "../../lib/jwtGuard.js";

const T_ASSIGN = process.env.T_ASSIGN;

export const handler = async (event) => {
  const c = event.requestContext.authorizer.jwt.claims;
  assertFreshJwt(c);
  const q = event.queryStringParameters || {};
  const box = q.box || q.box_id;
  const doctor = q.doctor;
  const on_date = q.on_date; // YYYY-MM-DD

  // Elegimos el índice según parámetro prioritario
  if (box) {
    const r = await doc.send(new QueryCommand({
      TableName: T_ASSIGN, IndexName: "AssignmentsByBox",
      KeyConditionExpression: "boxId = :b",
      ExpressionAttributeValues: { ":b": box }
    }));
    return { statusCode: 200, body: JSON.stringify(r.Items || []) };
  }
  if (doctor) {
    const r = await doc.send(new QueryCommand({
      TableName: T_ASSIGN, IndexName: "AssignmentsByDoctor",
      KeyConditionExpression: "doctorId = :d",
      ExpressionAttributeValues: { ":d": doctor }
    }));
    return { statusCode: 200, body: JSON.stringify(r.Items || []) };
  }
  if (on_date) {
    const r = await doc.send(new QueryCommand({
      TableName: T_ASSIGN, IndexName: "AssignmentsByDate",
      KeyConditionExpression: "#d = :day",
      ExpressionAttributeNames: { "#d":"date" },
      ExpressionAttributeValues: { ":day": on_date }
    }));
    // Overlap exacto por hora si quieres: filtra start/end en JS
    return { statusCode: 200, body: JSON.stringify(r.Items || []) };
  }
  // sin filtros: (no hay listar todo por GSI), podrías usar Scan si dataset es chico
  return { statusCode: 400, body: JSON.stringify({ error: "Faltan filtros" }) };
};
