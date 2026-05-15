import { PrismaClient } from '@prisma/client';

// Garantir que a URL está definida
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:Vasco@2026@localhost:5432/mecpro?schema=public";

// Forçar no environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

export const prisma = new PrismaClient();