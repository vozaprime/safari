import { PrismaClient } from "@prisma/client";
import { applyPoolLimits } from "./dbUrl";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Havuz sınırı burada, şemada değil: `schema.prisma` ham `DATABASE_URL`'i
// okumaya devam eder, böylece `prisma migrate`/`db push` sınırsız doğrudan
// bağlantıyı kullanır. Sınır yalnızca uygulamanın çalışma zamanına uygulanır.
// Gerekçesi ve havuzlu dizeye geçişte ne olacağı için bkz. `./dbUrl`.
const datasourceUrl = applyPoolLimits(process.env.DATABASE_URL, process.env);

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
