const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createOrUpdateAdmin() {
  const email = 'admin@mecpro.tec.br';
  const password = 'Nanagauz';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email }
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('✅ Usuário administrador atualizado com sucesso!');
  } else {
    // Cria um tenant administrativo se não existir
    let adminTenant = await prisma.tenant.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000001' }
    });
    if (!adminTenant) {
      adminTenant = await prisma.tenant.create({
        data: {
          id: '00000000-0000-0000-0000-000000000001',
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
    }

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Administrador',
        tenantId: adminTenant.id,
      },
    });
    console.log('✅ Usuário administrador criado com sucesso!');
  }
}

createOrUpdateAdmin()
  .catch(e => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());