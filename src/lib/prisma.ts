import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@/generated/prisma/client";

// The Neon serverless driver talks over WebSockets. In a Node runtime there is
// no global WebSocket, so we point it at the `ws` package. (On the Edge runtime
// the platform's native WebSocket is used and this is ignored.)
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse a single PrismaClient across hot-reloads in dev to avoid exhausting
// database connections (Next.js re-evaluates modules on every change).
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const createPrismaClient = () =>
  new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
