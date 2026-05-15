const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Dados do tenant (oficina)
  const tenantData = {
    id: randomUUID(),
    name: 'Oficina Teste MecPro',
    documentType: 'CNPJ',
    documentNumber: '12.345.678/0001-90',
    cep: '01001-000',
    address: 'Rua Exemplo, 123 - Centro, São Paulo/SP',
    email: 'thiago230387@hotmail.com',
    phone: '(11) 99999-9999',
    status: 'ACTIVE',
    paymentStatus: 'active',
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
  };

  // Criar ou obter tenant
  let tenant = await prisma.tenant.findUnique({
    where: { email: tenantData.email },
  });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: tenantData });
    console.log(`✅ Tenant criado: ${tenant.name} (${tenant.id})`);
  } else {
    console.log(`ℹ️ Tenant já existe: ${tenant.name}`);
  }

  // Dados do usuário proprietário
  const hashedPassword = await bcrypt.hash('123456', 10);
  const userData = {
    name: 'Thiago',
    email: 'thiago230387@hotmail.com',
    password: hashedPassword,
    role: 'OWNER',
    tenantId: tenant.id,
  };

  // Criar usuário se não existir
  let user = await prisma.user.findUnique({
    where: { email: userData.email },
  });
  if (!user) {
    user = await prisma.user.create({ data: userData });
    console.log(`✅ Usuário criado: ${user.name} (${user.email})`);
  } else {
    console.log(`ℹ️ Usuário já existe: ${user.email}`);
  }

  console.log('\n🎉 Seed concluída!');
  console.log('📝 Credenciais:');
  console.log(`   Email: thiago230387@hotmail.com`);
  console.log(`   Senha: 123456`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());