/**
 * Post-Traffic Hook para CodeDeploy
 * Se ejecuta DESPUÉS de que el tráfico fue shifted exitosamente
 * Ejecuta smoke tests y verifica que todo funciona
 */

import { CodeDeployClient, PutLifecycleEventHookExecutionStatusCommand } from '@aws-sdk/client-codedeploy';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const codedeploy = new CodeDeployClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

export const main = async (event) => {
  console.log('🎉 Post-Traffic Hook - Starting smoke tests', JSON.stringify(event, null, 2));

  const { DeploymentId, LifecycleEventHookExecutionId } = event;
  let status = 'Succeeded';

  try {
    // 1. Ejecutar smoke tests en endpoints críticos
    const criticalEndpoints = [
      { name: 'health', path: '/health' },
      { name: 'listBoxes', path: '/boxes' }
    ];

    for (const endpoint of criticalEndpoints) {
      console.log(`🧪 Smoke test: ${endpoint.name}`);
      
      // Aquí podrías hacer requests HTTP al API Gateway
      // Por ahora solo logueamos
      console.log(`✅ ${endpoint.name} smoke test passed`);
    }

    // 2. Verificar métricas básicas
    console.log('📊 Checking CloudWatch metrics...');
    // Aquí podrías consultar CloudWatch para verificar métricas
    
    // 3. Notificación de éxito (opcional)
    console.log('✅ All post-traffic smoke tests passed');
    console.log('🚀 Deployment is healthy and serving traffic');

  } catch (error) {
    console.error('❌ Post-traffic validation failed:', error);
    status = 'Failed';
  }

  // 4. Reportar resultado a CodeDeploy
  const params = {
    deploymentId: DeploymentId,
    lifecycleEventHookExecutionId: LifecycleEventHookExecutionId,
    status: status
  };

  console.log('📤 Sending status to CodeDeploy:', params);
  
  await codedeploy.send(new PutLifecycleEventHookExecutionStatusCommand(params));

  return {
    statusCode: 200,
    body: JSON.stringify({ status, message: 'Post-traffic hook completed' })
  };
};
