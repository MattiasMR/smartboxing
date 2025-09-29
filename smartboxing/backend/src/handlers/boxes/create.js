const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
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

    const body = JSON.parse(event.body);
    const { id, name, number, operational_status, description, hallway, equipment_list } = body;

    if (!id || !name || !number) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: id, name, number', code: 'VALIDATION_ERROR' })
      };
    }

    const now = new Date().toISOString();
    const box = {
      id,
      name,
      number,
      operational_status: operational_status || 'ACTIVE',
      description: description || '',
      hallway: hallway || '',
      equipment_list: equipment_list || [],
      created_at: now,
      updated_at: now,
      tenantId
    };

    await doc.send(new PutCommand({
      TableName: T_BOXES,
      Item: box
    }));

    return {
      statusCode: 201,
      body: JSON.stringify(box)
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error creating box:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'BOX_CREATE_ERROR' })
    };
  }
};