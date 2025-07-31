import { Format, PrismaClient } from "@/generated/prisma";
import { FormatDescriptions } from "@/types";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    // { seed formats }
    const formatDescriptions = Object.values(FormatDescriptions);
    for (let index = 0; index < formatDescriptions.length; index++) {
      const format: Format = {
        id: index,
        name: formatDescriptions[index],
      };
      await tx.format.upsert({
        where: { id: index },
        update: format,
        create: format,
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
