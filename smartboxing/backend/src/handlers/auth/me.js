// backend/src/handlers/auth/me.js  (CommonJS)
exports.handler = async (event) => {
  const claims = (event && event.requestContext && event.requestContext.authorizer &&
                  event.requestContext.authorizer.jwt &&
                  event.requestContext.authorizer.jwt.claims) || {};
  return { statusCode: 200, body: JSON.stringify({ claims }) };
};
