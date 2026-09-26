const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log('🎬 Creating demo data for Rup Call CRM...\n');

  try {
    // Clear existing demo data
    await prisma.lead.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { in: ['demo1@test.local', 'demo2@test.local', 'demo3@test.local'] },
      },
    });

    console.log('✓ Cleaned up old demo data\n');

    // Create 3 demo employees
    const emp1 = await prisma.user.create({
      data: {
        name: 'রহিম আহমেদ',
        email: 'demo1@test.local',
        passwordHash: 'demo123',
        role: 'EMPLOYEE',
        active: true,
      },
    });

    const emp2 = await prisma.user.create({
      data: {
        name: 'সুমাইয়া বেগম',
        email: 'demo2@test.local',
        passwordHash: 'demo123',
        role: 'EMPLOYEE',
        active: true,
      },
    });

    const emp3 = await prisma.user.create({
      data: {
        name: 'করিম খান',
        email: 'demo3@test.local',
        passwordHash: 'demo123',
        role: 'EMPLOYEE',
        active: true,
      },
    });

    console.log(`✓ Created 3 demo employees\n`);

    // Demo data
    const demoLeads = [
      { name: 'আবদুল হালিম', phone: '01712345601', product: 'মোটরসাইকেল', amount: 250000, status: 'NEW', employee: emp1 },
      { name: 'ফাতেমা আক্তার', phone: '01812345602', product: 'রোটি মেশিন', amount: 45000, status: 'CALLED_INTERESTED', employee: emp1 },
      { name: 'মুহাম্মদ করিম', phone: '01912345603', product: 'সোলার প্যানেল', amount: 350000, status: 'CALLED_NO_ANSWER', employee: emp2 },
      { name: 'রাবিয়া ইয়াসমিন', phone: '01712345604', product: 'এয়ার কন্ডিশনার', amount: 85000, status: 'FOLLOW_UP_LATER', employee: emp2 },
      { name: 'আলী হোসেন', phone: '01812345605', product: 'ওয়াটার পাম্প', amount: 65000, status: 'CONFIRMED', employee: emp1 },
      { name: 'নুরজাহান বেগম', phone: '01912345606', product: 'ফ্রিজ', amount: 75000, status: 'CONFIRMED', employee: emp3 },
      { name: 'হাসান রেজা', phone: '01712345607', product: 'টেলিভিশন', amount: 45000, status: 'CALLED_INTERESTED', employee: emp2 },
      { name: 'জেসিকা ঘোষ', phone: '01812345608', product: 'মাইক্রোওয়েভ', amount: 25000, status: 'NEW', employee: emp3 },
      { name: 'রফিকুল ইসলাম', phone: '01912345609', product: 'ডিজিটাল স্কেল', amount: 8000, status: 'CALLED_NOT_INTERESTED', employee: emp1 },
      { name: 'সালমা বেগম', phone: '01712345610', product: 'স্টোভ', amount: 12000, status: 'CONFIRMED', employee: emp2 },
      { name: 'করিম আহমেদ', phone: '01812345611', product: 'ইলেকট্রিক হিটার', amount: 3500, status: 'NEW', employee: null },
      { name: 'ফাতিমা খান', phone: '01912345612', product: 'ভ্যাকুয়াম ক্লিনার', amount: 35000, status: 'CALLED_INTERESTED', employee: emp3 },
      { name: 'শাহীন হোসেন', phone: '01712345613', product: 'পাম্প মোটর', amount: 85000, status: 'CONFIRMED', employee: emp1 },
      { name: 'নাজমা বেগম', phone: '01812345614', product: 'ড্রায়ার', amount: 15000, status: 'NEW', employee: emp2 },
      { name: 'ইমরান খান', phone: '01912345615', product: 'চার্জার', amount: 2500, status: 'CALLED_NO_ANSWER', employee: emp3 },
      { name: 'রেখা রায়', phone: '01712345616', product: 'ওয়ার্কশপ টুলস', amount: 125000, status: 'FOLLOW_UP_LATER', employee: emp1 },
      { name: 'করিম সাহেব', phone: '01812345617', product: 'সিকিউরিটি ক্যামেরা', amount: 55000, status: 'CONFIRMED', employee: emp2 },
      { name: 'লতিফা আক্তার', phone: '01912345618', product: 'ওয়াশিং মেশিন', amount: 65000, status: 'CALLED_INTERESTED', employee: emp3 },
      { name: 'মোহাম্মদ নাজিম', phone: '01712345619', product: 'ইনভার্টার', amount: 85000, status: 'NEW', employee: null },
      { name: 'সালিমা খান', phone: '01812345620', product: 'রান্নাঘরের সরঞ্জাম', amount: 45000, status: 'CONFIRMED', employee: emp1 },
    ];

    // Create customers and leads
    for (const lead of demoLeads) {
      const customer = await prisma.customer.create({
        data: {
          name: lead.name,
          phone: lead.phone,
          address: 'ঢাকা, বাংলাদেশ',
          oldOrderProduct: lead.product,
          oldOrderDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          oldOrderAmount: lead.amount,
          oldOrderQty: Math.floor(Math.random() * 3) + 1,
        },
      });

      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + Math.floor(Math.random() * 7) + 1);

      await prisma.lead.create({
        data: {
          customerId: customer.id,
          status: lead.status,
          priority: Math.floor(Math.random() * 100),
          confirmedAmount: ['CONFIRMED'].includes(lead.status) ? lead.amount : null,
          assignedToId: lead.employee?.id || null,
          lockedById: null,
          productPitched: lead.product,
          followUpAt: lead.status === 'FOLLOW_UP_LATER' ? followUpDate : null,
          courierStatus: ['CONFIRMED'].includes(lead.status) ? 'SENT' : 'NOT_SENT',
          courierInvoice: ['CONFIRMED'].includes(lead.status) ? `demo-${customer.id}-1` : null,
          courierConsignmentId: ['CONFIRMED'].includes(lead.status) ? `SIM-demo-${customer.id}` : null,
          courierSentAt: ['CONFIRMED'].includes(lead.status) ? new Date() : null,
        },
      });
    }

    console.log(`✓ Created ${demoLeads.length} demo leads\n`);

    // Print summary
    const stats = await prisma.lead.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    console.log('📊 Demo Data Summary:');
    console.log('─'.repeat(40));
    stats.forEach((s) => {
      console.log(`  ${s.status}: ${s._count.id}`);
    });
    console.log('─'.repeat(40));

    console.log('\n🎬 Demo data ready!\n');
    console.log('Login Credentials:');
    console.log('  Admin: admin@rupzone.local / ChangeMe123!');
    console.log('  Employee 1: demo1@test.local / demo123');
    console.log('  Employee 2: demo2@test.local / demo123');
    console.log('  Employee 3: demo3@test.local / demo123\n');

  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoData();
