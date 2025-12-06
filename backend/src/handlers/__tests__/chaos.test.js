import { describe, it, expect, vi, beforeEach } from 'vitest';
import { injectChaos, getChaosStats, SLO_CONFIG, evaluateChaosExperiment } from '../../lib/chaos.js';

describe('Chaos Engineering Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.CHAOS_ENABLED;
    delete process.env.CHAOS_ERROR_RATE;
    delete process.env.CHAOS_LATENCY_RATE;
    delete process.env.CHAOS_LATENCY_MS;
    delete process.env.STAGE;
    delete process.env.CHAOS_FORCE_PROD;
  });

  describe('injectChaos', () => {
    it('should not inject chaos when CHAOS_ENABLED is false', async () => {
      process.env.CHAOS_ENABLED = 'false';
      
      // Should not throw any error
      await expect(injectChaos()).resolves.toBeUndefined();
    });

    it('should not inject chaos when not set', async () => {
      // CHAOS_ENABLED not set
      await expect(injectChaos()).resolves.toBeUndefined();
    });

    it('should not inject chaos in production without CHAOS_FORCE_PROD', async () => {
      process.env.STAGE = 'prod';
      process.env.CHAOS_ENABLED = 'true';
      process.env.CHAOS_ERROR_RATE = '1.0'; // 100% error rate
      
      // Should not throw even with 100% error rate
      await expect(injectChaos()).resolves.toBeUndefined();
    });

    it('should inject chaos in production with CHAOS_FORCE_PROD', async () => {
      process.env.STAGE = 'prod';
      process.env.CHAOS_ENABLED = 'true';
      process.env.CHAOS_FORCE_PROD = 'true';
      process.env.CHAOS_ERROR_RATE = '1.0'; // 100% error rate
      
      // Should throw with 100% error rate
      await expect(injectChaos()).rejects.toThrow('Chaos:');
    });

    it('should inject error when CHAOS_ENABLED and error rate triggers', async () => {
      process.env.STAGE = 'dev';
      process.env.CHAOS_ENABLED = 'true';
      process.env.CHAOS_ERROR_RATE = '1.0'; // 100% error rate
      process.env.CHAOS_LATENCY_RATE = '0'; // No latency
      
      await expect(injectChaos()).rejects.toThrow('Chaos:');
    });

    it('should set isChaosInjected flag on chaos errors', async () => {
      process.env.STAGE = 'dev';
      process.env.CHAOS_ENABLED = 'true';
      process.env.CHAOS_ERROR_RATE = '1.0';
      process.env.CHAOS_LATENCY_RATE = '0';
      
      try {
        await injectChaos();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.isChaosInjected).toBe(true);
      }
    });
  });

  describe('getChaosStats', () => {
    it('should return chaos stats with defaults', () => {
      const stats = getChaosStats();
      
      expect(stats.enabled).toBe(false);
      expect(stats.allowedInEnvironment).toBe(true);
      expect(stats.stage).toBe('dev');
      expect(stats.config.errorRate).toBe(0.1);
      expect(stats.config.latencyRate).toBe(0.1);
      expect(stats.config.latencyMs).toBe(2000);
    });

    it('should reflect environment configuration', () => {
      process.env.STAGE = 'staging';
      process.env.CHAOS_ENABLED = 'true';
      process.env.CHAOS_ERROR_RATE = '0.25';
      process.env.CHAOS_LATENCY_RATE = '0.5';
      process.env.CHAOS_LATENCY_MS = '3000';
      
      const stats = getChaosStats();
      
      expect(stats.enabled).toBe(true);
      expect(stats.stage).toBe('staging');
      expect(stats.config.errorRate).toBe(0.25);
      expect(stats.config.latencyRate).toBe(0.5);
      expect(stats.config.latencyMs).toBe(3000);
    });

    it('should show chaos disabled in prod without force flag', () => {
      process.env.STAGE = 'prod';
      process.env.CHAOS_ENABLED = 'true';
      
      const stats = getChaosStats();
      
      expect(stats.enabled).toBe(false);
      expect(stats.allowedInEnvironment).toBe(false);
    });

    it('should clamp error rate between 0 and 1', () => {
      process.env.CHAOS_ERROR_RATE = '2.5'; // Over 1
      
      const stats = getChaosStats();
      
      expect(stats.config.errorRate).toBe(1);
    });

    it('should clamp latency ms between 100 and 10000', () => {
      process.env.CHAOS_LATENCY_MS = '50000'; // Over 10000
      
      const stats = getChaosStats();
      
      expect(stats.config.latencyMs).toBe(10000);
    });
  });

  describe('SLO_CONFIG', () => {
    it('should have error budget configuration', () => {
      expect(SLO_CONFIG.errorBudget.target).toBe(0.99);
      expect(SLO_CONFIG.errorBudget.window).toBe('30d');
    });

    it('should have latency targets', () => {
      expect(SLO_CONFIG.latency.p50Target).toBe(100);
      expect(SLO_CONFIG.latency.p95Target).toBe(500);
      expect(SLO_CONFIG.latency.p99Target).toBe(1000);
    });

    it('should have availability target', () => {
      expect(SLO_CONFIG.availability.target).toBe(0.999);
    });
  });

  describe('evaluateChaosExperiment', () => {
    it('should pass when all SLOs are met', () => {
      const metrics = {
        errorRate: 0.005, // 0.5% errors (under 1%)
        p95Latency: 400, // 400ms (under 500ms)
        availability: 0.9995, // 99.95% (over 99.9%)
      };
      
      const result = evaluateChaosExperiment(metrics);
      
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when error budget is exceeded', () => {
      const metrics = {
        errorRate: 0.02, // 2% errors (over 1%)
        p95Latency: 400,
        availability: 0.9995,
      };
      
      const result = evaluateChaosExperiment(metrics);
      
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.slo === 'errorBudget')).toBe(true);
    });

    it('should fail when latency exceeds p95 target', () => {
      const metrics = {
        errorRate: 0.005,
        p95Latency: 750, // 750ms (over 500ms)
        availability: 0.9995,
      };
      
      const result = evaluateChaosExperiment(metrics);
      
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.slo === 'latency.p95')).toBe(true);
    });

    it('should fail when availability is below target', () => {
      const metrics = {
        errorRate: 0.005,
        p95Latency: 400,
        availability: 0.99, // 99% (under 99.9%)
      };
      
      const result = evaluateChaosExperiment(metrics);
      
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.slo === 'availability')).toBe(true);
    });

    it('should report multiple violations', () => {
      const metrics = {
        errorRate: 0.05, // 5% errors
        p95Latency: 1200, // 1200ms
        availability: 0.95, // 95%
      };
      
      const result = evaluateChaosExperiment(metrics);
      
      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(3);
    });
  });
});
