/**
 * Warm-up handler para mantener las Lambdas activas
 * Se ejecuta cada 5 minutos para evitar cold starts
 */

import { handler } from '../lib/http.js';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});

// Lista de funciones críticas a mantener calientes
const CRITICAL_FUNCTIONS = [
  'smartboxing-dev-listBoxes',
  'smartboxing-dev-listStaff',
  'smartboxing-dev-listAppointments',
  'smartboxing-dev-getDashboard',
  'smartboxing-dev-getClientSettings',
  'smartboxing-dev-getUserSettings',
];

export const main = handler(async (event) => {
  // Si es invocación programada de EventBridge
  if (event.source === 'aws.events') {
    console.log('🔥 Warming up critical Lambda functions...');
    
    const results = await Promise.allSettled(
      CRITICAL_FUNCTIONS.map(async (functionName) => {
        try {
          const command = new InvokeCommand({
            FunctionName: functionName,
            InvocationType: 'Event', // Asíncrono, no esperar respuesta
            Payload: JSON.stringify({ source: 'warmup' }),
          });
          
          await lambda.send(command);
          console.log(`✅ Warmed up: ${functionName}`);
          return { functionName, status: 'success' };
        } catch (error) {
          console.error(`❌ Failed to warm up ${functionName}:`, error.message);
          return { functionName, status: 'failed', error: error.message };
        }
      })
    );
    
    const summary = {
      total: CRITICAL_FUNCTIONS.length,
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
    };
    
    console.log('📊 Warm-up summary:', summary);
    
    return {
      message: 'Warm-up completed',
      summary,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Si es invocación manual
  return {
    message: 'Warm-up function ready',
    criticalFunctions: CRITICAL_FUNCTIONS,
  };
});
