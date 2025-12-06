#!/usr/bin/env node
/**
 * Script para habilitar/deshabilitar Chaos Engineering
 * 
 * Uso:
 *   node scripts/chaos-toggle.mjs enable   # Habilitar con defaults
 *   node scripts/chaos-toggle.mjs enable --stage=dev --error-rate=0.2 --latency-rate=0.3
 *   node scripts/chaos-toggle.mjs disable --stage=dev  # Deshabilitar
 *   node scripts/chaos-toggle.mjs status --stage=dev   # Ver estado actual
 */

import { LambdaClient, UpdateFunctionConfigurationCommand, GetFunctionConfigurationCommand, ListFunctionsCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});
const SERVICE = 'smartboxing';

// Lista de funciones críticas a actualizar
const CORE_FUNCTIONS = [
  'health',
  'listBoxes',
  'getBox',
  'createBox',
  'updateBox',
  'deleteBox',
  'listStaff',
  'getStaffMember',
  'createStaffMember',
  'updateStaffMember',
  'deleteStaffMember',
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

// Parse stage from arguments or environment
const stageArg = args.find(a => a.startsWith('--stage'));
const STAGE = stageArg ? stageArg.split('=')[1] : (process.env.STAGE || 'dev');

// Validate stage
const ALLOWED_STAGES = ['dev', 'staging'];
if (!ALLOWED_STAGES.includes(STAGE)) {
  console.error(`❌ Error: Stage '${STAGE}' no permitido para chaos engineering.`);
  console.error(`   Solo se permite: ${ALLOWED_STAGES.join(', ')}`);
  console.error('   Para producción, usa el flag --force-prod (no recomendado)');
  process.exit(1);
}

async function enableChaos(errorRate = 0.1, latencyRate = 0.1, latencyMs = 2000) {
  console.log(`🌪️ Habilitando Chaos Engineering en ${STAGE}...`);
  console.log(`   Error Rate: ${(errorRate * 100).toFixed(0)}%`);
  console.log(`   Latency Rate: ${(latencyRate * 100).toFixed(0)}%`);
  console.log(`   Max Latency: ${latencyMs}ms`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const func of CORE_FUNCTIONS) {
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
        STAGE: STAGE, // Asegurar que STAGE está configurado
      };

      await lambda.send(new UpdateFunctionConfigurationCommand({
        FunctionName: functionName,
        Environment: {
          Variables: updatedVars
        }
      }));
      console.log(`✅ ${functionName}`);
      successCount++;
    } catch (error) {
      // Ignorar funciones que no existen
      if (error.name === 'ResourceNotFoundException') {
        console.log(`⏭️  ${functionName} (no existe)`);
      } else {
        console.error(`❌ ${functionName}: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log(`\n🔥 Chaos habilitado! ${successCount} funciones actualizadas.`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} funciones con errores.`);
  }
  console.log('   Verifica con: curl https://<api-url>/health');
}

async function disableChaos() {
  console.log(`🛑 Deshabilitando Chaos Engineering en ${STAGE}...\n`);

  let successCount = 0;

  for (const func of CORE_FUNCTIONS) {
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
      successCount++;
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`⏭️  ${functionName} (no existe)`);
      } else {
        console.error(`❌ ${functionName}: ${error.message}`);
      }
    }
  }

  console.log(`\n✨ Chaos deshabilitado. ${successCount} funciones actualizadas.`);
}

async function checkStatus() {
  console.log(`📊 Estado de Chaos Engineering (${STAGE}):\n`);
  
  const functionName = `${SERVICE}-${STAGE}-health`;
  try {
    const config = await lambda.send(new GetFunctionConfigurationCommand({
      FunctionName: functionName,
    }));

    const env = config.Environment?.Variables || {};
    const enabled = env.CHAOS_ENABLED === 'true';

    if (enabled) {
      console.log('🌪️ CHAOS HABILITADO');
      console.log(`   Stage: ${STAGE}`);
      console.log(`   Error Rate: ${(parseFloat(env.CHAOS_ERROR_RATE || '0.1') * 100).toFixed(0)}%`);
      console.log(`   Latency Rate: ${(parseFloat(env.CHAOS_LATENCY_RATE || '0.1') * 100).toFixed(0)}%`);
      console.log(`   Max Latency: ${env.CHAOS_LATENCY_MS || '2000'}ms`);
    } else {
      console.log(`✅ Chaos deshabilitado en ${STAGE} (modo normal)`);
    }
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.error(`❌ La función ${functionName} no existe. ¿Está desplegado el stack?`);
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Parse arguments
if (command === 'enable') {
  const errorRate = parseFloat(args.find(a => a.startsWith('--error-rate'))?.split('=')[1] || '0.1');
  const latencyRate = parseFloat(args.find(a => a.startsWith('--latency-rate'))?.split('=')[1] || '0.1');
  const latencyMs = parseInt(args.find(a => a.startsWith('--latency-ms'))?.split('=')[1] || '2000', 10);
  
  // Validar rates
  if (errorRate > 0.5) {
    console.warn('⚠️ Error rate muy alto (>50%). Limitando a 0.5');
  }
  if (latencyRate > 0.5) {
    console.warn('⚠️ Latency rate muy alto (>50%). Limitando a 0.5');
  }
  
  await enableChaos(
    Math.min(errorRate, 0.5), 
    Math.min(latencyRate, 0.5), 
    Math.min(latencyMs, 5000)
  );
} else if (command === 'disable') {
  await disableChaos();
} else if (command === 'status') {
  await checkStatus();
} else {
  console.log(`
🌪️ Chaos Engineering Toggle

Uso:
  node scripts/chaos-toggle.mjs enable --stage=dev                    # Habilitar (10% error, 10% latency)
  node scripts/chaos-toggle.mjs enable --stage=dev --error-rate=0.2 --latency-rate=0.3 --latency-ms=3000
  node scripts/chaos-toggle.mjs disable --stage=dev                   # Deshabilitar
  node scripts/chaos-toggle.mjs status --stage=dev                    # Ver estado

Parámetros:
  --stage           Entorno (dev, staging). Prod no permitido por seguridad
  --error-rate      Probabilidad de error (0.0 - 0.5, default: 0.1)
  --latency-rate    Probabilidad de latencia (0.0 - 0.5, default: 0.1)
  --latency-ms      Latencia máxima en ms (default: 2000, max: 5000)

Seguridad:
  - Chaos NO está permitido en producción
  - Los rates están limitados al 50% máximo
  - La latencia está limitada a 5000ms máximo
  `);
  process.exit(1);
}
