/**
 * Chaos Engineering Middleware
 * Inyecta fallas aleatorias para testing de resiliencia
 * 
 * Configuración vía variables de entorno:
 * - CHAOS_ENABLED: 'true' para habilitar (default: false)
 * - CHAOS_ERROR_RATE: Probabilidad de error (0.0 - 1.0, default: 0.1 = 10%)
 * - CHAOS_LATENCY_RATE: Probabilidad de latencia (0.0 - 1.0, default: 0.1)
 * - CHAOS_LATENCY_MS: Latencia en milisegundos (default: 2000)
 */

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Chaos middleware - ejecutar antes de la lógica del handler
 */
export const injectChaos = async () => {
  // Leer variables de entorno en runtime para que Lambda updates funcionen
  const CHAOS_ENABLED = process.env.CHAOS_ENABLED === 'true';
  const ERROR_RATE = parseFloat(process.env.CHAOS_ERROR_RATE || '0.1');
  const LATENCY_RATE = parseFloat(process.env.CHAOS_LATENCY_RATE || '0.1');
  const LATENCY_MS = parseInt(process.env.CHAOS_LATENCY_MS || '2000', 10);

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
 * Chaos stats para métricas
 */
export const getChaosStats = () => {
  // Leer en runtime para reflejar valores actuales
  const CHAOS_ENABLED = process.env.CHAOS_ENABLED === 'true';
  const ERROR_RATE = parseFloat(process.env.CHAOS_ERROR_RATE || '0.1');
  const LATENCY_RATE = parseFloat(process.env.CHAOS_LATENCY_RATE || '0.1');
  const LATENCY_MS = parseInt(process.env.CHAOS_LATENCY_MS || '2000', 10);
  
  return {
    enabled: CHAOS_ENABLED,
    errorRate: ERROR_RATE,
    latencyRate: LATENCY_RATE,
    latencyMs: LATENCY_MS,
  };
};
