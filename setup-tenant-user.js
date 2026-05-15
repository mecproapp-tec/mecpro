const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {

  const tenant = await prisma.tenant.create({
    data: {
      name: "CONCLAU IBERICA",
      documentType: "CPF",
      documentNumber: "12345678914",
      cep: "22730230",
      address: "Rua Marechal Jose Bevilacqua",
      number: "342",
      complement: "Loja",
      email: 'admin2@mecproteste.com',
      phone: "21999999999",
      status: "ACTIVE",
      paymentStatus: "pending"
    }
  });

  console.log("TENANT CREATED:");
  console.log(tenant);

  const user = await prisma.user.create({
    data: {
      name: "Thiago",
      email: "thiago230387@hotmail.com",
      password: "$2b$10$X7jQ0U8wV7m4u0J8h4H8UeT5h4H8UeT5h4H8UeT5h4H8UeT5h4H8U",
      role: "OWNER",
      status: "ACTIVE",
      tenantId: tenant.id
    }
  });

  console.log("USER CREATED:");
  console.log(user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });