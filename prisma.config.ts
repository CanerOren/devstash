// Prisma 7 config. Environment variables are NOT auto-loaded by the CLI,
// so we import dotenv here to read .env when running `prisma` commands.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations use a DIRECT (unpooled) Neon connection when available —
    // pooled connections (PgBouncer) can break migrate's advisory locks.
    // Falls back to DATABASE_URL if DIRECT_URL is not set.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
