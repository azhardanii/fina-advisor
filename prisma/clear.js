const { PrismaClient } = require('@prisma/client');

// Use direct URL for seeding (bypass PgBouncer)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🧹 Clearing database...');

  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.category.deleteMany();
  await prisma.appSetting.deleteMany();

  console.log('✅ Database cleared!');
}

main()
  .catch((e) => {
    console.error('❌ Clear error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
