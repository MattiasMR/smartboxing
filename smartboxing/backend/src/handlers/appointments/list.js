const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
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
    requirePerm(perms, "appointments:read");

    const { assignment, date, doctor } = event.queryStringParameters || {};
    
    let result;
    
    if (assignment) {
      // Query by assignment using ApptByAssignment GSI
      result = await doc.send(new QueryCommand({
        TableName: process.env.T_APPOINTMENTS,
        IndexName: "ApptByAssignment",
        KeyConditionExpression: "assignmentId = :assignmentId",
        ExpressionAttributeValues: {
          ":assignmentId": assignment
        }
      }));
    } else if (date) {
      // Query by date using ApptByDate GSI
      result = await doc.send(new QueryCommand({
        TableName: process.env.T_APPOINTMENTS,
        IndexName: "ApptByDate",
        KeyConditionExpression: "#date = :date",
        ExpressionAttributeNames: {
          "#date": "date"
        },
        ExpressionAttributeValues: {
          ":date": date
        }
      }));
    } else if (doctor) {
      // Query by doctor using ApptByDoctorDate GSI
      result = await doc.send(new QueryCommand({
        TableName: process.env.T_APPOINTMENTS,
        IndexName: "ApptByDoctorDate",
        KeyConditionExpression: "doctorId = :doctorId",
        ExpressionAttributeValues: {
          ":doctorId": doctor
        }
      }));
    } else {
      // Scan all appointments
      result = await doc.send(new ScanCommand({
        TableName: process.env.T_APPOINTMENTS
      }));
    }

    // Filter by tenantId and sort by start_time
    const appointments = (result.Items || [])
      .filter(item => item.tenantId === tenantId)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    return {
      statusCode: 200,
      body: JSON.stringify({
        appointments,
        count: appointments.length
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