import prisma from '@/lib/prisma.js';
import { isConfigured, getStatusByInvoice } from '@/lib/courier/steadfast.js';
import { mapStatus } from '@/lib/courier/statusMap.js';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronSecret(request) {
  const secret = request.headers.get('x-cron-secret') ||
                 new URL(request.url).searchParams.get('secret');
  return CRON_SECRET && secret === CRON_SECRET;
}

export async function GET(request) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: 'অননুমোদিত' }, { status: 401 });
  }

  if (!isConfigured()) {
    console.log('[Courier] Sync skipped: Steadfast not configured');
    return Response.json({ checked: 0, updated: 0, failed: 0 });
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

    console.log(`[Courier] Syncing ${leads.length} leads`);

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
        console.log(`[Courier] Lead ${lead.id} marked FAILED (timeout)`);
        continue;
      }

      const result = await getStatusByInvoice(lead.courierInvoice);

      if (!result.ok) {
        failed++;
        console.log(
          `[Courier] Status check failed for ${lead.courierInvoice}: ${result.error}`
        );
        continue;
      }

      const newStatus = mapStatus(result.deliveryStatus);
      if (newStatus !== lead.courierStatus) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { courierStatus: newStatus },
        });
        updated++;
        console.log(
          `[Courier] Updated ${lead.courierInvoice}: ${lead.courierStatus} -> ${newStatus}`
        );
      }

      // Delay between requests to avoid hammering the API
      await new Promise((r) => setTimeout(r, 200));
    }

    return Response.json({ checked: leads.length, updated, failed });
  } catch (err) {
    console.error('[Courier] Sync error:', err);
    return Response.json(
      { error: 'Sync failed', checked: 0, updated: 0, failed: 0 },
      { status: 500 }
    );
  }
}
