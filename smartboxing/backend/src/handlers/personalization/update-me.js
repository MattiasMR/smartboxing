const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

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
    const userSub = claims.sub;

    // No permission check needed - users can always update their own settings

    const body = JSON.parse(event.body || "{}");
    
    // Validate required fields for user settings
    if (!body.theme && !body.language && !body.dateFormat && !body.timeFormat) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: "At least one user setting field required: theme, language, dateFormat, timeFormat" 
        })
      };
    }

    // Build the user key and settings with nested structure
    const userKey = `${tenantId}#${userSub}`;
    const userSettingsItem = {
      userKey,
      tenantId,
      userSub,
      settings: {
        ...body,
        updated_at: new Date().toISOString()
      }
    };

    // If this is first time, add created_at
    if (!body.created_at) {
      userSettingsItem.settings.created_at = new Date().toISOString();
    }

    await doc.send(new PutCommand({
      TableName: process.env.T_USERSET,
      Item: userSettingsItem
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User settings updated successfully",
        settings: userSettingsItem.settings
      })
    };

  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: "Internal server error",
        error: error.message 
      })
    };
  }
};