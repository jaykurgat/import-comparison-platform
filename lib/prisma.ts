import { PrismaClient } from '@prisma/client'

// In serverless environments (Vercel) and in Next.js dev mode (hot reload),
// creating a new PrismaClient on every import/request exhausts your database
// connection pool very quickly. This pattern reuses a single instance across
// hot reloads and warm serverless invocations.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
