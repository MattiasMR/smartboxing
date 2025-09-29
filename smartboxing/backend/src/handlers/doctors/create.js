const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
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

    const body = JSON.parse(event.body);
    const { id, name, email, phone, specialty_id, status } = body;

    if (!id || !name || !email || !specialty_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: id, name, email, specialty_id', code: 'VALIDATION_ERROR' })
      };
    }

    const now = new Date().toISOString();
    const doctor = {
      id,
      name,
      email,
      phone: phone || '',
      specialty_id,
      status: status || 'ON_DUTY',
      created_at: now,
      updated_at: now,
      tenantId
    };

    await doc.send(new PutCommand({
      TableName: T_DOCTORS,
      Item: doctor
    }));

    return {
      statusCode: 201,
      body: JSON.stringify(doctor)
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error creating doctor:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'DOCTOR_CREATE_ERROR' })
    };
  }
};