const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);

// Helper function to validate 30-minute slots
function validateTimeSlot(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const diffMs = end - start;
  const diffMinutes = diffMs / (1000 * 60);
  
  // Must be exactly 30 minutes
  if (diffMinutes !== 30) {
    throw new Error(`Appointment duration must be exactly 30 minutes, got ${diffMinutes} minutes`);
  }
  
  // Must start at 00 or 30 minutes
  const minutes = start.getMinutes();
  if (minutes !== 0 && minutes !== 30) {
    throw new Error(`Appointment must start at :00 or :30 minutes, got :${minutes.toString().padStart(2, '0')}`);
  }
  
  return true;
}

// Helper function to check if appointment is within assignment time
function isWithinAssignmentTime(appointmentStart, appointmentEnd, assignmentStart, assignmentEnd) {
  const apptStart = new Date(appointmentStart);
  const apptEnd = new Date(appointmentEnd);
  const assignStart = new Date(assignmentStart);
  const assignEnd = new Date(assignmentEnd);
  
  return apptStart >= assignStart && apptEnd <= assignEnd;
}

// Helper function to check for appointment overlaps
function hasTimeOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 < e2 && s2 < e1;
}

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
    requirePerm(perms, "appointments:write");

    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing appointment ID" })
      };
    }

    // Get existing appointment
    const existingResult = await doc.send(new GetCommand({
      TableName: process.env.T_APPOINTMENTS,
      Key: { id: appointmentId }
    }));

    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Appointment not found" })
      };
    }

    const existing = existingResult.Item;
    
    // Verify tenant access
    if (existing.tenantId !== tenantId) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Appointment not found" })
      };
    }

    const body = JSON.parse(event.body);
    
    // Build updated appointment (merge with existing)
    const updated = {
      ...existing,
      ...body,
      id: appointmentId, // Ensure ID doesn't change
      assignmentId: existing.assignmentId, // Prevent changing assignment
      boxId: existing.boxId, // Keep derived fields consistent
      doctorId: existing.doctorId,
      specialtyId: existing.specialtyId,
      updated_at: new Date().toISOString(),
      tenantId // Ensure tenant doesn't change
    };

    // If time is being updated, validate everything
    if (body.start_time || body.end_time) {
      const start_time = body.start_time || existing.start_time;
      const end_time = body.end_time || existing.end_time;
      
      // Validate time slot (30 minutes, proper timing)
      try {
        validateTimeSlot(start_time, end_time);
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: error.message })
        };
      }

      // Get the assignment to validate timing
      const assignmentResult = await doc.send(new GetCommand({
        TableName: process.env.T_BOX_ASSIGNMENTS,
        Key: { id: existing.assignmentId }
      }));

      if (!assignmentResult.Item) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Assignment not found" })
        };
      }

      const assignment = assignmentResult.Item;

      // Validate appointment is within assignment time range
      if (!isWithinAssignmentTime(start_time, end_time, assignment.start_time, assignment.end_time)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            message: `Appointment must be within assignment time range (${assignment.start_time} to ${assignment.end_time})` 
          })
        };
      }

      // Check for existing appointments that overlap (same assignment)
      const existingApptsResult = await doc.send(new QueryCommand({
        TableName: process.env.T_APPOINTMENTS,
        IndexName: "ApptByAssignment",
        KeyConditionExpression: "assignmentId = :assignmentId",
        ExpressionAttributeValues: {
          ":assignmentId": existing.assignmentId
        }
      }));

      // Check for overlaps (exclude current appointment)
      const overlappingAppts = (existingApptsResult.Items || []).filter(appt => 
        appt.tenantId === tenantId && 
        appt.id !== appointmentId && // Don't check against itself
        hasTimeOverlap(start_time, end_time, appt.start_time, appt.end_time)
      );

      if (overlappingAppts.length > 0) {
        return {
          statusCode: 409,
          body: JSON.stringify({ 
            message: "Time slot is already booked",
            conflicts: overlappingAppts.map(appt => ({
              id: appt.id,
              start_time: appt.start_time,
              end_time: appt.end_time,
              patient_name: appt.patient_name
            }))
          })
        };
      }

      // Update derived fields
      updated.start_time = start_time;
      updated.end_time = end_time;
      updated.date = start_time.split('T')[0];
    }

    await doc.send(new PutCommand({
      TableName: process.env.T_APPOINTMENTS,
      Item: updated
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(updated)
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