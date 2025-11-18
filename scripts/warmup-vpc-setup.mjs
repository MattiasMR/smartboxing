#!/usr/bin/env node
/**
 * Script para calentar el setup de VPC con Hyperplane ENI
 * 
 * Este script invoca todas las funciones Lambda para forzar la creación
 * del Hyperplane ENI compartido. El primer setup toma ~90 segundos, pero
 * después todas las funciones tendrán <100ms de overhead.
 * 
 * Uso:
 *   node scripts/warmup-vpc-setup.mjs
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});
const STAGE = process.env.STAGE || 'dev';
const SERVICE = 'smartboxing';

// Lista de funciones a calentar
const FUNCTIONS = [
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
];

// Payloads de prueba ligeros para cada tipo de función
const WARMUP_PAYLOADS = {
  health: {},
  // Lists - solo warmup, no necesitan auth real
  listBoxes: { httpMethod: 'GET', path: '/boxes', headers: {} },
  listStaff: { httpMethod: 'GET', path: '/staff', headers: {} },
  listAppointments: { httpMethod: 'GET', path: '/appointments', headers: {} },
  // Gets - usarán IDs falsos, solo para warmup
  getBox: { httpMethod: 'GET', pathParameters: { id: 'warmup-id' } },
  getStaffMember: { httpMethod: 'GET', pathParameters: { id: 'warmup-id' } },
  getAppointment: { httpMethod: 'GET', pathParameters: { id: 'warmup-id' } },
  getClientSettings: { httpMethod: 'GET' },
  getUserSettings: { httpMethod: 'GET', requestContext: { authorizer: { claims: { sub: 'warmup' } } } },
  // Creates - payload mínimo
  createBox: { httpMethod: 'POST', body: JSON.stringify({ name: 'warmup' }) },
  createStaffMember: { httpMethod: 'POST', body: JSON.stringify({ name: 'warmup' }) },
  createAppointment: { httpMethod: 'POST', body: JSON.stringify({ boxId: 'w', idStaff: 'w' }) },
  // Updates - payload mínimo
  updateBox: { httpMethod: 'PUT', pathParameters: { id: 'warmup' }, body: JSON.stringify({}) },
  updateStaffMember: { httpMethod: 'PUT', pathParameters: { id: 'warmup' }, body: JSON.stringify({}) },
  updateAppointment: { httpMethod: 'PUT', pathParameters: { id: 'warmup' }, body: JSON.stringify({}) },
  updateClientSettings: { httpMethod: 'PUT', body: JSON.stringify({}) },
  updateUserSettings: { httpMethod: 'PUT', requestContext: { authorizer: { claims: { sub: 'warmup' } } }, body: JSON.stringify({}) },
  // Deletes
  deleteBox: { httpMethod: 'DELETE', pathParameters: { id: 'warmup' } },
  deleteStaffMember: { httpMethod: 'DELETE', pathParameters: { id: 'warmup' } },
  deleteAppointment: { httpMethod: 'DELETE', pathParameters: { id: 'warmup' } },
};

async function warmupFunction(funcName) {
  const functionName = funcName === 'health' ? `${SERVICE}-${STAGE}-health` : `${SERVICE}-${STAGE}-${funcName}`;
  const payload = WARMUP_PAYLOADS[funcName] || {};

  try {
    const startTime = Date.now();
    
    await lambda.send(new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload),
    }));

    const duration = Date.now() - startTime;
    console.log(`✅ ${functionName.padEnd(40)} ${duration}ms`);
    return { success: true, duration };
  } catch (error) {
    console.error(`❌ ${functionName.padEnd(40)} ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function warmupAll() {
  console.log('🔥 Iniciando warmup de VPC con Hyperplane ENI...');
  console.log('   Esto forzará la creación del Hyperplane ENI compartido');
  console.log('   Primera ejecución: puede tomar hasta 90 segundos');
  console.log('   Ejecuciones posteriores: <100ms overhead\n');

  const startTime = Date.now();
  const results = [];

  // Invocar todas las funciones en paralelo (Hyperplane es compartido)
  for (const func of FUNCTIONS) {
    const result = await warmupFunction(func);
    results.push({ func, ...result });
  }

  const totalDuration = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n📊 Warmup completado en ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`   ✅ Exitosas: ${successful}`);
  console.log(`   ❌ Fallidas: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Algunas funciones fallaron (esperado en warmup con payloads de prueba)');
    console.log('   Lo importante es que se ejecutaron y forzaron el setup de Hyperplane');
  }

  console.log('\n💡 Recomendación:');
  console.log('   Espera 2 minutos para que Hyperplane complete el setup');
  console.log('   Luego prueba la API normalmente para validar performance');
}

warmupAll().catch(console.error);
