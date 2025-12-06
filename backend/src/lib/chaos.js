/**
 * Chaos Engineering Middleware
 * Inyecta fallas aleatorias para testing de resiliencia
 * 
 * Configuración vía variables de entorno:
 * - CHAOS_ENABLED: 'true' para habilitar (default: false)
 * - CHAOS_ERROR_RATE: Probabilidad de error (0.0 - 1.0, default: 0.1 = 10%)
 * - CHAOS_LATENCY_RATE: Probabilidad de latencia (0.0 - 1.0, default: 0.1)
 * - CHAOS_LATENCY_MS: Latencia en milisegundos (default: 2000)
 * - STAGE: El entorno actual (dev, staging, prod)
 * 
 * SEGURIDAD: Chaos está DESHABILITADO en producción por defecto
 * Para habilitar en prod, se requiere CHAOS_FORCE_PROD=true
 */

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Verifica si el chaos está permitido en el entorno actual
 */
const isChaosAllowedInEnvironment = () => {
  const stage = process.env.STAGE || 'dev';
  const forceProd = process.env.CHAOS_FORCE_PROD === 'true';
  
  // En producción, solo permitir si CHAOS_FORCE_PROD está explícitamente habilitado
  if (stage === 'prod' && !forceProd) {
    return false;
  }
  
  return true;
};

/**
 * Obtiene la configuración de chaos desde variables de entorno
 */
const getChaosConfig = () => {
  const CHAOS_ENABLED = process.env.CHAOS_ENABLED === 'true';
  const ERROR_RATE = Math.min(1, Math.max(0, parseFloat(process.env.CHAOS_ERROR_RATE || '0.1')));
  const LATENCY_RATE = Math.min(1, Math.max(0, parseFloat(process.env.CHAOS_LATENCY_RATE || '0.1')));
  const LATENCY_MS = Math.min(10000, Math.max(100, parseInt(process.env.CHAOS_LATENCY_MS || '2000', 10)));
  
  return { CHAOS_ENABLED, ERROR_RATE, LATENCY_RATE, LATENCY_MS };
};

/**
 * Chaos middleware - ejecutar antes de la lógica del handler
 */
export const injectChaos = async () => {
  // Verificar si el entorno permite chaos
  if (!isChaosAllowedInEnvironment()) {
    return;
  }
  
  const { CHAOS_ENABLED, ERROR_RATE, LATENCY_RATE, LATENCY_MS } = getChaosConfig();
  
  if (!CHAOS_ENABLED) return;

  // 🔥 Inyectar Error Aleatorio
  const errorRandom = Math.random();
  if (errorRandom < ERROR_RATE) {
    const errors = [
      { code: 500, message: 'Chaos: Simulated Internal Server Error' },
      { code: 503, message: 'Chaos: Simulated Service Unavailable' },
      { code: 504, message: 'Chaos: Simulated Gateway Timeout' },
    ];
    const error = errors[Math.floor(Math.random() * errors.length)];
    
    console.error(`🔥 CHAOS: Injecting error ${error.code} - ${error.message}`);
    
    const err = new Error(error.message);
    err.statusCode = error.code;
    err.isChaosInjected = true; // Flag para identificar errores de chaos
    throw err;
  }

  // ⏱️ Inyectar Latencia (usar diferente random)
  const latencyRandom = Math.random();
  if (latencyRandom < LATENCY_RATE) {
    const delay = Math.floor(Math.random() * LATENCY_MS) + 500; // Random entre 500ms y LATENCY_MS
    console.warn(`⏱️ CHAOS: Injecting ${delay}ms latency`);
    await sleep(delay);
  }
};

/**
 * Chaos stats para métricas y endpoint /health
 */
export const getChaosStats = () => {
  const isAllowed = isChaosAllowedInEnvironment();
  const { CHAOS_ENABLED, ERROR_RATE, LATENCY_RATE, LATENCY_MS } = getChaosConfig();
  
  return {
    enabled: isAllowed && CHAOS_ENABLED,
    allowedInEnvironment: isAllowed,
    stage: process.env.STAGE || 'dev',
    config: {
      errorRate: ERROR_RATE,
      latencyRate: LATENCY_RATE,
      latencyMs: LATENCY_MS,
    },
  };
};

/**
 * SLO/SLI Configuration
 * Define los objetivos de nivel de servicio para monitoreo
 */
export const SLO_CONFIG = {
  // Error Budget: Máximo 1% de errores permitidos
  errorBudget: {
    target: 0.99, // 99% de requests exitosos
    window: '30d', // Ventana de medición
  },
  
  // Latencia: P95 debe estar bajo 500ms
  latency: {
    p50Target: 100, // 50th percentile: 100ms
    p95Target: 500, // 95th percentile: 500ms
    p99Target: 1000, // 99th percentile: 1000ms
  },
  
  // Disponibilidad: 99.9% uptime
  availability: {
    target: 0.999, // 99.9%
    window: '30d',
  },
};

/**
 * Helper para evaluar si el chaos experiment fue exitoso
 * basado en los SLOs definidos
 */
export const evaluateChaosExperiment = (metrics) => {
  const { errorRate, p95Latency, availability } = metrics;
  
  const results = {
    passed: true,
    violations: [],
  };
  
  if (errorRate > (1 - SLO_CONFIG.errorBudget.target)) {
    results.passed = false;
    results.violations.push({
      slo: 'errorBudget',
      expected: `<${(1 - SLO_CONFIG.errorBudget.target) * 100}%`,
      actual: `${(errorRate * 100).toFixed(2)}%`,
    });
  }
  
  if (p95Latency > SLO_CONFIG.latency.p95Target) {
    results.passed = false;
    results.violations.push({
      slo: 'latency.p95',
      expected: `<${SLO_CONFIG.latency.p95Target}ms`,
      actual: `${p95Latency}ms`,
    });
  }
  
  if (availability < SLO_CONFIG.availability.target) {
    results.passed = false;
    results.violations.push({
      slo: 'availability',
      expected: `>${SLO_CONFIG.availability.target * 100}%`,
      actual: `${(availability * 100).toFixed(2)}%`,
    });
  }
  
  return results;
};
