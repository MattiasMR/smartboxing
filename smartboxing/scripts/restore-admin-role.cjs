const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);

const USER_SUB = "d4b82478-2011-7052-dbc7-5954234ddec6"; // My user sub
const TENANT = "demo";

async function assignAdminRole() {
  try {
    console.log('🔐 Restoring admin role to user...');
    
    await doc.send(new PutCommand({
      TableName: 'smartboxing-node-UserRoles-dev',
      Item: { 
        userKey: `${TENANT}#${USER_SUB}`, 
        roles: ["admin"] 
      }
    }));

    console.log('✅ User restored to admin role successfully!');
    console.log('User now has all permissions for demo purposes.');
    
  } catch (error) {
    console.error('❌ Error assigning role:', error.message);
  }
}

assignAdminRole();