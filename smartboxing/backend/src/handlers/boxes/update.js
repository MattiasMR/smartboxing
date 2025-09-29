const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_BOXES = process.env.T_BOXES;

exports.handler = async (event) => {
  try {
    // Parse JWT claims from authorizer
    const claims = event.requestContext.authorizer.jwt.claims;
    const tenantId = claims['custom:tenantId'] || 'demo';
    
    // Check permissions
    const perms = await userPermissions(tenantId, claims.sub);
    requirePerm(perms, 'boxes:write');

    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    
    // Check if box exists
    const existing = await doc.send(new GetCommand({
      TableName: T_BOXES,
      Key: { id }
    }));

    if (!existing.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Box not found', code: 'BOX_NOT_FOUND' })
      };
    }

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    const allowedFields = ['name', 'number', 'operational_status', 'description', 'hallway', 'equipment_list'];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = body[field];
      }
    });

    if (updateExpressions.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No valid fields to update', code: 'VALIDATION_ERROR' })
      };
    }

    // Always update the updated_at timestamp
    updateExpressions.push('#updated_at = :updated_at');
    expressionAttributeNames['#updated_at'] = 'updated_at';
    expressionAttributeValues[':updated_at'] = new Date().toISOString();

    const result = await doc.send(new UpdateCommand({
      TableName: T_BOXES,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error updating box:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'BOX_UPDATE_ERROR' })
    };
  }
};