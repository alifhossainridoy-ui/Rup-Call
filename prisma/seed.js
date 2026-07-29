const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rupzone.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const employeeEmail = 'employee@rupzone.local';
  const employeePassword = 'ChangeMe123!';

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn(
      '⚠️  WARNING: ADMIN_EMAIL and ADMIN_PASSWORD environment variables not set.'
    );
    console.warn(`   Using defaults: ${adminEmail} / ${adminPassword}`);
    console.warn('   Set these in .env before production use.\n');
  }

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const employeeHash = await bcrypt.hash(employeePassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin',
      email: adminEmail,
      passwordHash: adminHash,
      role: 'ADMIN',
      active: true,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: employeeEmail },
    update: {},
    create: {
      name: 'Employee',
      email: employeeEmail,
      passwordHash: employeeHash,
      role: 'EMPLOYEE',
      active: true,
    },
  });

  console.log('✓ Seed complete');
  console.log(`  Admin: ${admin.email}`);
  console.log(`  Employee: ${employee.email}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
