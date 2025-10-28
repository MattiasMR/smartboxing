import { z } from 'zod';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const ok = (data, statusCode = 200) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(data),
});

export const fail = (err, statusCode = 500) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify({ message: err?.message || 'Internal Error' }),
});

export const handler = (logic) => async (event) => {
  try { return ok(await logic(event)); }
  catch (e) { return fail(e, e instanceof z.ZodError ? 400 : e.statusCode || 500); }
};
