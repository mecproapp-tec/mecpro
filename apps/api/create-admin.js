const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const ADMIN_TENANT_ID = '00000000-0000-0000-0000-000000000001';
  let tenant = await prisma.tenant.findUnique({ where: { id: ADMIN_TENANT_ID } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: ADMIN_TENANT_ID,
        name: 'Administração',
        documentType: 'ADMIN',
        documentNumber: '00000000000000',
        cep: '00000000',
        address: 'Sistema',
        email: 'admin@mecpro.com',
        phone: '0000000000',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Tenant criado');
  }
  const hashed = await bcrypt.hash('123456', 10);
  const existing = await prisma.user.findFirst({ where: { email: 'conclaukey@gmail.com' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: 'TFO',
        email: 'conclaukey@gmail.com',
        password: hashed,
        role: 'SUPER_ADMIN',
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Super admin criado com email conclaukey@gmail.com / senha 123456');
  } else {
    console.log('⚠️ Usuário já existe');
  }
}
main().catch(console.error).finally(() => prisma.\());
