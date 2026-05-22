import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@mecprotec.br';
  const password = 'admin123';
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, updatedAt: new Date() },
    create: {
      email,
      password: hashed,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      adminApproval: 'APPROVED',
    },
  });

  console.log(`✅ Usuário ${user.email} (ID: ${user.id}) criado/atualizado com sucesso.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());