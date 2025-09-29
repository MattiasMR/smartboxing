const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);

const USER_SUB = "d4b82478-2011-7052-dbc7-5954234ddec6"; // My user sub
const TENANT = "demo";

async function assignSchedulerRole() {
  try {
    console.log('🔐 Assigning scheduler role to user...');
    
    await doc.send(new PutCommand({
      TableName: 'smartboxing-node-UserRoles-dev',
      Item: { 
        userKey: `${TENANT}#${USER_SUB}`, 
        roles: ["scheduler"] 
      }
    }));

    console.log('✅ User assigned to scheduler role successfully!');
    console.log('User will now have assignments:write and appointments:write permissions.');
    
  } catch (error) {
    console.error('❌ Error assigning role:', error.message);
  }
}

assignSchedulerRole();