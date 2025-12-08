#!/usr/bin/env node

/**
 * Script to create or update a super_admin user
 * 
 * Usage:
 *   node scripts/create-super-admin.mjs <email> [--name "Admin Name"]
 * 
 * Example:
 *   node scripts/create-super-admin.mjs admin@smartboxing.dev --name "System Admin"
 */

import { 
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { 
  DynamoDBClient 
} from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand 
} from '@aws-sdk/lib-dynamodb';
import { fromIni } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

// Configuration
const REGION = (process.env.AWS_REGION || 'us-east-1').trim();
// Default to dev unless explicitly overridden
const STAGE = process.env.STAGE || 'dev';
const SERVICE_NAME = 'smartboxing';
const PROFILE = process.env.AWS_PROFILE;

// Table names follow the serverless.yml pattern
const T_TENANT_USERS = `${SERVICE_NAME}-TenantUsers-${STAGE}`;

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/create-super-admin.mjs <email> [--name "Admin Name"] [--password "TempPassword123!"]');
  process.exit(1);
}

const email = args[0];
const nameIndex = args.indexOf('--name');
const name = nameIndex > -1 ? args[nameIndex + 1] : 'Super Admin';
const passwordIndex = args.indexOf('--password');
const tempPassword = passwordIndex > -1 ? args[passwordIndex + 1] : null;

// Initialize clients
// Explicit credential provider so profile works in Node
const credentialsProvider = PROFILE ? fromIni({ profile: PROFILE }) : undefined;

async function getUserPoolId() {
  // Get from CloudFormation outputs or environment
  const userPoolId = process.env.USER_POOL_ID;
  
  if (!userPoolId) {
    // Try to get from serverless output
    console.log('📡 Fetching User Pool ID from CloudFormation...');
    const { CloudFormationClient, DescribeStacksCommand } = await import('@aws-sdk/client-cloudformation');
    const cf = new CloudFormationClient({ region: REGION });
    
    const stackName = `${SERVICE_NAME}-${STAGE}`;
    const result = await cf.send(new DescribeStacksCommand({ StackName: stackName }));
    
    const outputs = result.Stacks?.[0]?.Outputs || [];
    const userPoolOutput = outputs.find(o => o.OutputKey === 'UserPoolId');
    
    if (!userPoolOutput) {
      throw new Error('Could not find UserPoolId in CloudFormation outputs. Set USER_POOL_ID env var.');
    }
    
    return userPoolOutput.OutputValue;
  }
  
  return userPoolId;
}

async function main() {
  console.log('\n🔐 SmartBoxing - Create Super Admin\n');
  console.log(`   Email: ${email}`);
  console.log(`   Name:  ${name}`);
  console.log(`   Stage: ${STAGE}\n`);
  
  try {
    const creds = credentialsProvider ? await credentialsProvider() : undefined;
    if (creds) {
      console.log(`   Using profile: ${PROFILE} (key: ${creds.accessKeyId})\n`);
    }

    const cognito = new CognitoIdentityProviderClient({ region: REGION, credentials: creds || credentialsProvider });
    const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION, credentials: creds || credentialsProvider }));

    const userPoolId = await getUserPoolId();
    console.log(`   User Pool: ${userPoolId}\n`);
    
    let cognitoSub;
    let isNewUser = false;
    
    // Check if user exists
    try {
      console.log('🔍 Checking if user exists...');
      const existingUser = await cognito.send(new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      }));
      
      cognitoSub = existingUser.UserAttributes.find(a => a.Name === 'sub')?.Value;
      console.log(`   ✅ User exists (sub: ${cognitoSub})`);
      
      // Update attributes to super_admin
      console.log('📝 Updating user attributes to super_admin...');
      await cognito.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'custom:role', Value: 'super_admin' },
          { Name: 'custom:tenantId', Value: 'system' },
          { Name: 'custom:tenantName', Value: 'System' },
          { Name: 'name', Value: name },
        ],
      }));
      console.log('   ✅ User attributes updated');
      
    } catch (e) {
      if (e.name === 'UserNotFoundException') {
        console.log('   ℹ️  User does not exist, creating...');
        isNewUser = true;
        
        // Create new user
        const createResult = await cognito.send(new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: email,
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'name', Value: name },
            { Name: 'custom:role', Value: 'super_admin' },
            { Name: 'custom:tenantId', Value: 'system' },
            { Name: 'custom:tenantName', Value: 'System' },
          ],
          TemporaryPassword: tempPassword,
          DesiredDeliveryMediums: tempPassword ? [] : ['EMAIL'],
        }));
        
        cognitoSub = createResult.User.Attributes.find(a => a.Name === 'sub')?.Value;
        console.log(`   ✅ User created (sub: ${cognitoSub})`);
        
        // If password provided, set permanent password
        if (tempPassword) {
          await cognito.send(new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: email,
            Password: tempPassword,
            Permanent: true,
          }));
          console.log('   ✅ Password set as permanent');
        }
      } else {
        throw e;
      }
    }
    
    // Create/update TenantUsers record
    console.log('💾 Saving to TenantUsers table...');
    const now = new Date().toISOString();
    await dynamodb.send(new PutCommand({
      TableName: T_TENANT_USERS,
      Item: {
        cognitoSub,
        tenantId: 'system',
        tenantName: 'System',
        email,
        name,
        role: 'super_admin',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
      },
    }));
    console.log('   ✅ TenantUsers record saved');
    
    console.log('\n✨ Super Admin created/updated successfully!\n');
    
    if (isNewUser && !tempPassword) {
      console.log('📧 A temporary password has been sent to the email address.');
      console.log('   The user will need to change it on first login.\n');
    } else if (isNewUser && tempPassword) {
      console.log('🔑 User can login with the provided password.\n');
    }
    
    const loginUrl = STAGE === 'prod'
      ? 'https://dcs2jw5epa29y.cloudfront.net/login'
      : 'https://d3mydfxpimeym.cloudfront.net/login';
    console.log(`🌐 Login at: ${loginUrl}\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();
