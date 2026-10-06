import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma only reads the schema (`prisma db pull`) and generates the client.
// The schema is owned by SQL migrations in ../supabase/migrations; never run `prisma migrate`.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: env("DATABASE_URL") },
});
