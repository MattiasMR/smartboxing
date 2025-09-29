const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_BOXES = process.env.T_BOXES;

exports.handler = async (event) => {
  try {
    const { operational_status, search, hallway } = event.queryStringParameters || {};
    
    let command;
    let params = { TableName: T_BOXES };

    // Si hay filtro por operational_status, usar GSI
    if (operational_status) {
      params.IndexName = 'OSIndex';
      params.KeyConditionExpression = 'operational_status = :status';
      params.ExpressionAttributeValues = { ':status': operational_status };
      command = new QueryCommand(params);
    } else {
      // Usar Scan para otros casos
      command = new ScanCommand(params);
    }

    const result = await doc.send(command);
    let boxes = result.Items || [];

    // Aplicar filtros adicionales si existen
    if (search) {
      const searchLower = search.toLowerCase();
      boxes = boxes.filter(box => 
        box.name?.toLowerCase().includes(searchLower) ||
        box.description?.toLowerCase().includes(searchLower)
      );
    }

    if (hallway) {
      boxes = boxes.filter(box => box.hallway === hallway);
    }

    // Ordenar por número
    boxes.sort((a, b) => (a.number || 0) - (b.number || 0));

    return {
      statusCode: 200,
      body: JSON.stringify({ boxes })
    };
  } catch (error) {
    console.error('Error listing boxes:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'BOXES_LIST_ERROR' })
    };
  }
};