import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { doc } from "./db.js";

const ses = new SESClient({});
const T_USER_SETTINGS = process.env.T_USER_SETTINGS;

/**
 * Send notification email if user has enabled email notifications
 * @param {string} tenantId - The tenant ID
 * @param {string} userSub - The user's Cognito Sub (who performed the action)
 * @param {string} subject - Email subject
 * @param {string} message - Email body
 */
export async function sendNotification(tenantId, userSub, subject, message) {
  try {
    // 1. Get user settings to check if email notifications are enabled
    // Note: We need the user's email, which might be in the settings or we need to fetch it from Cognito/User table
    // For now, let's assume we can get the email from the user settings or pass it in.
    // Actually, T_USER_SETTINGS is keyed by tenantId + userSub.
    
    const settingsResult = await doc.send(new GetCommand({
      TableName: T_USER_SETTINGS,
      Key: { tenantId, userSub }
    }));

    const settings = settingsResult.Item || {};
    const preferences = settings.preferences || {};

    // Check if email notifications are enabled
    if (!preferences.emailNotifications) {
      console.log(`Email notifications disabled for user ${userSub}`);
      return;
    }

    // We need the user's email address. 
    // If it's not in settings, we might need to fetch it from the User table or Cognito.
    // Let's assume for now we can get it from the User table (TenantUsers).
    // Or we can pass the email as an argument if available in the handler context.
    
    // Let's try to fetch from TenantUsers table
    const T_TENANT_USERS = process.env.T_TENANT_USERS;
    const userResult = await doc.send(new GetCommand({
      TableName: T_TENANT_USERS,
      Key: { tenantId, cognitoSub: userSub }
    }));

    const user = userResult.Item;
    if (!user || !user.email) {
      console.warn(`User email not found for ${userSub}`);
      return;
    }

    const email = user.email;

    // 2. Send email via SES
    const command = new SendEmailCommand({
      Source: "noreply@smartboxing.dev", // Verify this identity in SES!
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: `[SmartBoxing] ${subject}`,
        },
        Body: {
          Text: {
            Data: message,
          },
        },
      },
    });

    await ses.send(command);
    console.log(`Notification email sent to ${email}`);

  } catch (error) {
    console.error("Error sending notification:", error);
    // Don't block the main flow if notification fails
  }
}
