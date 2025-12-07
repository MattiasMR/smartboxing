/**
 * 🚀 Canary Deployment Handler
 * 
 * Implementa Canary Deployments usando Feature Flags en DynamoDB.
 * Permite desplegar gradualmente nuevas funcionalidades a un porcentaje de usuarios.
 * 
 * Conceptos:
 * - Feature Flag: Configuración que define qué % de usuarios ve una feature
 * - Canary: Despliegue gradual (ej: 10% -> 50% -> 100%)
 * - Rollback: Si hay errores, se puede desactivar la feature al 0%
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { ok, fail, handler } from '../../lib/http.js';

const client = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(client);

const FEATURE_FLAGS_TABLE = process.env.T_FEATURE_FLAGS || `smartboxing-${process.env.STAGE || 'dev'}-feature-flags`;

/**
 * Obtiene los claims del JWT
 */
const getClaims = (event) => {
  return event.requestContext?.authorizer?.jwt?.claims ?? {};
};

/**
 * Verifica que el usuario sea super-admin
 */
const requireSuperAdmin = (event) => {
  const claims = getClaims(event);
  const role = claims['custom:role'] || claims.role;
  
  if (role !== 'super-admin') {
    const error = new Error('Only super-admin can access feature flags');
    error.statusCode = 403;
    throw error;
  }
  
  return claims;
};

/**
 * Obtiene un feature flag por nombre
 */
export const getFeatureFlag = handler(async (event) => {
  const claims = requireSuperAdmin(event);

  const flagName = event.pathParameters?.flagName;
  if (!flagName) {
    const error = new Error('Flag name is required');
    error.statusCode = 400;
    throw error;
  }

  const result = await doc.send(new GetCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Key: { flagName }
  }));

  if (!result.Item) {
    const error = new Error(`Feature flag '${flagName}' not found`);
    error.statusCode = 404;
    throw error;
  }

  return result.Item;
}, 'getFeatureFlag');

/**
 * Lista todos los feature flags
 */
export const listFeatureFlags = handler(async (event) => {
  const claims = requireSuperAdmin(event);

  const result = await doc.send(new ScanCommand({
    TableName: FEATURE_FLAGS_TABLE
  }));

  return {
    flags: result.Items || [],
    count: result.Count || 0
  };
}, 'listFeatureFlags');

/**
 * Crea o actualiza un feature flag
 */
export const upsertFeatureFlag = handler(async (event) => {
  const claims = requireSuperAdmin(event);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    const error = new Error('Invalid JSON body');
    error.statusCode = 400;
    throw error;
  }

  const { flagName, description, enabled, rolloutPercentage, targetTenants, metadata } = body;

  if (!flagName) {
    const error = new Error('flagName is required');
    error.statusCode = 400;
    throw error;
  }

  const percentage = Math.min(100, Math.max(0, rolloutPercentage || 0));
  const userEmail = claims.email || claims.sub;

  const item = {
    flagName,
    description: description || '',
    enabled: enabled !== false,
    rolloutPercentage: percentage,
    targetTenants: targetTenants || [],
    metadata: metadata || {},
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail
  };

  // Check if exists to set createdAt
  const existing = await doc.send(new GetCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Key: { flagName }
  }));

  if (!existing.Item) {
    item.createdAt = new Date().toISOString();
    item.createdBy = userEmail;
  } else {
    item.createdAt = existing.Item.createdAt;
    item.createdBy = existing.Item.createdBy;
  }

  await doc.send(new PutCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Item: item
  }));

  return {
    message: existing.Item ? 'Feature flag updated' : 'Feature flag created',
    flag: item
  };
}, 'upsertFeatureFlag');

/**
 * Actualiza el porcentaje de rollout (Canary progression)
 */
