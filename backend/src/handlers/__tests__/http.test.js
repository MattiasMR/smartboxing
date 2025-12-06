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
}));

import { handler, ok, fail, parseBody } from '../../lib/http.js';

describe('HTTP Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STAGE = 'dev';
    delete process.env.ALLOWED_ORIGINS;
  });

  describe('ok response', () => {
    it('should return 200 status with JSON body', () => {
      const data = { message: 'success', items: [1, 2, 3] };
      const response = ok(data);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(response.body)).toEqual(data);
    });

    it('should allow custom status code', () => {
      const response = ok({ created: true }, 201);

      expect(response.statusCode).toBe(201);
    });

    it('should include CORS headers', () => {
      const response = ok({});

      expect(response.headers['Access-Control-Allow-Origin']).toBeDefined();
      expect(response.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(response.headers['Access-Control-Allow-Headers']).toContain('Authorization');
    });

    it('should use wildcard CORS in dev', () => {
      process.env.STAGE = 'dev';
      const response = ok({});

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('fail response', () => {
    it('should return 500 status by default', () => {
      const error = new Error('Something went wrong');
      const response = fail(error);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).message).toBe('Something went wrong');
    });

    it('should use custom status code', () => {
      const error = new Error('Not found');
      const response = fail(error, 404);

      expect(response.statusCode).toBe(404);
    });

    it('should handle null error', () => {
      const response = fail(null);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).message).toBe('Internal Error');
    });

    it('should include stack trace in dev', () => {
      process.env.STAGE = 'dev';
      const error = new Error('Test error');
      const response = fail(error);
      const body = JSON.parse(response.body);

      expect(body.stack).toBeDefined();
    });

    it('should not include stack trace in prod', () => {
      process.env.STAGE = 'prod';
      const error = new Error('Test error');
      const response = fail(error);
      const body = JSON.parse(response.body);

      expect(body.stack).toBeUndefined();
    });
  });

  describe('parseBody', () => {
    it('should parse valid JSON body', () => {
      const event = { body: '{"name": "test", "value": 123}' };
      const result = parseBody(event);

      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return empty object for null body', () => {
      const event = { body: null };
      const result = parseBody(event);

      expect(result).toEqual({});
    });

    it('should return empty object for undefined body', () => {
      const event = {};
      const result = parseBody(event);

      expect(result).toEqual({});
    });

    it('should throw 400 error for invalid JSON', () => {
      const event = { body: 'not valid json' };

      expect(() => parseBody(event)).toThrow('Invalid JSON in request body');
      
      try {
        parseBody(event);
      } catch (error) {
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('handler wrapper', () => {
    it('should wrap logic function and return ok response', async () => {
      const logic = vi.fn().mockResolvedValue({ success: true });
      const wrapped = handler(logic, 'testHandler');

      const event = { requestContext: {} };
      const context = { awsRequestId: 'test-123' };
      const response = await wrapped(event, context);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ success: true });
    });

    it('should handle warmup events', async () => {
      const logic = vi.fn();
      const wrapped = handler(logic, 'testHandler');

      const event = { source: 'warmup' };
      const response = await wrapped(event, {});

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toBe('warmed up');
      expect(logic).not.toHaveBeenCalled();
    });

    it('should return 500 on unhandled errors', async () => {
      const logic = vi.fn().mockRejectedValue(new Error('Unhandled error'));
      const wrapped = handler(logic, 'testHandler');

      const event = { requestContext: {} };
      const context = { awsRequestId: 'test-error' };
      const response = await wrapped(event, context);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).message).toBe('Unhandled error');
    });

    it('should return custom status code from error', async () => {
      const error = new Error('Not found');
      error.statusCode = 404;
      const logic = vi.fn().mockRejectedValue(error);
      const wrapped = handler(logic, 'testHandler');

      const event = { requestContext: {} };
      const response = await wrapped(event, {});

      expect(response.statusCode).toBe(404);
    });
  });
});
