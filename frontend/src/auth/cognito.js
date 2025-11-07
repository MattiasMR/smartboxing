// Cognito configuration from environment variables
const clientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;
const domain = import.meta.env.VITE_COGNITO_DOMAIN; 
const redirectUri = import.meta.env.VITE_REDIRECT_URI; 

export function loginUrl() {
  const p = new URLSearchParams({
    client_id: clientId,
    response_type: 'token', 
    scope: 'openid email profile',
    redirect_uri: redirectUri,
  });
  return `${domain}/oauth2/authorize?${p.toString()}`;
}

export function logoutUrl() {
  const logoutRedirect = redirectUri.replace('/callback', '/login');
  const p = new URLSearchParams({
    client_id: clientId,
    logout_uri: logoutRedirect,
  });
  return `${domain}/logout?${p.toString()}`;
}

export function parseHashToTokens(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const id_token = params.get('id_token');
  const access_token = params.get('access_token');
  const expires_in = Number(params.get('expires_in') || '3600');
  return { id_token, access_token, expires_in };
}
