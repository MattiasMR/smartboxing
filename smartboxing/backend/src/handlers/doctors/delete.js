const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_DOCTORS = process.env.T_DOCTORS;

exports.handler = async (event) => {
  try {
    // Parse JWT claims from authorizer
    const claims = event.requestContext.authorizer.jwt.claims;
    const tenantId = claims['custom:tenantId'] || 'demo';
    
    // Check permissions
    const perms = await userPermissions(tenantId, claims.sub);
    requirePerm(perms, 'doctors:write');

    const { id } = event.pathParameters;
    
    // Check if doctor exists
    const existing = await doc.send(new GetCommand({
      TableName: T_DOCTORS,
      Key: { id }
    }));

    if (!existing.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Doctor not found', code: 'DOCTOR_NOT_FOUND' })
      };
    }

    await doc.send(new DeleteCommand({
      TableName: T_DOCTORS,
      Key: { id }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Doctor deleted successfully' })
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error deleting doctor:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'DOCTOR_DELETE_ERROR' })
    };
  }
};