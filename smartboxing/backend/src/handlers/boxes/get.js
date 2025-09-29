const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_BOXES = process.env.T_BOXES;

exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;

    const result = await doc.send(new GetCommand({
      TableName: T_BOXES,
      Key: { id }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Box not found', code: 'BOX_NOT_FOUND' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    console.error('Error getting box:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'BOX_GET_ERROR' })
    };
  }
};