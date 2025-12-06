import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

// Configuración centralizada de observabilidad
const SERVICE_NAME = 'smartboxing';
const NAMESPACE = 'Smartboxing';

// Logger configurado con nivel según entorno
export const logger = new Logger({
  serviceName: SERVICE_NAME,
  logLevel: process.env.LOG_LEVEL || (process.env.STAGE === 'prod' ? 'INFO' : 'DEBUG'),
  persistentLogAttributes: {
    environment: process.env.STAGE || 'dev',
  },
});

// Metrics configurado para CloudWatch
export const metrics = new Metrics({
  namespace: NAMESPACE,
  serviceName: SERVICE_NAME,
  defaultDimensions: {
    environment: process.env.STAGE || 'dev',
  },
});

// Re-exportar MetricUnit para uso en handlers
export { MetricUnit };

/**
 * Middleware de observabilidad para Lambda handlers
 * Agrega logging estructurado y métricas automáticas
 */
export const withObservability = (handlerName, fn) => async (event, context) => {
  const startTime = Date.now();
  
  // Agregar contexto de Lambda al logger
  logger.addContext(context);
  logger.appendKeys({
    handler: handlerName,
    requestId: context?.awsRequestId,
    coldStart: context?.callbackWaitsForEmptyEventLoop !== false,
  });

  logger.info('Handler invoked', {
    path: event.rawPath || event.path,
    method: event.requestContext?.http?.method || event.httpMethod,
    tenantId: event.requestContext?.authorizer?.jwt?.claims?.['custom:tenantId'],
  });

  try {
    const result = await fn(event, context);
    
    const duration = Date.now() - startTime;
    
    // Métricas de éxito
    metrics.addMetric('SuccessfulInvocation', MetricUnit.Count, 1);
    metrics.addMetric('Duration', MetricUnit.Milliseconds, duration);
    metrics.addDimension('Handler', handlerName);
    metrics.publishStoredMetrics();

    logger.info('Handler completed successfully', {
      duration,
      statusCode: result?.statusCode || 200,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Métricas de error
    metrics.addMetric('FailedInvocation', MetricUnit.Count, 1);
    metrics.addMetric('Duration', MetricUnit.Milliseconds, duration);
    metrics.addDimension('Handler', handlerName);
    metrics.addDimension('ErrorType', error.name || 'UnknownError');
    metrics.publishStoredMetrics();

    logger.error('Handler failed', {
      error: error.message,
      stack: error.stack,
      duration,
      statusCode: error.statusCode || 500,
    });

    throw error;
  }
};

/**
 * Helper para métricas de negocio personalizadas
 */
export const trackBusinessMetric = (metricName, value, unit = MetricUnit.Count, dimensions = {}) => {
  Object.entries(dimensions).forEach(([key, val]) => {
    metrics.addDimension(key, val);
  });
  metrics.addMetric(metricName, unit, value);
  metrics.publishStoredMetrics();
};

/**
 * Helper para logging de operaciones de DB
 */
export const logDbOperation = (operation, tableName, params = {}) => {
  logger.debug('DynamoDB operation', {
    operation,
    tableName,
    ...params,
  });
};
