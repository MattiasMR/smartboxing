const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_DOCTORS = process.env.T_DOCTORS;
const T_VACATIONS = process.env.T_VACATIONS;

exports.handler = async (event) => {
  try {
    // Parse JWT claims from authorizer
    const claims = event.requestContext.authorizer.jwt.claims;
    const tenantId = claims['custom:tenantId'] || 'demo';
    
    // Check permissions
    const perms = await userPermissions(tenantId, claims.sub);
    requirePerm(perms, 'doctors:read');

    const { status, search } = event.queryStringParameters || {};
    
    // Get all doctors
    const result = await doc.send(new ScanCommand({
      TableName: T_DOCTORS
    }));

    let doctors = result.Items || [];

    // Apply filters
    if (status) {
      doctors = doctors.filter(doc => doc.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      doctors = doctors.filter(doc => 
        doc.name?.toLowerCase().includes(searchLower) ||
        doc.email?.toLowerCase().includes(searchLower)
      );
    }

    // For doctors on vacation, we could enhance status by checking current vacations
    // but for now we'll use the stored status field

    // Sort by name
    doctors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return {
      statusCode: 200,
      body: JSON.stringify({ doctors })
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error listing doctors:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'DOCTORS_LIST_ERROR' })
    };
  }
};
