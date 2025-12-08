#!/usr/bin/env node

/**
 * SmartBoxing - Canary Deployment CLI
 * 
 * Este script permite gestionar despliegues Canary usando Feature Flags.
 * 
 * Conceptos de Canary Deployment:
 * ───────────────────────────────
 * 1. CREAR FEATURE FLAG: Define una nueva funcionalidad con rollout 0%
 * 2. CANARY (10%): Despliega a un pequeño porcentaje de usuarios
 * 3. INCREMENTAR (50%): Si todo va bien, aumenta el rollout
 * 4. FULL ROLLOUT (100%): Despliega a todos los usuarios
 * 5. ROLLBACK (0%): Si hay errores, vuelve al estado anterior
 * 
 * Uso:
 *   node scripts/canary-deploy.mjs status
 *   node scripts/canary-deploy.mjs create <flagName> [description]
 *   node scripts/canary-deploy.mjs rollout <flagName> <percentage>
 *   node scripts/canary-deploy.mjs rollback <flagName>
 *   node scripts/canary-deploy.mjs evaluate <flagName> [userId]
 *   node scripts/canary-deploy.mjs demo
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const STAGE = process.env.STAGE || 'prod';
const FEATURE_FLAGS_TABLE = `smartboxing-${STAGE}-feature-flags`;

const client = new DynamoDBClient({ region: REGION });
const doc = DynamoDBDocumentClient.from(client);

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function printHeader() {
  console.log('');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        SmartBoxing - Canary Deployment Manager          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
  log(`  Stage: ${STAGE}`, 'dim');
  log(`  Table: ${FEATURE_FLAGS_TABLE}`, 'dim');
  console.log('');
}

function printHelp() {
  console.log(`
  ${colors.yellow}Comandos disponibles:${colors.reset}

    ${colors.green}status${colors.reset}                         Lista todos los feature flags
    ${colors.green}create${colors.reset} <name> [description]   Crea un nuevo feature flag (0%)
    ${colors.green}rollout${colors.reset} <name> <percentage>    Ajusta el porcentaje de rollout
    ${colors.green}rollback${colors.reset} <name>                Hace rollback a 0% (deshabilitado)
    ${colors.green}evaluate${colors.reset} <name> [userId]       Evalúa si un usuario ve la feature
    ${colors.green}demo${colors.reset}                           Ejecuta una demostración completa

  ${colors.yellow}Ejemplos:${colors.reset}

    ${colors.dim}# Crear un nuevo feature flag${colors.reset}
    node scripts/canary-deploy.mjs create new-dashboard-v2 "Nueva versión del dashboard"

    ${colors.dim}# Despliegue Canary: empezar con 10%${colors.reset}
    node scripts/canary-deploy.mjs rollout new-dashboard-v2 10

    ${colors.dim}# Si todo va bien, aumentar a 50%${colors.reset}
    node scripts/canary-deploy.mjs rollout new-dashboard-v2 50

    ${colors.dim}# Full rollout: 100%${colors.reset}
    node scripts/canary-deploy.mjs rollout new-dashboard-v2 100

    ${colors.dim}# Si hay errores, rollback${colors.reset}
    node scripts/canary-deploy.mjs rollback new-dashboard-v2
  `);
}

async function getStatus() {
  log('Estado de Feature Flags', 'yellow');
  log('────────────────────────────────────────', 'dim');
  
  try {
    const result = await doc.send(new ScanCommand({
      TableName: FEATURE_FLAGS_TABLE
    }));
    
    if (!result.Items || result.Items.length === 0) {
      log('  No hay feature flags configurados', 'dim');
      log('  Usa "create" para crear uno nuevo', 'dim');
      return;
    }
    
    for (const flag of result.Items) {
      const status = flag.enabled ? '✅ Activo' : '❌ Deshabilitado';
      const pctBar = getProgressBar(flag.rolloutPercentage || 0);
      
      console.log('');
      log(`     ${flag.flagName}`, 'green');
      log(`     ${flag.description || '(sin descripción)'}`, 'dim');
      log(`     Estado: ${status}`);
      log(`     Rollout: ${pctBar} ${flag.rolloutPercentage || 0}%`);
      if (flag.targetTenants && flag.targetTenants.length > 0) {
        log(`     Tenants: ${flag.targetTenants.join(', ')}`, 'dim');
      }
      log(`     Actualizado: ${flag.updatedAt || 'N/A'}`, 'dim');
    }
    
    console.log('');
  } catch (e) {
    log(`Error: ${e.message}`, 'red');
    if (e.name === 'ResourceNotFoundException') {
      log('La tabla de feature flags no existe. Ejecuta el deploy primero.', 'yellow');
    }
  }
}

function getProgressBar(percentage) {
  const filled = Math.floor(percentage / 10);
  const empty = 10 - filled;
  return `[${colors.green}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(empty)}${colors.reset}]`;
}

async function createFlag(name, description = '') {
  log(`\n  Creando feature flag: ${name}`, 'yellow');
  
  const item = {
    flagName: name,
    description,
    enabled: true,
    rolloutPercentage: 0,
    targetTenants: [],
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'cli-script'
  };
  
  await doc.send(new PutCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Item: item
  }));
  
  log(`   Feature flag '${name}' creado con rollout 0%`, 'green');
  log(`   Usa "rollout ${name} 10" para empezar el Canary deployment`, 'dim');
}

async function updateRollout(name, percentage) {
  const pct = Math.min(100, Math.max(0, parseInt(percentage)));
  
  log(`\n🔄 Actualizando rollout de '${name}' a ${pct}%`, 'yellow');
  
  const result = await doc.send(new UpdateCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Key: { flagName: name },
    UpdateExpression: 'SET rolloutPercentage = :pct, updatedAt = :now, enabled = :enabled',
    ExpressionAttributeValues: {
      ':pct': pct,
      ':now': new Date().toISOString(),
      ':enabled': true
    },
    ReturnValues: 'ALL_NEW'
  }));
  
  if (!result.Attributes) {
    log(`    Feature flag '${name}' no encontrado`, 'red');
    return;
  }
  
  const bar = getProgressBar(pct);
  log(`   ${bar} ${pct}%`, 'green');
  
  if (pct === 100) {
    log(`    ¡Full rollout completado!`, 'green');
  } else if (pct > 0) {
    log(`    Canary deployment activo - monitoreando...`, 'yellow');
  }
}

async function rollback(name) {
  log(`\n Rollback de '${name}'`, 'red');
  
  const result = await doc.send(new UpdateCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Key: { flagName: name },
    UpdateExpression: 'SET rolloutPercentage = :pct, enabled = :enabled, updatedAt = :now, rollbackAt = :rollback',
    ExpressionAttributeValues: {
      ':pct': 0,
      ':enabled': false,
      ':now': new Date().toISOString(),
      ':rollback': new Date().toISOString()
    },
    ReturnValues: 'ALL_NEW'
  }));
  
  if (!result.Attributes) {
    log(`    Feature flag '${name}' no encontrado`, 'red');
    return;
  }
  
  log(`    Rollback completado - feature deshabilitada (0%)`, 'yellow');
  log(`    Los usuarios ahora verán la versión anterior`, 'dim');
}

/**
 * Hash function (djb2) - DEBE coincidir exactamente con backend
 */
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

