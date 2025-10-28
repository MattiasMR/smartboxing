import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

export const logger = new Logger({ serviceName: 'smartboxing' });
export const metrics = new Metrics({ namespace: 'Smartboxing' });
