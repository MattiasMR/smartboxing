// Uso: node scripts/seed.cjs --tenant=demo --userSub=<SUB> [--region=us-east-1]
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const args = Object.fromEntries(process.argv.slice(2).map(p => {
  const [k,v] = p.split("="); return [k.replace(/^--/,""), v ?? true];
}));

const REGION   = args.region || process.env.AWS_REGION || "us-east-1";
const TENANT   = args.tenant || "demo";
const USER_SUB = args.userSub;

if (!USER_SUB) {
  console.error("Falta --userSub=<Cognito sub del usuario>");
  process.exit(1);
}

const T_CLIENTSET = process.env.T_CLIENTSET || "smartboxing-node-ClientSettings-dev";
const T_USERSET   = process.env.T_USERSET   || "smartboxing-node-UserSettings-dev";

const ddb = new DynamoDBClient({ region: REGION });
const doc = DynamoDBDocumentClient.from(ddb, { marshallOptions: { removeUndefinedValues: true } });

async function main() {
  console.log("Cargando ClientSettings…");
  await doc.send(new PutCommand({
    TableName: T_CLIENTSET,
    Item: {
      tenantId: TENANT,
      settings: {
        brandText: "Smartboxing Demo",
        primaryColor: "#0ea5e9",
        secondaryColor: "#0369a1",
        logoUrl: "https://via.placeholder.co/200x40?text=Demo",
        dateFormat: "YYYY-MM-DD",
        timeSlotMinutes: 30
      }
    }
  }));

  console.log("Cargando UserSettings…");
  await doc.send(new PutCommand({
    TableName: T_USERSET,
    Item: {
      userKey: `${TENANT}#${USER_SUB}`,
      settings: {
        theme: "dark",
        preferredStartHour: "08:00",
        dashboardCards: ["boxes","doctors","agenda"]
      }
    }
  }));

  console.log("SEED OK ✅");
}

main().catch(e => { console.error(e); process.exit(1); });
