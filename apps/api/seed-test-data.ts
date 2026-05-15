// apps/api/seed-test-data.ts
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de dados de teste...');

  // 1. Garantir que existe um tenant administrador (para o admin)
  const adminTenantId = '00000000-0000-0000-0000-000000000001';
  let adminTenant = await prisma.tenant.findUnique({ where: { id: adminTenantId } });
  if (!adminTenant) {
    adminTenant = await prisma.tenant.create({
      data: {
        id: adminTenantId,
        name: 'Administração MecPro',
        documentType: 'ADMIN',
        documentNumber: '00000000000000',
        cep: '00000000',
        address: 'Sistema',
        email: 'admin@mecpro.com',
        phone: '0000000000',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Tenant admin criado');
  }

  // 2. Garantir que existe um super admin
  const adminEmail = 'admin@mecpro.com';
  let superAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!superAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        tenantId: adminTenant.id,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Super admin criado (admin@mecpro.com / admin123)');
  } else {
    // Garantir que a role seja SUPER_ADMIN
    if (superAdmin.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: superAdmin.id },
        data: { role: 'SUPER_ADMIN' },
      });
      console.log('✅ Role do admin atualizada para SUPER_ADMIN');
    }
  }

  // 3. Criar um tenant de exemplo (para ter dados no admin)
  const tenantId = randomUUID();
  const existingTenant = await prisma.tenant.findFirst({
    where: { name: 'Oficina Exemplo' },
  });
  if (!existingTenant) {
    const tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Oficina Exemplo',
        documentType: 'CNPJ',
        documentNumber: '12345678000199',
        cep: '01001000',
        address: 'Rua Exemplo, 100',
        email: 'contato@oficinaexemplo.com',
        phone: '11999999999',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Tenant de exemplo criado:', tenant.name);

    // 4. Criar um cliente para esse tenant
    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        name: 'Cliente Teste João',
        phone: '11988888888',
        vehicle: 'Civic',
        plate: 'ABC1234',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Cliente criado:', client.name);

    // 5. Criar uma fatura
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        number: 'FAT-001',
        total: 350.5,
        status: 'PENDING',
        createdAt: new Date(),
        items: {
          create: [
            {
              description: 'Troca de óleo',
              quantity: 1,
              price: 150.0,
              total: 150.0,
            },
          ],
        },
      },
    });
    console.log('✅ Fatura criada:', invoice.number);

    // 6. Criar um orçamento
    const estimate = await prisma.estimate.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        total: 350.5,
        status: 'DRAFT',
        date: new Date(),
        items: {
          create: [
            {
              description: 'Troca de óleo',
              quantity: 1,
              price: 150.0,
              total: 150.0,
            },
          ],
        },
      },
    });
    console.log('✅ Orçamento criado:', estimate.id);
  } else {
    console.log('⚠️ Tenant de exemplo já existe, dados não duplicados.');
  }

  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });