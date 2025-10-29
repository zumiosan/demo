import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Resetting database without seeding...');

  await prisma.interview.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.agentBank.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database reset completed.');
}

main()
  .catch((error) => {
    console.error('Database reset failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
