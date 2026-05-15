const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearRefreshToken() {
  const deleted = await prisma.$executeRawUnsafe('DELETE FROM "RefreshToken";');
  console.log(`✅ ${deleted} registros deletados da tabela RefreshToken.`);
}

clearRefreshToken()
  .catch(console.error)
  .finally(() => prisma.$disconnect());