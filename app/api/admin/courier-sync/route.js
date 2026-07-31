import { requireRole } from '@/lib/guard.js';
import prisma from '@/lib/prisma.js';
import { isConfigured, getStatusByInvoice } from '@/lib/courier/steadfast.js';
import { mapStatus } from '@/lib/courier/statusMap.js';

export async function POST(request) {
  await requireRole('ADMIN');

  if (!isConfigured()) {
    return Response.json({
      message: 'কুরিয়ার কনফিগার করা হয়নি',
      checked: 0,
      updated: 0,
      failed: 0,
    });
  }

  try {
    const leads = await prisma.lead.findMany({
      where: {
        courierStatus: { in: ['SENT', 'PENDING'] },
        courierInvoice: { not: null },
      },
      orderBy: { updatedAt: 'asc' },
      take: 100,
    });

    console.log(`[Courier] Admin sync: ${leads.length} leads`);

    let updated = 0;
    let failed = 0;

    for (const lead of leads) {
      // Check for timeout (> 10 minutes in SENDING state)
      if (
        lead.courierStatus === 'SENDING' &&
        lead.courierSentAt &&
        Date.now() - new Date(lead.courierSentAt).getTime() > 10 * 60 * 1000
      ) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            courierStatus: 'FAILED',
            courierError: 'Request timeout (no response from courier after 10 minutes)',
          },
        });
        failed++;
        continue;
      }

      const result = await getStatusByInvoice(lead.courierInvoice);

      if (!result.ok) {
        failed++;
        continue;
      }

      const newStatus = mapStatus(result.deliveryStatus);
      if (newStatus !== lead.courierStatus) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { courierStatus: newStatus },
        });
        updated++;
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    return Response.json({ checked: leads.length, updated, failed });
  } catch (err) {
    console.error('[Courier] Admin sync error:', err);
    return Response.json(
      { error: 'সিঙ্ক ব্যর্থ', checked: 0, updated: 0, failed: 0 },
      { status: 500 }
    );
  }
}
