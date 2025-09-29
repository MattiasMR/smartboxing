const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_BOX_ASSIGNMENTS = process.env.T_BOX_ASSIGNMENTS;

// Helper function to extract date from datetime string
function extractDate(datetime) {
  return datetime.split('T')[0];
}

// Helper function to check for overlapping assignments
async function checkOverlaps(boxId, doctorId, startTime, endTime, excludeId) {
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
      if (item.id === excludeId) return false;
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
      if (item.id === excludeId) return false;
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

    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    
    // Check if assignment exists
    const existing = await doc.send(new GetCommand({
      TableName: T_BOX_ASSIGNMENTS,
      Key: { id }
    }));

    if (!existing.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Assignment not found', code: 'ASSIGNMENT_NOT_FOUND' })
      };
    }

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    const allowedFields = ['boxId', 'doctorId', 'start_time', 'end_time', 'specialtyId', 'status'];
    
    // Track if we're updating time-related fields for validation
    let needsValidation = false;
    const newBoxId = body.boxId || existing.Item.boxId;
    const newDoctorId = body.doctorId || existing.Item.doctorId;
    const newStartTime = body.start_time || existing.Item.start_time;
    const newEndTime = body.end_time || existing.Item.end_time;

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = body[field];
        
        if (['boxId', 'doctorId', 'start_time', 'end_time'].includes(field)) {
          needsValidation = true;
        }
      }
    });

    if (updateExpressions.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No valid fields to update', code: 'VALIDATION_ERROR' })
      };
    }

    // Validate time order if times are being updated
    if (body.start_time || body.end_time) {
      const startDate = new Date(newStartTime);
      const endDate = new Date(newEndTime);
      
      if (startDate >= endDate) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            message: 'start_time must be before end_time', 
            code: 'VALIDATION_ERROR' 
          })
        };
      }
    }

    // Check for overlaps if relevant fields are being updated
    if (needsValidation) {
      const overlapErrors = await checkOverlaps(newBoxId, newDoctorId, newStartTime, newEndTime, id);
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
    }

    // Update derived date field if start_time changed
    if (body.start_time) {
      updateExpressions.push('#date = :date');
      expressionAttributeNames['#date'] = 'date';
      expressionAttributeValues[':date'] = extractDate(body.start_time);
    }

    // Always update the updated_at timestamp
    updateExpressions.push('#updated_at = :updated_at');
    expressionAttributeNames['#updated_at'] = 'updated_at';
    expressionAttributeValues[':updated_at'] = new Date().toISOString();

    const result = await doc.send(new UpdateCommand({
      TableName: T_BOX_ASSIGNMENTS,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    if (error.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: 'PERMISSION_DENIED' })
      };
    }
    
    console.error('Error updating assignment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', code: 'ASSIGNMENT_UPDATE_ERROR' })
    };
  }
};