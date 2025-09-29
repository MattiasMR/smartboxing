const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
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

    const body = JSON.parse(event.body);
    
    // Validate required fields
    const { id, assignmentId, start_time, end_time, patient_name, patient_phone, reason } = body;
    
    if (!id || !assignmentId || !start_time || !end_time || !patient_name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: "Missing required fields: id, assignmentId, start_time, end_time, patient_name" 
        })
      };
    }

    // Validate time slot (30 minutes, proper timing)
    try {
      validateTimeSlot(start_time, end_time);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.message })
      };
    }

    // Get the assignment to validate it exists and get context
    const assignmentResult = await doc.send(new GetCommand({
      TableName: process.env.T_BOX_ASSIGNMENTS,
      Key: { id: assignmentId }
    }));

    if (!assignmentResult.Item) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Assignment not found" })
      };
    }

    const assignment = assignmentResult.Item;
    
    // Verify assignment belongs to same tenant
    if (assignment.tenantId !== tenantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Assignment not found" })
      };
    }

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
        ":assignmentId": assignmentId
      }
    }));

    // Check for overlaps
    const overlappingAppts = (existingApptsResult.Items || []).filter(appt => 
      appt.tenantId === tenantId && 
      appt.id !== id && // Don't check against itself (for updates)
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

    // Derive date from start_time
    const date = start_time.split('T')[0];

    // Create the appointment
    const appointment = {
      id,
      assignmentId,
      boxId: assignment.boxId,
      doctorId: assignment.doctorId,
      specialtyId: assignment.specialtyId,
      date,
      start_time,
      end_time,
      patient_name,
      patient_phone: patient_phone || null,
      patient_email: body.patient_email || null,
      reason: reason || null,
      status: body.status || "SCHEDULED",
      notes: body.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenantId
    };

    await doc.send(new PutCommand({
      TableName: process.env.T_APPOINTMENTS,
      Item: appointment
    }));

    return {
      statusCode: 201,
      body: JSON.stringify(appointment)
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