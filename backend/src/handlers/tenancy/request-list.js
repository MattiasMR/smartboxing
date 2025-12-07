/**
 * Tenancy Request - List requests
 * - Super admin: See all requests
 * - Regular user: See only their own requests
 */

import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { extractUser, ROLES } from '../../lib/auth.js';
import { doc } from '../../lib/db.js';

const T_TENANCY_REQUESTS = process.env.T_TENANCY_REQUESTS;

export const main = handler(async (event) => {
  const user = extractUser(event);
  
  if (!user) {
    const error = new Error('Must be authenticated');
    error.statusCode = 401;
    throw error;
  }
  
  const statusFilter = event.queryStringParameters?.status; // pending, approved, rejected
  const onlyMine = event.queryStringParameters?.onlyMine === 'true'; // Force showing only user's requests
  
  let requests = [];
  
  // If onlyMine is true OR user is not super_admin, show only their requests
  if (onlyMine || user.role !== ROLES.SUPER_ADMIN) {
    // User sees only their requests
    const result = await doc.send(new QueryCommand({
      TableName: T_TENANCY_REQUESTS,
      IndexName: 'ByRequester',
      KeyConditionExpression: 'requestedBy = :userId',
      ExpressionAttributeValues: { ':userId': user.sub },
    }));
    requests = result.Items || [];
    
    if (statusFilter) {
      requests = requests.filter(r => r.status === statusFilter);
    }
  } else {
    // Super admin sees all requests (when onlyMine is false/not set)
    let params = {
      TableName: T_TENANCY_REQUESTS,
    };
    
    if (statusFilter) {
      params = {
        ...params,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': statusFilter },
      };
    }
    
    const result = await doc.send(new ScanCommand(params));
    requests = result.Items || [];
  }
  
  // Sort by createdAt descending
  requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return {
    requests,
    count: requests.length,
  };
}, 'listTenancyRequests');
