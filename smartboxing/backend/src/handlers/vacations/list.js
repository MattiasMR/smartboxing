const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_VACATIONS = process.env.T_VACATIONS;

exports.handler = async (event) => {
  try {
    // Parse JWT claims from authorizer
    const claims = event.requestContext.authorizer.jwt.claims;
    const tenantId = claims['custom:tenantId'] || 'demo';
    
    // Check permissions
    const perms = await userPermissions(tenantId, claims.sub);
    requirePerm(perms, 'doctors:read');

    const { doctor } = event.queryStringParameters || {};
    
    let vacations = [];

    if (doctor) {
      // Use GSI to get vacations for specific doctor
      const result = await doc.send(new QueryCommand({
        TableName: T_VACATIONS,
        IndexName: 'VacationsByDoctor',
        KeyConditionExpression: 'doctorId = :doctorId',
        ExpressionAttributeValues: {
          ':doctorId': doctor
        }
      }));
      vacations = result.Items || [];
    } else {
      // Get all vacations
      const result = await doc.send(new ScanCommand({
        TableName: T_VACATIONS
      }));
      vacations = result.Items || [];
    }

    // Sort by start_date (most recent first)
    vacations.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    return {
      statusCode: 200,
      body: JSON.stringify({ vacations })
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error listing vacations:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'VACATIONS_LIST_ERROR' })
    };
  }
};