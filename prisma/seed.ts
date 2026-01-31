import { prisma } from "../src/shared/prisma.js";
const seed = async () => {
  await prisma.user.createMany({
    data: [
      {
        firstName: "Ahmed",
        lastName: "Hassan",
        email: "ahmed.hassan@example.com",
        phone: "+201012345678",
        password: "$2b$10$hashedpassword1",
      },
      {
        firstName: "Sara",
        lastName: "Mohamed",
        email: "sara.mohamed@example.com",
        phone: "+201098765432",
        password: "$2b$10$hashedpassword2",
      },
      {
        firstName: "Omar",
        lastName: "Ali",
        email: "omar.ali@example.com",
        phone: "+201055566677",
        password: "$2b$10$hashedpassword3",
      },
      {
        firstName: "Mona",
        lastName: "Youssef",
        email: "mona.youssef@example.com",
        phone: "+201022233344",
        password: "$2b$10$hashedpassword4",
      },
      {
        firstName: "Khaled",
        lastName: "Sayed",
        email: "khaled.sayed@example.com",
        phone: "+201066677788",
        password: "$2b$10$hashedpassword5",
      },
    ],
  });
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
