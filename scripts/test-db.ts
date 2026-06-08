// Standalone DB connectivity test. Run with: npx tsx scripts/test-db.ts
// Verifies the Neon connection, the applied schema, and the seeded data.
import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

// Neon's serverless driver talks over WebSockets; provide one for Node.
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  // 1. Raw connectivity check.
  const ping = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
  console.log(`✅ Connected — ping returned ok=${ping[0]?.ok}`);

  // 2. Row counts across every model (also proves the schema is in place).
  const [users, items, collections, tags, itemTypes] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
    prisma.itemType.count(),
  ]);
  console.log("📊 Row counts:", {
    users,
    items,
    collections,
    tags,
    itemTypes,
  });

  // 3. Confirm the system item types were seeded.
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true, userId: null },
    orderBy: { name: "asc" },
    select: { name: true, icon: true, color: true },
  });
  console.log(`🌱 System item types (${systemTypes.length}):`);
  for (const t of systemTypes) {
    console.log(`   • ${t.name.padEnd(8)} ${t.icon.padEnd(10)} ${t.color}`);
  }

  if (systemTypes.length !== 7) {
    throw new Error(
      `Expected 7 system item types, found ${systemTypes.length}. Run "npm run db:seed".`,
    );
  }

  console.log("\n✅ Database test passed.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("❌ Database test failed:");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
