import { z } from 'zod';
import { injectChaos } from './chaos.js';
import { logger, metrics, MetricUnit, withObservability } from './obs.js';

/**
 * CORS headers - Restringido según entorno
 * En producción: solo dominios autorizados
 * En dev: permite cualquier origen
 */
const getAllowedOrigin = () => {
  const stage = process.env.STAGE || 'dev';
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  
  // En producción, usar lista de orígenes permitidos
  if (stage === 'prod' && allowedOrigins) {
    return allowedOrigins; // CloudFront URL específica
  }
  
  // En dev/staging, permitir cualquier origen
  return '*';
};

const getCorsHeaders = () => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400', // Cache preflight por 24h
});

export const ok = (data, statusCode = 200) => ({
  statusCode,
  headers: getCorsHeaders(),
  body: JSON.stringify(data),
});

export const fail = (err, statusCode = 500) => ({
  statusCode,
  headers: getCorsHeaders(),
  body: JSON.stringify({ 
    message: err?.message || 'Internal Error',
    ...(process.env.STAGE !== 'prod' && { stack: err?.stack }),
  }),
});

/**
 * Parse JSON body safely with proper error handling
 */
export const parseBody = (event) => {
  try {
    return JSON.parse(event.body || '{}');
  } catch (e) {
    logger.warn('Invalid JSON in request body', { body: event.body?.substring(0, 100) });
    const error = new Error('Invalid JSON in request body');
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Handler wrapper con observabilidad, chaos engineering y manejo de errores
 */
export const handler = (logic, handlerName = 'unknown') => async (event, context) => {
  // Extraer nombre del handler del stack si no se proporciona
  const name = handlerName !== 'unknown' ? handlerName : (context?.functionName || 'unknown');
  
  try {
    // 🔥 Ignorar invocaciones de warmup
    if (event.source === 'warmup') {
      logger.debug('Warmup invocation - keeping function warm');
      return ok({ message: 'warmed up', timestamp: new Date().toISOString() });
    }
    
    // 📊 Agregar contexto al logger
    if (context) {
      logger.addContext(context);
    }
    logger.appendKeys({
      handler: name,
      path: event.rawPath || event.path,
      method: event.requestContext?.http?.method,
    });
    
    const startTime = Date.now();
    
    // 🌪️ Chaos Engineering - Solo si está habilitado
    await injectChaos();
    
    // Ejecutar lógica del handler
    const result = await logic(event);
    
    // 📈 Métricas de éxito
    const duration = Date.now() - startTime;
    metrics.addMetric('SuccessfulRequest', MetricUnit.Count, 1);
    metrics.addMetric('RequestDuration', MetricUnit.Milliseconds, duration);
    metrics.addDimension('Handler', name);
    metrics.publishStoredMetrics();
    
    logger.info('Request completed', { duration, handler: name });
    
    return ok(result);
  } catch (e) {
    // 📈 Métricas de error
    metrics.addMetric('FailedRequest', MetricUnit.Count, 1);
    metrics.addDimension('Handler', name);
    metrics.addDimension('ErrorType', e.name || 'Error');
    metrics.publishStoredMetrics();
    
    // Log del error
    if (e instanceof z.ZodError) {
      logger.warn('Validation error', { errors: e.errors, handler: name });
    } else {
      logger.error('Handler error', { 
        message: e.message, 
        stack: e.stack,
        handler: name,
        statusCode: e.statusCode || 500,
      });
    }
    
    return fail(e, e instanceof z.ZodError ? 400 : e.statusCode || 500);
  }
};
