import { PrismaClient, table_name } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const tests = new Array<table_name>();
    for (let index = 0; index < 5; index++) {
      tests.push({
        id: index,
        name: "test".concat("_", index.toString()),
        create_time: new Date(),
      });
    }
    await tx.table_name.createMany({
      data: tests,
    });
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
