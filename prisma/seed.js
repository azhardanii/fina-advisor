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
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.category.deleteMany();
  await prisma.appSetting.deleteMany();

  // Seed Wallets
  const wallets = await Promise.all([
    prisma.wallet.create({ data: { name: 'Wallet Daily', balance: 500000, color: 'bg-blue-500', bankName: 'BCA', accountNumber: '234567823', accountName: 'Doni' } }),
    prisma.wallet.create({ data: { name: 'Osmo Nano', balance: 150000, color: 'bg-indigo-500', bankName: 'Neo Bank', accountNumber: '12342143', accountName: 'Budi' } }),
    prisma.wallet.create({ data: { name: 'Tabungan Nikah', balance: 12000000, color: 'bg-pink-500' } }),
    prisma.wallet.create({ data: { name: 'Wallet Touring', balance: 2500000, color: 'bg-green-500' } }),
    prisma.wallet.create({ data: { name: 'Dana Darurat', balance: 5000000, color: 'bg-red-500', bankName: 'Bibit', accountNumber: '421342212', accountName: 'Doni' } }),
  ]);
  console.log(`✅ Created ${wallets.length} wallets`);

  // Seed Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Makanan & Minuman', type: 'expense', color: 'bg-orange-500' } }),
    prisma.category.create({ data: { name: 'Transportasi', type: 'expense', color: 'bg-blue-500' } }),
    prisma.category.create({ data: { name: 'Belanja', type: 'expense', color: 'bg-pink-500' } }),
    prisma.category.create({ data: { name: 'Tagihan & Utilitas', type: 'expense', color: 'bg-purple-500' } }),
    prisma.category.create({ data: { name: 'Gaji', type: 'income', color: 'bg-green-500' } }),
    prisma.category.create({ data: { name: 'Bonus', type: 'income', color: 'bg-emerald-500' } }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Seed default settings
  await prisma.appSetting.create({ data: { key: 'activeAlgorithm', value: '50-30-20' } });
  await prisma.appSetting.create({ data: { key: 'customAlgorithmGroups', value: '[]' } });
  console.log('✅ Created default settings');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
