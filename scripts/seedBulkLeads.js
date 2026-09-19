const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBulkLeads() {
  console.log('📦 Seeding 10,000 test leads...\n');

  try {
    // Get or create test employees
    const employees = [];
    for (let i = 1; i <= 5; i++) {
      const emp = await prisma.user.upsert({
        where: { email: `employee${i}@test.local` },
        update: {},
        create: {
          name: `Test Employee ${i}`,
          email: `employee${i}@test.local`,
          passwordHash: 'test',
          role: 'EMPLOYEE',
          active: true,
        },
      });
      employees.push(emp);
    }

    console.log(`✓ Created/found ${employees.length} test employees\n`);

    const statuses = ['NEW', 'CALLED_NO_ANSWER', 'CALLED_INTERESTED', 'CALLED_NOT_INTERESTED', 'FOLLOW_UP_LATER', 'CONFIRMED', 'CANCELLED'];
    const courierStatuses = ['PENDING', 'CONFIRMED', 'DELIVERED', 'FAILED', 'CANCELLED'];

    const batchSize = 500;
    const totalLeads = 10000;

    let created = 0;

    for (let i = 0; i < totalLeads; i += batchSize) {
      const customersData = [];
      const leadsData = [];

      const endIdx = Math.min(i + batchSize, totalLeads);
      for (let j = i; j < endIdx; j++) {
        const custNum = String(j).padStart(5, '0');
        customersData.push({
          name: `Bulk Customer ${custNum}`,
          phone: `017${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          address: `Address ${custNum}`,
        });
      }

      // Batch create customers
      const customers = await Promise.all(
        customersData.map((data) =>
          prisma.customer.create({ data })
        )
      );

      // Create leads
      for (let k = 0; k < customers.length; k++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = Math.floor(Math.random() * 5000) + 500;
        const priority = Math.floor(Math.random() * 100);
        const employeeIdx = Math.floor(Math.random() * employees.length);

        leadsData.push({
          customerId: customers[k].id,
          status,
          priority,
          confirmedAmount: ['CONFIRMED', 'CANCELLED'].includes(status) ? amount : 0,
          assignedToId: Math.random() > 0.3 ? employees[employeeIdx].id : null,
          courierStatus: Math.random() > 0.5 ? courierStatuses[Math.floor(Math.random() * courierStatuses.length)] : null,
          followUpAt: status === 'FOLLOW_UP_LATER' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          confirmedAt: status === 'CONFIRMED' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        });
      }

      // Batch create leads
      await Promise.all(
        leadsData.map((data) =>
          prisma.lead.create({ data })
        )
      );

      created += customers.length;
      const progress = Math.min(created, totalLeads);
      console.log(`✓ Created ${progress}/${totalLeads} leads...`);
    }

    console.log(`\n✓ Successfully created ${totalLeads} test leads`);

    // Print stats
    const stats = await prisma.lead.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    console.log('\nLead distribution by status:');
    stats.forEach((stat) => {
      console.log(`  ${stat.status}: ${stat._count.id}`);
    });

    const empStats = await prisma.lead.groupBy({
      by: ['assignedToId'],
      _count: { id: true },
      where: { assignedToId: { not: null } },
    });

    console.log('\nAssignments by employee:');
    for (const stat of empStats) {
      const emp = await prisma.user.findUnique({
        where: { id: stat.assignedToId },
        select: { name: true },
      });
      console.log(`  ${emp.name}: ${stat._count.id}`);
    }
  } catch (err) {
    console.error('✗ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedBulkLeads();
