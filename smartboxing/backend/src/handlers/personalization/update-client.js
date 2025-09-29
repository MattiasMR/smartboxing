const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
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
    
    // Check permissions - need settings:write for client settings
    const perms = await userPermissions(tenantId, claims.sub);
    requirePerm(perms, "settings:write");

    const body = JSON.parse(event.body || "{}");
    
    // Validate required fields for client settings
    if (!body.primaryColor && !body.secondaryColor && !body.logoUrl && !body.companyName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: "At least one client setting field required: primaryColor, secondaryColor, logoUrl, companyName" 
        })
      };
    }

    // Build the updated client settings with nested structure
    const clientSettingsItem = {
      tenantId,
      settings: {
        ...body,
        updated_at: new Date().toISOString()
      }
    };

    // If this is first time, add created_at
    if (!body.created_at) {
      clientSettingsItem.settings.created_at = new Date().toISOString();
    }

    await doc.send(new PutCommand({
      TableName: process.env.T_CLIENTSET,
      Item: clientSettingsItem
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Client settings updated successfully",
        settings: clientSettingsItem.settings
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