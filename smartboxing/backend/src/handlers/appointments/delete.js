const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims?.sub) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "No JWT claims found" })
      };
    }

    const tenantId = claims["custom:tenantId"] || "demo";
    
    // Check permissions
    const perms = await userPermissions(tenantId, claims.sub);
    requirePerm(perms, "appointments:write");

    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing appointment ID" })
      };
    }

    // Get existing appointment to verify it exists and belongs to tenant
    const result = await doc.send(new GetCommand({
      TableName: process.env.T_APPOINTMENTS,
      Key: { id: appointmentId }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Appointment not found" })
      };
    }

    // Verify tenantId
    if (result.Item.tenantId !== tenantId) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Appointment not found" })
      };
    }

    // Delete the appointment
    await doc.send(new DeleteCommand({
      TableName: process.env.T_APPOINTMENTS,
      Key: { id: appointmentId }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Appointment deleted successfully",
        id: appointmentId
      })
    };

  } catch (error) {
    console.error('Error:', error);
    
    if (error.message.includes('Insufficient permissions')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: "Internal server error",
        error: error.message 
      })
    };
  }
};