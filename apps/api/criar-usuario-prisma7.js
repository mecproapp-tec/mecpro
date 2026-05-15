import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const usuario = await prisma.usuario.upsert({
      where: { email: 'thiago230387@hotmail.com' },
      update: {
        nome: 'Thiago',
        senha: '123456',
        telefone: '21999358534',
        endereco: 'rua marechal jose bevilaqua 342 taquara',
        cep: '22730230'
      },
      create: {
        email: 'thiago230387@hotmail.com',
        senha: '123456',
        nome: 'Thiago',
        telefone: '21999358534',
        endereco: 'rua marechal jose bevilaqua 342 taquara',
        cep: '22730230',
        criadoEm: new Date(),
        atualizadoEm: new Date()
      }
    })
    
    console.log('✅ Usuário criado:', usuario.email)
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()