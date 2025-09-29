const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_PERMS = process.env.T_PERMS;

exports.handler = async (event) => {
  try {
    const r = await doc.send(new ScanCommand({ TableName: T_PERMS, ProjectionExpression: "perm" }));
    const perms = (r.Items || []).map(i => i.perm).sort();
    return { statusCode: 200, body: JSON.stringify({ permissions: perms }) };
  } catch (error) {
    console.error('Error listing permissions:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'PERMISSIONS_LIST_ERROR' })
    };
  }
};