export const updateRollout = handler(async (event) => {
  const claims = requireSuperAdmin(event);

  const flagName = event.pathParameters?.flagName;
  if (!flagName) {
    const error = new Error('Flag name is required');
    error.statusCode = 400;
    throw error;
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    const error = new Error('Invalid JSON body');
    error.statusCode = 400;
    throw error;
  }

  const { rolloutPercentage } = body;
  if (rolloutPercentage === undefined || rolloutPercentage < 0 || rolloutPercentage > 100) {
    const error = new Error('rolloutPercentage must be between 0 and 100');
    error.statusCode = 400;
    throw error;
  }

  const result = await doc.send(new UpdateCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Key: { flagName },
    UpdateExpression: 'SET rolloutPercentage = :pct, updatedAt = :now, updatedBy = :by',
    ExpressionAttributeValues: {
      ':pct': rolloutPercentage,
      ':now': new Date().toISOString(),
      ':by': claims.email || claims.sub
    },
    ReturnValues: 'ALL_NEW'
  }));

  if (!result.Attributes) {
    const error = new Error(`Feature flag '${flagName}' not found`);
    error.statusCode = 404;
    throw error;
  }

  return {
    message: `Rollout updated to ${rolloutPercentage}%`,
    flag: result.Attributes
  };
}, 'updateRollout');

/**
 * Rollback: Desactiva una feature (0% rollout)
 */
export const rollbackFeature = handler(async (event) => {
  const claims = requireSuperAdmin(event);

  const flagName = event.pathParameters?.flagName;
  if (!flagName) {
    const error = new Error('Flag name is required');
    error.statusCode = 400;
    throw error;
  }

  const result = await doc.send(new UpdateCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Key: { flagName },
    UpdateExpression: 'SET rolloutPercentage = :pct, enabled = :enabled, updatedAt = :now, updatedBy = :by, rollbackAt = :rollback',
    ExpressionAttributeValues: {
      ':pct': 0,
      ':enabled': false,
      ':now': new Date().toISOString(),
      ':by': claims.email || claims.sub,
      ':rollback': new Date().toISOString()
    },
    ReturnValues: 'ALL_NEW'
  }));

  if (!result.Attributes) {
    const error = new Error(`Feature flag '${flagName}' not found`);
    error.statusCode = 404;
    throw error;
  }

  return {
    message: `🔙 Feature '${flagName}' rolled back (0%, disabled)`,
    flag: result.Attributes
  };
}, 'rollbackFeature');

/**
 * Hash simple para consistencia en la evaluación
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Evalúa si un usuario/tenant debe ver una feature
 * Esta función se puede llamar desde el frontend o backend
 * 
 * Query params:
 * - flagName: nombre del feature flag
 * - tenantId: (opcional) tenant del usuario
 * - userId: (opcional) ID único del usuario para randomización consistente
 */
export const evaluateFlag = handler(async (event) => {
  const { flagName, tenantId, userId } = event.queryStringParameters || {};

  if (!flagName) {
    const error = new Error('flagName query parameter is required');
    error.statusCode = 400;
    throw error;
  }

  const result = await doc.send(new GetCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Key: { flagName }
  }));

  if (!result.Item) {
    return { enabled: false, reason: 'flag_not_found' };
  }

  const flag = result.Item;

  if (!flag.enabled) {
    return { enabled: false, reason: 'flag_disabled' };
  }

  if (flag.targetTenants && flag.targetTenants.length > 0) {
    if (!tenantId || !flag.targetTenants.includes(tenantId)) {
      return { enabled: false, reason: 'tenant_not_targeted' };
    }
  }

  const percentage = flag.rolloutPercentage || 0;
  
  if (percentage >= 100) {
    return { enabled: true, reason: 'full_rollout' };
  }
  
  if (percentage <= 0) {
    return { enabled: false, reason: 'zero_rollout' };
  }

  const hash = userId ? simpleHash(userId + flagName) : Math.random() * 100;
  const bucket = hash % 100;
  const enabled = bucket < percentage;

  return {
    enabled,
    reason: enabled ? 'in_rollout_bucket' : 'outside_rollout_bucket',
    rolloutPercentage: percentage,
    bucket: Math.floor(bucket)
  };
}, 'evaluateFlag');

/**
 * Elimina un feature flag
 */
export const deleteFeatureFlag = handler(async (event) => {
  const claims = requireSuperAdmin(event);

  const flagName = event.pathParameters?.flagName;
  if (!flagName) {
    const error = new Error('Flag name is required');
    error.statusCode = 400;
    throw error;
  }

  await doc.send(new DeleteCommand({
    TableName: FEATURE_FLAGS_TABLE,
    Key: { flagName }
  }));

  return { message: `Feature flag '${flagName}' deleted` };
}, 'deleteFeatureFlag');
