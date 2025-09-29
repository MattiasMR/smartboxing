const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
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
    requirePerm(perms, 'doctors:write');

    const body = JSON.parse(event.body);
    const { id, doctorId, start_date, end_date, reason } = body;

    if (!id || !doctorId || !start_date || !end_date) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: id, doctorId, start_date, end_date', code: 'VALIDATION_ERROR' })
      };
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate >= endDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'start_date must be before end_date', code: 'VALIDATION_ERROR' })
      };
    }

    const now = new Date().toISOString();
    const vacation = {
      id,
      doctorId,
      start_date,
      end_date,
      reason: reason || '',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      tenantId
    };

    await doc.send(new PutCommand({
      TableName: T_VACATIONS,
      Item: vacation
    }));

    return {
      statusCode: 201,
      body: JSON.stringify(vacation)
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error creating vacation:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'VACATION_CREATE_ERROR' })
    };
  }
};