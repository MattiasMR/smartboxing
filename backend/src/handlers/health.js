// Health check endpoint con estadísticas del sistema
import { handler } from '../lib/http.js';
import { getChaosStats, SLO_CONFIG } from '../lib/chaos.js';
import { logger } from '../lib/obs.js';

export const main = handler(async () => {
  const chaos = getChaosStats();
  
  logger.info('Health check performed', {
    chaosEnabled: chaos.enabled,
    stage: chaos.stage,
  });
  
  return {
    ok: true,
    ts: Date.now(),
    version: process.env.APP_VERSION || '1.0.0',
    stage: process.env.STAGE || 'dev',
    // Información de Chaos Engineering
    chaos: chaos.enabled ? {
      enabled: true,
      stage: chaos.stage,
      allowedInEnvironment: chaos.allowedInEnvironment,
      config: {
        errorRate: `${(chaos.config.errorRate * 100).toFixed(0)}%`,
        latencyRate: `${(chaos.config.latencyRate * 100).toFixed(0)}%`,
        maxLatency: `${chaos.config.latencyMs}ms`,
      },
    } : {
      enabled: false,
      allowedInEnvironment: chaos.allowedInEnvironment,
      stage: chaos.stage,
    },
    // SLO/SLI Targets (para dashboards y monitoreo)
    slo: {
      errorBudget: {
        target: `${(SLO_CONFIG.errorBudget.target * 100).toFixed(1)}%`,
        window: SLO_CONFIG.errorBudget.window,
      },
      latency: {
        p50: `${SLO_CONFIG.latency.p50Target}ms`,
        p95: `${SLO_CONFIG.latency.p95Target}ms`,
        p99: `${SLO_CONFIG.latency.p99Target}ms`,
      },
      availability: {
        target: `${(SLO_CONFIG.availability.target * 100).toFixed(1)}%`,
        window: SLO_CONFIG.availability.window,
      },
    },
  };
}, 'health');

