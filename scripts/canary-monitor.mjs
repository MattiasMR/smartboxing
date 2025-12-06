#!/usr/bin/env node

/**
 * Script para monitorear el progreso de un deploy canario
 * Uso: node scripts/canary-monitor.mjs --stage=prod --timeout=20
 */

import { CodeDeployClient, ListDeploymentsCommand, GetDeploymentCommand } from '@aws-sdk/client-codedeploy';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

const codedeploy = new CodeDeployClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Parse command line arguments
const args = process.argv.slice(2);
const stage = args.find(arg => arg.startsWith('--stage='))?.split('=')[1] || 'dev';
const timeout = parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1] || '20', 10);

const applicationName = `smartboxing-${stage}`;

console.log(`\n🔍 Monitoring canary deployments for: ${applicationName}`);
console.log(`⏱️  Timeout: ${timeout} minutes\n`);

/**
 * Obtiene el deployment más reciente en progreso
 */
async function getLatestDeployment() {
  try {
    const listParams = {
      applicationName: applicationName,
      includeOnlyStatuses: ['Created', 'Queued', 'InProgress']
    };

    const listResult = await codedeploy.send(new ListDeploymentsCommand(listParams));
    
    if (!listResult.deployments || listResult.deployments.length === 0) {
      console.log('ℹ️  No active deployments found');
      return null;
    }

    const deploymentId = listResult.deployments[0];
    const getParams = { deploymentId };
    const deployment = await codedeploy.send(new GetDeploymentCommand(getParams));

    return deployment.deploymentInfo;
  } catch (error) {
    console.error('❌ Error getting deployment:', error.message);
    return null;
  }
}

/**
 * Obtiene métricas de CloudWatch para una función Lambda
 */
async function getLambdaMetrics(functionName) {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const params = {
      Namespace: 'AWS/Lambda',
      MetricName: 'Errors',
      Dimensions: [
        {
          Name: 'FunctionName',
          Value: functionName
        }
      ],
      StartTime: fiveMinutesAgo,
      EndTime: now,
      Period: 300, // 5 minutes
      Statistics: ['Sum']
    };

    const result = await cloudwatch.send(new GetMetricStatisticsCommand(params));
    const errors = result.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0;

    return { errors };
  } catch (error) {
    console.error('⚠️ Error getting metrics:', error.message);
    return { errors: 0 };
  }
}

/**
 * Formatea el tiempo transcurrido
 */
function formatElapsedTime(startTime) {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Renderiza una barra de progreso
 */
function renderProgressBar(percentage, width = 30) {
  const filled = Math.floor(width * percentage / 100);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percentage}%`;
}

/**
 * Monitorea el deployment canario
 */
async function monitorDeployment() {
  const startTime = Date.now();
  let lastStatus = '';
  let iterationCount = 0;

  console.log('🚀 Starting deployment monitoring...\n');

  while (true) {
    iterationCount++;
    const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60);
    
    // Check timeout
    if (elapsed > timeout) {
      console.log(`\n⏱️  Timeout reached (${timeout} minutes)`);
      console.log('⚠️  Deployment is still in progress. Check AWS Console for status.');
      break;
    }

    // Get deployment status
    const deployment = await getLatestDeployment();
    
    if (!deployment) {
      console.log('✅ No active deployments. Deployment may have completed.');
      break;
    }

    const status = deployment.status;
    const deploymentId = deployment.deploymentId;
    const createTime = deployment.createTime;

    // Calculate progress based on time and expected timeline
    let progress = 0;
    const deploymentElapsed = Math.floor((Date.now() - createTime.getTime()) / 1000 / 60);
    
    if (deploymentElapsed < 5) {
      progress = Math.min(10, (deploymentElapsed / 5) * 10);
    } else if (deploymentElapsed < 15) {
      progress = 10 + Math.min(40, ((deploymentElapsed - 5) / 10) * 40);
    } else {
      progress = 50 + Math.min(50, ((deploymentElapsed - 15) / 5) * 50);
    }
    progress = Math.min(100, Math.floor(progress));

    // Show status update
    if (status !== lastStatus || iterationCount % 2 === 1) {
      const timestamp = new Date().toLocaleTimeString();
      
      console.log(`\n[${ timestamp}] 🔄 Deployment Status`);
      console.log(`${'='.repeat(60)}`);
      console.log(`ID:       ${deploymentId.substring(0, 20)}...`);
      console.log(`Status:   ${getStatusEmoji(status)} ${status}`);
      console.log(`Elapsed:  ${formatElapsedTime(createTime.getTime())}`);
      console.log(`Progress: ${renderProgressBar(progress)}`);
      
      if (deployment.deploymentOverview) {
        const overview = deployment.deploymentOverview;
        console.log(`\n📊 Traffic Distribution:`);
        if (overview.Succeeded !== undefined) console.log(`  ✅ Succeeded:  ${overview.Succeeded}`);
        if (overview.Failed !== undefined) console.log(`  ❌ Failed:     ${overview.Failed}`);
        if (overview.InProgress !== undefined) console.log(`  🔄 InProgress: ${overview.InProgress}`);
        if (overview.Pending !== undefined) console.log(`  ⏳ Pending:    ${overview.Pending}`);
      }

      lastStatus = status;
    }

    // Check for completion states
    if (status === 'Succeeded') {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 ✅ CANARY DEPLOYMENT SUCCEEDED!');
      console.log('💯 100% of traffic is now on the new version');
      console.log('='.repeat(60) + '\n');
      break;
    }

    if (status === 'Failed' || status === 'Stopped') {
      console.log('\n' + '='.repeat(60));
      console.log(`❌ CANARY DEPLOYMENT ${status.toUpperCase()}`);
      console.log('🔄 Automatic rollback should have been triggered');
      console.log('📋 Check CloudWatch Alarms for the root cause');
      console.log('='.repeat(60) + '\n');
      process.exit(1);
    }

    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
  }

  console.log(`\n⏱️  Total monitoring time: ${formatElapsedTime(startTime)}`);
}

/**
 * Obtiene emoji según el estado
 */
function getStatusEmoji(status) {
  const emojiMap = {
    'Created': '🆕',
    'Queued': '⏳',
    'InProgress': '🔄',
    'Succeeded': '✅',
    'Failed': '❌',
    'Stopped': '🛑',
    'Ready': '✅'
  };
  return emojiMap[status] || '❓';
}

/**
 * Muestra ayuda
 */
function showHelp() {
  console.log(`
📊 Canary Deployment Monitor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Uso:
  node scripts/canary-monitor.mjs [opciones]

Opciones:
  --stage=<stage>      Stage a monitorear (default: dev)
  --timeout=<minutes>  Timeout en minutos (default: 20)
  --help               Muestra esta ayuda

Ejemplos:
  node scripts/canary-monitor.mjs --stage=prod --timeout=25
  node scripts/canary-monitor.mjs --stage=dev

Notas:
  - El script monitorea deployments en progreso cada 30 segundos
  - Muestra progreso estimado basado en la configuración Canary10Percent5Minutes
  - Timeline esperado: 10% (5min) → 50% (10min) → 100% (5min)
  - Se detendrá automáticamente cuando el deployment complete o falle

`);
}

// Main execution
if (args.includes('--help')) {
  showHelp();
  process.exit(0);
}

console.log('🐦 SmartBoxing - Canary Deployment Monitor');
console.log('━'.repeat(60));

monitorDeployment()
  .then(() => {
    console.log('\n✅ Monitoring completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Monitoring error:', error);
    process.exit(1);
  });
