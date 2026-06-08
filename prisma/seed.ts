import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

// Neon serverless driver talks over WebSockets; provide one for the Node runtime.
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

// The seven built-in item types. System types have userId = null and
// isSystem = true (cannot be edited or deleted by users).
// Mirrors the "Item Types" table in context/project-overview.md.
const SYSTEM_ITEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
];

async function main() {
  for (const type of SYSTEM_ITEM_TYPES) {
    // Idempotent by hand: the (name, userId) unique index treats NULL userIds
    // as distinct in Postgres, so upsert can't dedupe system types.
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });

    if (existing) {
      await prisma.itemType.update({
        where: { id: existing.id },
        data: { icon: type.icon, color: type.color, isSystem: true },
      });
    } else {
      await prisma.itemType.create({
        data: { ...type, isSystem: true, userId: null },
      });
    }
  }

  console.log(`Seeded ${SYSTEM_ITEM_TYPES.length} system item types.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
