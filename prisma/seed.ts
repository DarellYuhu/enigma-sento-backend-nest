import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

faker.seed(42);

const prisma = new PrismaClient();
async function main() {
  await prisma.user.create({
    data: {
      displayName: 'Sento Admin',
      username: 'sentoadmin',
      password: await Bun.password.hash('sentoadmin', {
        cost: 10,
        algorithm: 'bcrypt',
      }),
      role: 'MANAGER',
    },
  });
  await prisma.user.create({
    data: {
      displayName: 'Sento Creator',
      username: 'sentocreator',
      password: await Bun.password.hash('sentocreator', {
        cost: 10,
        algorithm: 'bcrypt',
      }),
      role: 'CREATOR',
    },
  });
  await prisma.user.create({
    data: {
      displayName: 'Sento Distributor',
      username: 'sentodistributor',
      password: await Bun.password.hash('sentodistributor', {
        cost: 10,
        algorithm: 'bcrypt',
      }),
      role: 'DISTRIBUTOR',
    },
  });
  await prisma.user.createMany({
    data: await Promise.all(
      Array.from({ length: 10 }).map(async () => ({
        displayName: faker.person.fullName(),
        username: faker.internet.username(),
        password: await Bun.password.hash('sentodistributor', {
          cost: 10,
          algorithm: 'bcrypt',
        }),
        role: 'CREATOR' as const,
      })),
    ),
    skipDuplicates: true,
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
