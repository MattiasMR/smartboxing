// test canario
import { handler } from '../lib/http.js';
import { getChaosStats } from '../lib/chaos.js';

export const main = handler(async () => {
  const chaos = getChaosStats();
  
  return {
    ok: true,
    ts: Date.now(),
    version: '1.0.0',
    chaos: chaos.enabled ? {
      enabled: true,
      errorRate: `${(chaos.errorRate * 100).toFixed(0)}%`,
      latencyRate: `${(chaos.latencyRate * 100).toFixed(0)}%`,
      maxLatency: `${chaos.latencyMs}ms`
    } : {
      enabled: false
    }
  };
});