async function evaluate(name, userId = 'demo-user') {
  log(`\n Evaluando '${name}' para usuario '${userId}'`, 'yellow');
  
  const result = await doc.send(new GetCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Key: { flagName: name }
  }));
  
  if (!result.Item) {
    log(`    Feature flag '${name}' no encontrado`, 'red');
    return;
  }
  
  const flag = result.Item;
  
  if (!flag.enabled) {
    log(`    Feature deshabilitada`, 'dim');
    return;
  }
  
  const percentage = flag.rolloutPercentage || 0;
  const hash = simpleHash(userId + name);
  const bucket = hash % 100;
  const enabled = bucket < percentage;
  
  log(`   Rollout actual: ${percentage}%`);
  log(`   Hash del usuario: ${bucket}`, 'dim');
  log(`   Resultado: ${enabled ? ' SI VE LA NUEVA FEATURE' : ' NO VE LA VERSIÓN ANTERIOR'}`, enabled ? 'green' : 'yellow');
}

async function runDemo() {
  log('\n DEMOSTRACIÓN DE CANARY DEPLOYMENT', 'magenta');
  log('────────────────────────────────────────', 'dim');
  
  const demoFlag = 'demo-feature-' + Date.now();
  
  // Paso 1: Crear feature flag
  log('\n PASO 1: Crear Feature Flag', 'cyan');
  await createFlag(demoFlag, 'Feature de demostración para Canary');
  await sleep(1000);
  
  // Paso 2: Canary 10%
  log('\n PASO 2: Iniciar Canary (10%)', 'cyan');
  log('   En producción, aquí monitorearíamos errores y latencia...', 'dim');
  await updateRollout(demoFlag, 10);
  await sleep(1000);
  
  // Evaluar algunos usuarios
  log('\n PASO 3: Verificar qué usuarios ven la feature', 'cyan');
  for (let i = 1; i <= 5; i++) {
    await evaluate(demoFlag, `user-${i}`);
  }
  await sleep(1000);
  
  // Paso 4: Incrementar a 50%
  log('\n PASO 4: Incrementar rollout (50%)', 'cyan');
  await updateRollout(demoFlag, 50);
  await sleep(1000);
  
  // Evaluar de nuevo
  log('\n PASO 5: Verificar con más usuarios', 'cyan');
  for (let i = 1; i <= 5; i++) {
    await evaluate(demoFlag, `user-${i}`);
  }
  await sleep(1000);
  
  // Paso 6: Simular error y rollback
  log('\n📌 PASO 6: ¡Detectamos un problema! Rollback...', 'cyan');
  log('     Simulando: CloudWatch Alarm detecta errores > threshold', 'yellow');
  await rollback(demoFlag);
  await sleep(1000);
  
  // Estado final
  log('\n RESULTADO FINAL:', 'cyan');
  await getStatus();
  
  log('\n Demo completada', 'green');
  log('   El Canary deployment protege a los usuarios de errores en producción', 'dim');
  log('   Solo un pequeño % ve la nueva versión, minimizando el impacto', 'dim');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main
async function main() {
  printHeader();
  
  const [,, command, arg1, arg2] = process.argv;
  
  switch (command) {
    case 'status':
      await getStatus();
      break;
    case 'create':
      if (!arg1) {
        log('Error: Nombre del flag requerido', 'red');
        log('Uso: canary-deploy.mjs create <name> [description]', 'dim');
        process.exit(1);
      }
      await createFlag(arg1, arg2 || '');
      break;
    case 'rollout':
      if (!arg1 || arg2 === undefined) {
        log('Error: Nombre y porcentaje requeridos', 'red');
        log('Uso: canary-deploy.mjs rollout <name> <percentage>', 'dim');
        process.exit(1);
      }
      await updateRollout(arg1, arg2);
      break;
    case 'rollback':
      if (!arg1) {
        log('Error: Nombre del flag requerido', 'red');
        log('Uso: canary-deploy.mjs rollback <name>', 'dim');
        process.exit(1);
      }
      await rollback(arg1);
      break;
    case 'evaluate':
      if (!arg1) {
        log('Error: Nombre del flag requerido', 'red');
        log('Uso: canary-deploy.mjs evaluate <name> [userId]', 'dim');
        process.exit(1);
      }
      await evaluate(arg1, arg2 || 'demo-user');
      break;
    case 'demo':
      await runDemo();
      break;
    default:
      printHelp();
  }
}

main().catch(console.error);
