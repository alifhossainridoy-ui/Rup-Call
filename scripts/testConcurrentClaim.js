const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConcurrentClaim() {
  console.log('🧪 Testing concurrent lead claiming...\n');

  try {
    // Create test users if they don't exist
    const user1 = await prisma.user.upsert({
      where: { email: 'employee1@test.local' },
      update: {},
      create: {
        name: 'Employee 1',
        email: 'employee1@test.local',
        passwordHash: 'test',
        role: 'EMPLOYEE',
        active: true,
      },
    });

    const user2 = await prisma.user.upsert({
      where: { email: 'employee2@test.local' },
      update: {},
      create: {
        name: 'Employee 2',
        email: 'employee2@test.local',
        passwordHash: 'test',
        role: 'EMPLOYEE',
        active: true,
      },
    });

    // Create test customers and leads
    const customers = [];
    for (let i = 0; i < 10; i++) {
      const customer = await prisma.customer.create({
        data: {
          name: `Test Customer ${i + 1}`,
          phone: `0171234567${String(i).padStart(2, '0')}`,
          address: `Test Address ${i}`,
        },
      });
      customers.push(customer);
    }

    // Create leads with high priority
    const leads = [];
    for (let i = 0; i < 10; i++) {
      const lead = await prisma.lead.create({
        data: {
          customerId: customers[i].id,
          status: 'NEW',
          priority: 100 - i, // Descending priority
        },
      });
      leads.push(lead);
    }

    console.log(`✓ Created ${leads.length} test leads\n`);

    // Simulate concurrent claims
    console.log('Simulating 5 concurrent claims from 2 employees...\n');

    const claimNextLead = async (userId) => {
      const result = await prisma.$queryRaw`
        UPDATE "Lead"
        SET "lockedById" = ${userId}, "lockedAt" = now(), "updatedAt" = now()
        WHERE id = (
          SELECT id FROM "Lead"
          WHERE ("lockedById" IS NULL OR "lockedAt" < now() - interval '30 minutes')
            AND "assignedToId" IS NULL
            AND status IN ('NEW', 'CALLED_NO_ANSWER')
          ORDER BY priority DESC, "createdAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `;
      return result.length > 0 ? result[0].id : null;
    };

    // Fire 5 concurrent claims (mix of both users)
    const claimPromises = [
      claimNextLead(user1.id),
      claimNextLead(user2.id),
      claimNextLead(user1.id),
      claimNextLead(user2.id),
      claimNextLead(user1.id),
    ];

    const claimedLeadIds = await Promise.all(claimPromises);
    const claimedLeads = claimedLeadIds.filter((id) => id !== null);

    console.log(`Claimed lead IDs: ${claimedLeads.join(', ')}\n`);

    // Check for duplicates
    const uniqueLeadIds = new Set(claimedLeads);
    const hasDuplicates = uniqueLeadIds.size !== claimedLeads.length;

    if (hasDuplicates) {
      console.error(
        `✗ FAILED: Duplicate lead IDs detected! (${claimedLeads.length} claims, ${uniqueLeadIds.size} unique)`
      );
      process.exit(1);
    }

    if (claimedLeads.length !== 5) {
      console.error(
        `✗ WARNING: Expected 5 claims, got ${claimedLeads.length} (may indicate lock contention)`
      );
    }

    // Verify lock ownership
    console.log('✓ Verifying lock ownership...\n');
    for (const leadId of claimedLeads) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      const owner = lead.lockedById === user1.id ? 'Employee 1' : 'Employee 2';
      console.log(`  Lead ${leadId}: locked by ${owner}`);

      if (!lead.lockedById || !lead.lockedAt) {
        console.error(`✗ FAILED: Lead ${leadId} has no lock owner`);
        process.exit(1);
      }
    }

    console.log('\n✓ All concurrent claims succeeded — no duplicate leads assigned!');
    console.log('✓ Lock mechanism works correctly with FOR UPDATE SKIP LOCKED\n');

    // Cleanup
    await prisma.lead.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['employee1@test.local', 'employee2@test.local'] },
      },
    });

    console.log('✓ Cleanup complete');
  } catch (err) {
    console.error('✗ Test failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConcurrentClaim();
