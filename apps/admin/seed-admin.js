const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Vasco2026@', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'mecpro@tec.br' },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      tenantId: null, // admin global não tem tenant
    },
    create: {
      email: 'mecpro@tec.br',
      name: 'Admin MecPro',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      tenantId: null,
    },
  });
  console.log('Admin user:', admin);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());