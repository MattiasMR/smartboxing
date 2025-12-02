/**
 * Pre-Traffic Hook para CodeDeploy
 * Se ejecuta ANTES de enviar tráfico a la nueva versión
 * Valida que la función está lista para recibir requests
 */

import { CodeDeployClient, PutLifecycleEventHookExecutionStatusCommand } from '@aws-sdk/client-codedeploy';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const codedeploy = new CodeDeployClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

export const main = async (event) => {
  console.log('🔍 Pre-Traffic Hook - Starting validation', JSON.stringify(event, null, 2));

  const { DeploymentId, LifecycleEventHookExecutionId } = event;
  let status = 'Succeeded';

  try {
    // 1. Validar que la nueva versión existe
    const newVersion = event.CurrentVersion || process.env.AWS_LAMBDA_FUNCTION_VERSION;
    console.log(`✅ New version detected: ${newVersion}`);

    // 2. Ejecutar health check básico en la nueva versión
    const functionName = process.env.NEW_VERSION_FUNCTION_NAME || event.FunctionName;
    
    if (functionName) {
      console.log(`🏥 Running health check on: ${functionName}`);
      
      const invokeParams = {
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ source: 'pre-traffic-hook', action: 'health-check' })
      };

      const response = await lambda.send(new InvokeCommand(invokeParams));
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      console.log('Health check response:', payload);

      if (response.FunctionError) {
        throw new Error(`Health check failed: ${payload.errorMessage}`);
      }
    }

    // 3. Validaciones adicionales (opcional)
    console.log('✅ All pre-traffic validations passed');

  } catch (error) {
    console.error('❌ Pre-traffic validation failed:', error);
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
    body: JSON.stringify({ status, message: 'Pre-traffic hook completed' })
  };
};
