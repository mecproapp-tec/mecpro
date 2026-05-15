const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Dados da oficina (tenant)
  const tenantData = {
    name: 'Conclau Ibérica',
    documentType: 'CPF',
    documentNumber: '12368246797',
    cep: '22730230',
    address: 'Rua Marechal José Bevilaqua, 342 - Taquara',
    email: 'thiago230387@hotmail.com',
    phone: '21999358534',
    status: 'ACTIVE',
    paymentStatus: 'paid',           // ← pago!
    trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
  };

  // Upsert: cria se não existe, atualiza se já existe (pelo email)
  const tenant = await prisma.tenant.upsert({
    where: { email: tenantData.email },
    update: tenantData,
    create: tenantData,
  });

  console.log('✅ Tenant salvo:', tenant.id, tenant.name, 'Pagamento:', tenant.paymentStatus);

  // Dados do usuário (com hash da senha que você forneceu)
  const userData = {
    email: 'thiago230387@hotmail.com',
    password: '$2a$10$Nuae1qaBW1snetP4bNs5XOI/efpob3fQm4DMdrzA.jpC.moJscQkW',
    name: 'Thiago',
    role: 'OWNER',
    tenantId: tenant.id,
  };

  const user = await prisma.user.upsert({
    where: { email: userData.email },
    update: {
      password: userData.password,
      name: userData.name,
      tenantId: tenant.id,
    },
    create: userData,
  });

  console.log('✅ Usuário salvo:', user.email, 'tenantId:', user.tenantId);

  // Exibe status atualizado do tenant
  const check = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    select: { name: true, paymentStatus: true, status: true, trialEndsAt: true }
  });
  console.log('\n📋 Situação do Tenant:', check);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());