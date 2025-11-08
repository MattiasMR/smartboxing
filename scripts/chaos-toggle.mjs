#!/usr/bin/env node
/**
 * Script para habilitar/deshabilitar Chaos Engineering
 * 
 * Uso:
 *   node scripts/chaos-toggle.mjs enable   # Habilitar con defaults
 *   node scripts/chaos-toggle.mjs enable --error-rate 0.2 --latency-rate 0.3
 *   node scripts/chaos-toggle.mjs disable  # Deshabilitar
 *   node scripts/chaos-toggle.mjs status   # Ver estado actual
 */

import { LambdaClient, UpdateFunctionConfigurationCommand, GetFunctionConfigurationCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});
const STAGE = process.env.STAGE || 'dev';
const SERVICE = 'smartboxing';

// Lista de funciones a actualizar
const FUNCTIONS = [
  'listBoxes',
  'getBox',
  'createBox',
  'updateBox',
  'deleteBox',
  'listDoctors',
  'getDoctor',
  'createDoctor',
  'updateDoctor',
  'deleteDoctor',
  'listAppointments',
  'getAppointment',
  'createAppointment',
  'updateAppointment',
  'deleteAppointment',
  'getClientSettings',
  'updateClientSettings',
  'getUserSettings',
  'updateUserSettings',
  'getDashboard',
];

const args = process.argv.slice(2);
const command = args[0];

async function enableChaos(errorRate = 0.1, latencyRate = 0.1, latencyMs = 2000) {
  console.log('🌪️ Habilitando Chaos Engineering...');
  console.log(`   Error Rate: ${(errorRate * 100).toFixed(0)}%`);
  console.log(`   Latency Rate: ${(latencyRate * 100).toFixed(0)}%`);
  console.log(`   Max Latency: ${latencyMs}ms`);
  console.log('');

  for (const func of FUNCTIONS) {
    const functionName = `${SERVICE}-${STAGE}-${func}`;
    try {
      // Leer variables existentes para no sobrescribirlas
      const currentConfig = await lambda.send(new GetFunctionConfigurationCommand({
        FunctionName: functionName
      }));

      const updatedVars = {
        ...(currentConfig.Environment?.Variables || {}),
        CHAOS_ENABLED: 'true',
        CHAOS_ERROR_RATE: errorRate.toString(),
        CHAOS_LATENCY_RATE: latencyRate.toString(),
        CHAOS_LATENCY_MS: latencyMs.toString(),
      };

      await lambda.send(new UpdateFunctionConfigurationCommand({
        FunctionName: functionName,
        Environment: {
          Variables: updatedVars
        }
      }));
      console.log(`✅ ${functionName}`);
    } catch (error) {
      console.error(`❌ ${functionName}: ${error.message}`);
    }
  }

  console.log('\n🔥 Chaos habilitado! Las Lambdas ahora inyectarán fallas aleatorias.');
  console.log('   Verifica con: curl https://<api-url>/health');
}

async function disableChaos() {
  console.log('🛑 Deshabilitando Chaos Engineering...\n');

  for (const func of FUNCTIONS) {
    const functionName = `${SERVICE}-${STAGE}-${func}`;
    try {
      // Leer variables existentes para no sobrescribirlas
      const currentConfig = await lambda.send(new GetFunctionConfigurationCommand({
        FunctionName: functionName
      }));

      const updatedVars = {
        ...(currentConfig.Environment?.Variables || {}),
        CHAOS_ENABLED: 'false',
      };
      
      // Eliminar variables de chaos si existen (opcional - para limpiar)
      delete updatedVars.CHAOS_ERROR_RATE;
      delete updatedVars.CHAOS_LATENCY_RATE;
      delete updatedVars.CHAOS_LATENCY_MS;

      await lambda.send(new UpdateFunctionConfigurationCommand({
        FunctionName: functionName,
        Environment: {
          Variables: updatedVars
        }
      }));
      console.log(`✅ ${functionName}`);
    } catch (error) {
      console.error(`❌ ${functionName}: ${error.message}`);
    }
  }

  console.log('\n✨ Chaos deshabilitado. Sistema operando normalmente.');
}

async function checkStatus() {
  console.log('📊 Estado de Chaos Engineering:\n');
  
  const functionName = `${SERVICE}-${STAGE}-health`;
  try {
    const config = await lambda.send(new GetFunctionConfigurationCommand({
      FunctionName: functionName,
    }));

    const env = config.Environment?.Variables || {};
    const enabled = env.CHAOS_ENABLED === 'true';

    if (enabled) {
      console.log('🌪️ CHAOS HABILITADO');
      console.log(`   Error Rate: ${(parseFloat(env.CHAOS_ERROR_RATE || '0.1') * 100).toFixed(0)}%`);
      console.log(`   Latency Rate: ${(parseFloat(env.CHAOS_LATENCY_RATE || '0.1') * 100).toFixed(0)}%`);
      console.log(`   Max Latency: ${env.CHAOS_LATENCY_MS || '2000'}ms`);
    } else {
      console.log('✅ Chaos deshabilitado (modo normal)');
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Parse arguments
if (command === 'enable') {
  const errorRate = parseFloat(args.find(a => a.startsWith('--error-rate'))?.split('=')[1] || '0.1');
  const latencyRate = parseFloat(args.find(a => a.startsWith('--latency-rate'))?.split('=')[1] || '0.1');
  const latencyMs = parseInt(args.find(a => a.startsWith('--latency-ms'))?.split('=')[1] || '2000', 10);
  
  await enableChaos(errorRate, latencyRate, latencyMs);
} else if (command === 'disable') {
  await disableChaos();
} else if (command === 'status') {
  await checkStatus();
} else {
  console.log(`
🌪️ Chaos Engineering Toggle

Uso:
  node scripts/chaos-toggle.mjs enable               # Habilitar (10% error, 10% latency)
  node scripts/chaos-toggle.mjs enable --error-rate=0.8 --latency-rate=0.3 --latency-ms=3000
  node scripts/chaos-toggle.mjs disable              # Deshabilitar
  node scripts/chaos-toggle.mjs status               # Ver estado

Parámetros:
  --error-rate      Probabilidad de error (0.0 - 1.0, default: 0.1)
  --latency-rate    Probabilidad de latencia (0.0 - 1.0, default: 0.1)
  --latency-ms      Latencia máxima en ms (default: 2000)
  `);
  process.exit(1);
}
