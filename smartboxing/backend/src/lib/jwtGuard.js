export function assertFreshJwt(claims, maxAgeSeconds = 240) { // 4 min
  const now = Math.floor(Date.now()/1000);
  const iat = Number(claims.iat || 0);
  const exp = Number(claims.exp || 0);
  if (!iat || !exp) {
    const e = new Error("Invalid token");
    e.statusCode = 401; throw e;
  }
  if (now >= exp) { const e = new Error("Token expired"); e.statusCode = 401; throw e; }
  if ((now - iat) > maxAgeSeconds) { const e = new Error("Token too old"); e.statusCode = 401; throw e; }
}
