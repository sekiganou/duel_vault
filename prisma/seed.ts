import { PrismaClient, table_name } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < 5; index++) {
      await tx.table_name.upsert({
        where: { id: index },
        update: {
          id: index,
          name: "test".concat("_", index.toString()),
        },
        create: {
          id: index,
          name: "test".concat("_", index.toString()),
          create_time: new Date(),
        },
      });
    }
  });
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
