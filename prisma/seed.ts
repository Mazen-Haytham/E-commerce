import { prisma } from "../src/shared/prisma.js";
const seed = async () => {
  await prisma.user.create
};
seed()
  .then(() => {
    prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
