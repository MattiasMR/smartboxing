import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock de las dependencias externas
vi.mock('../../lib/obs.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    addContext: vi.fn(),
    appendKeys: vi.fn(),
  },
  metrics: {
    addMetric: vi.fn(),
    addDimension: vi.fn(),
    publishStoredMetrics: vi.fn(),
  },
  MetricUnit: {
    Count: 'Count',
    Milliseconds: 'Milliseconds',
  },
}));

vi.mock('../../lib/chaos.js', () => ({
  injectChaos: vi.fn(),
  getChaosStats: vi.fn(() => ({
    enabled: false,
    allowedInEnvironment: true,
    stage: 'dev',
    config: {
      errorRate: 0.1,
      latencyRate: 0.1,
      latencyMs: 2000,
    },
  })),
  SLO_CONFIG: {
    errorBudget: { target: 0.99, window: '30d' },
    latency: { p50Target: 100, p95Target: 500, p99Target: 1000 },
    availability: { target: 0.999, window: '30d' },
  },
}));

describe('Health Handler', () => {
  let main;

  beforeEach(async () => {
    // Reset environment
    process.env.STAGE = 'dev';
    process.env.APP_VERSION = '1.0.0';
    
    // Import handler after mocks are set up
    const module = await import('../health.js');
    main = module.main;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return health status with ok: true', async () => {
    const event = { requestContext: {} };
    const context = { awsRequestId: 'test-123' };

    const response = await main(event, context);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.version).toBe('1.0.0');
    expect(body.stage).toBe('dev');
  });

  it('should return chaos configuration', async () => {
    const event = { requestContext: {} };
    const context = { awsRequestId: 'test-456' };

    const response = await main(event, context);
    const body = JSON.parse(response.body);

    expect(body.chaos).toBeDefined();
    expect(body.chaos.enabled).toBe(false);
    expect(body.chaos.allowedInEnvironment).toBe(true);
  });

  it('should return SLO configuration', async () => {
    const event = { requestContext: {} };
    const context = { awsRequestId: 'test-789' };

    const response = await main(event, context);
    const body = JSON.parse(response.body);

    expect(body.slo).toBeDefined();
    expect(body.slo.errorBudget).toBeDefined();
    expect(body.slo.latency).toBeDefined();
    expect(body.slo.availability).toBeDefined();
    expect(body.slo.errorBudget.target).toBe('99.0%');
    expect(body.slo.latency.p95).toBe('500ms');
  });

  it('should return timestamp', async () => {
    const event = { requestContext: {} };
    const context = { awsRequestId: 'test-ts' };

    const response = await main(event, context);
    const body = JSON.parse(response.body);

    expect(body.ts).toBeDefined();
    expect(typeof body.ts).toBe('number');
  });

  it('should handle warmup events', async () => {
    const event = { source: 'warmup' };
    const context = {};

    const response = await main(event, context);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('warmed up');
  });
});
