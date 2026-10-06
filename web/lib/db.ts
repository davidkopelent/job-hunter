import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Connections per server instance. DATABASE_URL should be Supabase's transaction pooler (port 6543):
// serverless instances each open a pool, and the session pooler allows only 15 clients in total.
const POOL_SIZE = 3;

// One client per server instance (and across dev hot reloads).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: POOL_SIZE }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
