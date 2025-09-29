const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_BOX_ASSIGNMENTS = process.env.T_BOX_ASSIGNMENTS;

exports.handler = async (event) => {
  try {
    // Parse JWT claims from authorizer
    const claims = event.requestContext.authorizer.jwt.claims;
    const tenantId = claims['custom:tenantId'] || 'demo';
    
    // Check permissions
    const perms = await userPermissions(tenantId, claims.sub);
    requirePerm(perms, 'assignments:write');

    const { id } = event.pathParameters;
    
    // Check if assignment exists
    const existing = await doc.send(new GetCommand({
      TableName: T_BOX_ASSIGNMENTS,
      Key: { id }
    }));

    if (!existing.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Assignment not found', code: 'ASSIGNMENT_NOT_FOUND' })
      };
    }

    await doc.send(new DeleteCommand({
      TableName: T_BOX_ASSIGNMENTS,
      Key: { id }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Assignment deleted successfully' })
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error deleting assignment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'ASSIGNMENT_DELETE_ERROR' })
    };
  }
};