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

/**
 * Parse JSON body safely with proper error handling
 */
export const parseBody = (event) => {
  try {
    return JSON.parse(event.body || '{}');
  } catch (e) {
    const error = new Error('Invalid JSON in request body');
    error.statusCode = 400;
    throw error;
  }
};

export const handler = (logic) => async (event) => {
  try { return ok(await logic(event)); }
  catch (e) { return fail(e, e instanceof z.ZodError ? 400 : e.statusCode || 500); }
};
