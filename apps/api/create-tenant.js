const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // 1. Criar o Tenant (oficina)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Minha Oficina',
      documentType: 'CNPJ',
      documentNumber: '12345678000199',
      cep: '01001000',
      address: 'Rua Exemplo, 123',
      email: 'oficina@exemplo.com',
      phone: '11999999999',
      status: 'ACTIVE',
    },
  });
  console.log('Tenant criado:', tenant);

  // 2. Verificar se o usuário admin já existe
  let user = await prisma.user.findUnique({
    where: { email: 'admin@exemplo.com' },
  });

  if (!user) {
    // Se não existir, criar com senha 123456
    const hashedPassword = await bcrypt.hash('123456', 10);
    user = await prisma.user.create({
      data: {
        email: 'admin@exemplo.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'OWNER',
        tenantId: tenant.id,
      },
    });
    console.log('Usuário criado e vinculado ao tenant:', user);
  } else {
    // Se existir, apenas atualizar o tenantId
    user = await prisma.user.update({
      where: { email: 'admin@exemplo.com' },
      data: { tenantId: tenant.id },
    });
    console.log('Usuário atualizado com tenantId:', user);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());