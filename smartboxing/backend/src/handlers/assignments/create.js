const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_BOX_ASSIGNMENTS = process.env.T_BOX_ASSIGNMENTS;

// Helper function to extract date from datetime string
function extractDate(datetime) {
  return datetime.split('T')[0]; // Get YYYY-MM-DD from ISO string
}

// Helper function to check for overlapping assignments
async function checkOverlaps(boxId, doctorId, startTime, endTime, excludeId = null) {
  const errors = [];
  
  // Check box conflicts - Get all assignments for this box and check overlap in code
  const boxConflicts = await doc.send(new QueryCommand({
    TableName: T_BOX_ASSIGNMENTS,
    IndexName: 'AssignmentsByBox',
    KeyConditionExpression: 'boxId = :boxId',
    ExpressionAttributeValues: {
      ':boxId': boxId
    }
  }));
  
  if (boxConflicts.Items) {
    const overlappingBoxAssignments = boxConflicts.Items.filter(item => {
      if (excludeId && item.id === excludeId) return false;
      return item.start_time < endTime && item.end_time > startTime;
    });
    
    if (overlappingBoxAssignments.length > 0) {
      errors.push(`Box ${boxId} is already assigned during this time period`);
    }
  }

  // Check doctor conflicts - Get all assignments for this doctor and check overlap in code  
  const doctorConflicts = await doc.send(new QueryCommand({
    TableName: T_BOX_ASSIGNMENTS,
    IndexName: 'AssignmentsByDoctor',
    KeyConditionExpression: 'doctorId = :doctorId',
    ExpressionAttributeValues: {
      ':doctorId': doctorId
    }
  }));
  
  if (doctorConflicts.Items) {
    const overlappingDoctorAssignments = doctorConflicts.Items.filter(item => {
      if (excludeId && item.id === excludeId) return false;
      return item.start_time < endTime && item.end_time > startTime;
    });
    
    if (overlappingDoctorAssignments.length > 0) {
      errors.push(`Doctor ${doctorId} is already assigned during this time period`);
    }
  }
  
  return errors;
}

exports.handler = async (event) => {
  try {
    // Parse JWT claims from authorizer
    const claims = event.requestContext.authorizer.jwt.claims;
    const tenantId = claims['custom:tenantId'] || 'demo';
    
    // Check permissions
    const perms = await userPermissions(tenantId, claims.sub);
    requirePerm(perms, 'assignments:write');

    const body = JSON.parse(event.body);
    const { id, boxId, doctorId, start_time, end_time, specialtyId } = body;

    if (!id || !boxId || !doctorId || !start_time || !end_time) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: 'Missing required fields: id, boxId, doctorId, start_time, end_time', 
          code: 'VALIDATION_ERROR' 
        })
      };
    }

    // Validate time order
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    
    if (startDate >= endDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: 'start_time must be before end_time', 
          code: 'VALIDATION_ERROR' 
        })
      };
    }

    // Check for overlaps
    const overlapErrors = await checkOverlaps(boxId, doctorId, start_time, end_time);
    if (overlapErrors.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ 
          message: 'Assignment conflicts detected', 
          errors: overlapErrors,
          code: 'ASSIGNMENT_CONFLICT' 
        })
      };
    }

    const now = new Date().toISOString();
    const assignment = {
      id,
      boxId,
      doctorId,
      start_time,
      end_time,
      date: extractDate(start_time), // Derived field for GSI
      specialtyId: specialtyId || null,
      status: 'SCHEDULED',
      created_at: now,
      updated_at: now,
      tenantId
    };

    await doc.send(new PutCommand({
      TableName: T_BOX_ASSIGNMENTS,
      Item: assignment
    }));

    return {
      statusCode: 201,
      body: JSON.stringify(assignment)
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error creating assignment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'ASSIGNMENT_CREATE_ERROR' })
    };
  }
};