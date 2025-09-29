const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
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
    requirePerm(perms, 'assignments:read');

    const { box, doctor, on_date } = event.queryStringParameters || {};
    
    let assignments = [];

    if (box) {
      // Use GSI to get assignments for specific box
      const result = await doc.send(new QueryCommand({
        TableName: T_BOX_ASSIGNMENTS,
        IndexName: 'AssignmentsByBox',
        KeyConditionExpression: 'boxId = :boxId',
        ExpressionAttributeValues: {
          ':boxId': box
        }
      }));
      assignments = result.Items || [];
    } else if (doctor) {
      // Use GSI to get assignments for specific doctor
      const result = await doc.send(new QueryCommand({
        TableName: T_BOX_ASSIGNMENTS,
        IndexName: 'AssignmentsByDoctor',
        KeyConditionExpression: 'doctorId = :doctorId',
        ExpressionAttributeValues: {
          ':doctorId': doctor
        }
      }));
      assignments = result.Items || [];
    } else if (on_date) {
      // Use GSI to get assignments for specific date
      const result = await doc.send(new QueryCommand({
        TableName: T_BOX_ASSIGNMENTS,
        IndexName: 'AssignmentsByDate',
        KeyConditionExpression: 'date = :date',
        ExpressionAttributeValues: {
          ':date': on_date
        }
      }));
      assignments = result.Items || [];
    } else {
      // Get all assignments
      const result = await doc.send(new ScanCommand({
        TableName: T_BOX_ASSIGNMENTS
      }));
      assignments = result.Items || [];
    }

    // Sort by start_time
    assignments.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    return {
      statusCode: 200,
      body: JSON.stringify({ assignments })
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error listing assignments:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'ASSIGNMENTS_LIST_ERROR' })
    };
  }
};
