import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@mecprotec.br';
  const newPassword = 'admin123';
  const hashed = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email }, // ou { id: 3 }
    data: { password: hashed, updatedAt: new Date() },
  });

  console.log(`✅ Senha atualizada para ${user.email} (role: ${user.role})`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());