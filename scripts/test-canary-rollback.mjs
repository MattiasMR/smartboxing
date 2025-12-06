#!/usr/bin/env node

/**
 * Test Script para Canary Deployment Rollback
 * 
 * Este script permite simular escenarios de fallo para validar el rollback automático
 * del canary deployment. Incluye:
 * - Simulación de errores en funciones Lambda
 * - Inducción de alta latencia
 * - Generación de throttles
 * - Validación de CloudWatch Alarms
 * 
 * Uso:
 *   node scripts/test-canary-rollback.mjs --scenario=errors --function=listBoxes --stage=prod
 *   node scripts/test-canary-rollback.mjs --scenario=latency --function=getBox --stage=prod
 *   node scripts/test-canary-rollback.mjs --scenario=throttle --function=createBox --stage=prod
 *   node scripts/test-canary-rollback.mjs --help
 */

import { LambdaClient, InvokeCommand, UpdateFunctionConfigurationCommand, GetFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Parsear argumentos
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

const scenario = getArg('scenario');
const functionName = getArg('function');
const stage = getArg('stage') || 'dev';
const iterations = parseInt(getArg('iterations') || '10', 10);

// Mostrar ayuda
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧪 Test Script para Canary Deployment Rollback

Uso:
  node scripts/test-canary-rollback.mjs [opciones]

Opciones:
  --scenario=<tipo>       Tipo de test: errors, latency, throttle (requerido)
  --function=<nombre>     Nombre de la función Lambda (requerido)
  --stage=<stage>         Stage de deployment (default: dev)
  --iterations=<num>      Número de invocaciones (default: 10)
  --help, -h              Mostrar esta ayuda

Escenarios:
  errors      Simula errores para disparar CanaryErrorAlarm (>5 errores/2min)
  latency     Simula alta latencia para disparar CanaryLatencyAlarm (p99 >2000ms)
  throttle    Simula throttles para disparar CanaryThrottleAlarm (>5 throttles/2min)

Ejemplos:
  # Test de errores en listBoxes (prod)
  node scripts/test-canary-rollback.mjs --scenario=errors --function=listBoxes --stage=prod

  # Test de latencia en getBox (dev)
  node scripts/test-canary-rollback.mjs --scenario=latency --function=getBox --stage=dev --iterations=15

  # Test de throttles en createBox (prod)
  node scripts/test-canary-rollback.mjs --scenario=throttle --function=createBox --stage=prod

⚠️  IMPORTANTE:
  - Este script es para testing y validación del rollback
  - Ejecutar solo en ambientes controlados
  - Monitorear CloudWatch Alarms durante la ejecución
  - El rollback puede tardar 2-3 minutos en activarse
`);
  process.exit(0);
}

// Validar argumentos requeridos
if (!scenario || !functionName) {
  console.error('❌ Error: --scenario y --function son requeridos');
  console.error('Ejecuta con --help para ver opciones disponibles');
  process.exit(1);
}

const validScenarios = ['errors', 'latency', 'throttle'];
if (!validScenarios.includes(scenario)) {
  console.error(`❌ Error: Scenario inválido "${scenario}". Debe ser: ${validScenarios.join(', ')}`);
  process.exit(1);
}

// Clientes AWS
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });

/**
 * Obtiene el nombre completo de la función Lambda
 */
function getLambdaFunctionName(name, stage) {
  return `smartboxing-${stage}-${name}`;
}

/**
 * Activa el modo chaos en la función Lambda
 */
async function enableChaosMode(functionName, chaosType, chaosRate = 100) {
  console.log(`🌪️  Activando chaos mode en ${functionName}...`);
  console.log(`   Tipo: ${chaosType}, Rate: ${chaosRate}%`);
  
  try {
    const command = new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Environment: {
        Variables: {
          CHAOS_ENABLED: 'true',
          CHAOS_TYPE: chaosType,
          CHAOS_RATE: chaosRate.toString()
        }
      }
    });
    
    await lambdaClient.send(command);
    console.log('✅ Chaos mode activado');
    
    // Esperar a que la configuración se propague
    console.log('⏳ Esperando 5 segundos para que se propague la configuración...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (error) {
    console.error('❌ Error activando chaos mode:', error.message);
    throw error;
  }
}

/**
 * Desactiva el modo chaos en la función Lambda
 */
async function disableChaosMode(functionName) {
  console.log(`🔧 Desactivando chaos mode en ${functionName}...`);
  
  try {
    // Primero obtener las variables actuales
    const getCommand = new GetFunctionConfigurationCommand({
      FunctionName: functionName
    });
    const currentConfig = await lambdaClient.send(getCommand);
    
    // Remover variables de chaos
    const currentVars = currentConfig.Environment?.Variables || {};
    delete currentVars.CHAOS_ENABLED;
    delete currentVars.CHAOS_TYPE;
    delete currentVars.CHAOS_RATE;
    
    const updateCommand = new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Environment: {
        Variables: currentVars
      }
    });
    
    await lambdaClient.send(updateCommand);
    console.log('✅ Chaos mode desactivado');
  } catch (error) {
    console.error('❌ Error desactivando chaos mode:', error.message);
    throw error;
  }
}

/**
 * Invoca la función Lambda múltiples veces
 */
async function invokeLambdaMultipleTimes(functionName, iterations) {
  console.log(`\n🚀 Invocando ${functionName} ${iterations} veces...`);
  
  const results = {
    success: 0,
    errors: 0,
    throttles: 0,
    totalLatency: 0
  };
  
  for (let i = 1; i <= iterations; i++) {
    try {
      const startTime = Date.now();
      
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/test',
          headers: {},
          queryStringParameters: {}
        })
      });
      
      const response = await lambdaClient.send(command);
      const latency = Date.now() - startTime;
      results.totalLatency += latency;
      
      if (response.FunctionError) {
        results.errors++;
        console.log(`   ${i}. ❌ Error (${latency}ms) - ${response.FunctionError}`);
      } else {
        results.success++;
        console.log(`   ${i}. ✅ Success (${latency}ms)`);
      }
      
      // Pequeña pausa entre invocaciones
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      if (error.name === 'TooManyRequestsException') {
        results.throttles++;
        console.log(`   ${i}. ⚠️  Throttled`);
      } else {
        results.errors++;
        console.log(`   ${i}. ❌ Error - ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * Verifica el estado de las alarmas de CloudWatch
 */
async function checkAlarms(stage) {
  console.log(`\n📊 Verificando estado de CloudWatch Alarms...`);
  
  try {
    const command = new DescribeAlarmsCommand({
      AlarmNames: [
        `smartboxing-${stage}-CanaryErrorAlarm`,
        `smartboxing-${stage}-CanaryLatencyAlarm`,
        `smartboxing-${stage}-CanaryThrottleAlarm`
      ]
    });
    
    const response = await cloudWatchClient.send(command);
    
    if (response.MetricAlarms && response.MetricAlarms.length > 0) {
      response.MetricAlarms.forEach(alarm => {
        const stateEmoji = alarm.StateValue === 'ALARM' ? '🔴' : 
                          alarm.StateValue === 'OK' ? '🟢' : '🟡';
        console.log(`   ${stateEmoji} ${alarm.AlarmName}: ${alarm.StateValue}`);
        if (alarm.StateReason) {
          console.log(`      Razón: ${alarm.StateReason}`);
        }
      });
    } else {
      console.log('   ⚠️  No se encontraron alarmas configuradas');
    }
  } catch (error) {
    console.error('❌ Error verificando alarmas:', error.message);
  }
}

/**
 * Ejecuta el test según el escenario
 */
async function runTest() {
  const fullFunctionName = getLambdaFunctionName(functionName, stage);
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🧪 TEST DE CANARY DEPLOYMENT ROLLBACK                        ║
╚════════════════════════════════════════════════════════════════╝

Configuración:
  • Escenario: ${scenario}
  • Función: ${fullFunctionName}
  • Stage: ${stage}
  • Iteraciones: ${iterations}
  • Region: ${AWS_REGION}
`);
  
  try {
    // Configurar chaos según el escenario
    let chaosType;
    switch (scenario) {
      case 'errors':
        chaosType = 'exception';
        console.log('🎯 Objetivo: Disparar CanaryErrorAlarm (>5 errores/2min)\n');
        break;
      case 'latency':
        chaosType = 'latency';
        console.log('🎯 Objetivo: Disparar CanaryLatencyAlarm (p99 >2000ms)\n');
        break;
      case 'throttle':
        chaosType = 'throttle';
        console.log('🎯 Objetivo: Disparar CanaryThrottleAlarm (>5 throttles/2min)\n');
        break;
    }
    
    // Activar chaos mode
    await enableChaosMode(fullFunctionName, chaosType, 100);
    
    // Ejecutar invocaciones
    const results = await invokeLambdaMultipleTimes(fullFunctionName, iterations);
    
    // Mostrar resultados
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  📊 RESULTADOS                                                 ║
╚════════════════════════════════════════════════════════════════╝

  ✅ Exitosas:     ${results.success}
  ❌ Errores:       ${results.errors}
  ⚠️  Throttles:    ${results.throttles}
  ⏱️  Latencia avg: ${Math.round(results.totalLatency / iterations)}ms
`);
    
    // Verificar alarmas
    await checkAlarms(stage);
    
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  ⏳ PRÓXIMOS PASOS                                            ║
╚════════════════════════════════════════════════════════════════╝

1. Espera 2-3 minutos para que las métricas se propaguen a CloudWatch
2. Verifica las alarmas en la consola de CloudWatch
3. Si se dispara una alarma durante un canary deployment, CodeDeploy 
   ejecutará rollback automático
4. Monitorea el deployment con: node scripts/canary-monitor.mjs --stage=${stage}
5. Revisa tu email (${stage === 'prod' ? 'milan.munoz@udd.cl' : 'configurado'}) para notificaciones SNS

⚠️  IMPORTANTE: No olvides desactivar chaos mode después del test
`);
    
    // Preguntar si desactivar chaos mode
    console.log('🔧 Desactivando chaos mode automáticamente...');
    await disableChaosMode(fullFunctionName);
    
    console.log('\n✅ Test completado exitosamente\n');
    
  } catch (error) {
    console.error('\n❌ Error durante el test:', error.message);
    
    // Intentar desactivar chaos mode en caso de error
    try {
      console.log('\n🔧 Intentando desactivar chaos mode...');
      await disableChaosMode(fullFunctionName);
    } catch (cleanupError) {
      console.error('❌ Error limpiando configuración:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Ejecutar el test
runTest();
