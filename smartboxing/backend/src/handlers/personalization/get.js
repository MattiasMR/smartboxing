// CommonJS
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb, { marshallOptions: { removeUndefinedValues: true } });

const T_CLIENTSET = process.env.T_CLIENTSET;
const T_USERSET   = process.env.T_USERSET;

exports.handler = async (event) => {
  try {
    const claims = (event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.jwt && event.requestContext.authorizer.jwt.claims) || {};
    // Si aún no usas multi-tenant, asumimos "demo"
    const tenantId = claims["custom:tenantId"] || "demo";
    const userSub  = claims.sub;

    const [clientRes, userRes] = await Promise.all([
      doc.send(new GetCommand({ TableName: T_CLIENTSET, Key: { tenantId } })),
      doc.send(new GetCommand({ TableName: T_USERSET, Key: { userKey: `${tenantId}#${userSub}` } }))
    ]);

    const settings = { ...(clientRes.Item?.settings || {}), ...(userRes.Item?.settings || {}) };
    return {
      statusCode: 200,
      body: JSON.stringify({ tenantId, userSub, settings })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal Error" }) };
  }
};
