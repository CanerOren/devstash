// Deletes every user EXCEPT demo@devstash.io, along with all of their content.
//
// Run with: npx tsx scripts/prune-users.ts
//
// Deleting a User cascades to that user's items, collections, tags, accounts,
// sessions, and custom item types (all relations are onDelete: Cascade, except
// the system item types which have userId = null and are left untouched).
// VerificationToken rows have no FK to User, so they're cleaned up separately by
// matching on the email identifier.
//
// SAFETY: targets whatever DATABASE_URL points at — make sure that's your Neon
// DEVELOPMENT branch, never production. The script aborts if the demo user
// isn't found (a guard against pointing at the wrong/empty database).
import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const KEEP_EMAIL = "demo@devstash.io";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

// Mask credentials but show the host so it's clear which branch is targeted.
function targetHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}

async function main() {
  console.log(`🔌 Target database host: ${targetHost(connectionString!)}`);

  // Guard: refuse to run if the user we're keeping doesn't exist.
  const demo = await prisma.user.findUnique({
    where: { email: KEEP_EMAIL },
    select: { id: true, email: true },
  });
  if (!demo) {
    throw new Error(
      `Aborting: keep-user "${KEEP_EMAIL}" not found. Refusing to delete to avoid wiping the wrong database. Run "npm run db:seed" first if this is intended.`,
    );
  }

  const toDelete = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (toDelete.length === 0) {
    console.log(`✅ Nothing to do — ${KEEP_EMAIL} is the only user.`);
    return;
  }

  console.log(`\n🗑️  Deleting ${toDelete.length} user(s) and all their content:`);
  for (const u of toDelete) {
    console.log(`   • ${u.email}${u.name ? ` (${u.name})` : ""}`);
  }

  const idsToDelete = toDelete.map((u) => u.id);
  const emailsToDelete = toDelete.map((u) => u.email);

  // Cascade deletes handle items/collections/tags/accounts/sessions/custom types.
  const { count: deletedUsers } = await prisma.user.deleteMany({
    where: { id: { in: idsToDelete } },
  });

  // VerificationToken has no FK to User — clean up tokens for the deleted emails.
  const { count: deletedTokens } = await prisma.verificationToken.deleteMany({
    where: { identifier: { in: emailsToDelete } },
  });

  console.log(
    `\n✅ Done. Deleted ${deletedUsers} user(s) and ${deletedTokens} verification token(s). Kept ${KEEP_EMAIL}.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("❌ prune-users failed:");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
