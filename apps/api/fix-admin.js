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
    // Atualiza senha e role para ADMIN
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('✅ Usuário administrador atualizado com sucesso!');
  } else {
    // Cria novo admin
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Administrador'
      }
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