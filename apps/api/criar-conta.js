const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  console.log('📝 Criando/atualizando tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { documentNumber: '00000000000191' },
    update: {},
    create: {
      name: 'Oficina Teste Conclaukey',
      documentType: 'CPF',
      documentNumber: '00000000000191',
      cep: '20256150',
      address: 'Rua Professor Eurico Rabelo',
      number: '105',
      complement: 'Maracanã',
      email: 'conclaukey@gmail.com',
      phone: '21999358533',
      status: 'ACTIVE',
      paymentStatus: 'PAID',
      trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (ID: ${tenant.id})`);
  const hashedPassword = await bcrypt.hash('456789', 10);
  const user = await prisma.user.upsert({
    where: { email: 'conclaukey@gmail.com' },
    update: {},
    create: {
      name: 'Conclaukey Teste',
      email: 'conclaukey@gmail.com',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: tenant.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Usuário: ${user.name} (${user.email})`);
  console.log(`🔑 Senha: 456789`);
  console.log(`💳 Status da assinatura: PAGO (PAID)`);
}
main()
  .catch(e => console.error('❌ Erro:', e))
  .finally(() => prisma.$disconnect());
