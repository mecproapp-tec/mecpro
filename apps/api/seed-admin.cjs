const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@mecprotec.br';
  const adminPassword = 'sua-senha-aqui'; // Defina uma senha forte

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN', // ou o campo correspondente no seu modelo
      },
    });
    console.log('✅ Admin criado com sucesso!');
  } else {
    console.log('ℹ️ Admin já existe no banco.');
  }
}

main()
  .catch(e => {
    console.error('❌ Erro ao criar admin:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());