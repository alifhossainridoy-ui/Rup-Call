import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { isConfigured, createOrder } from '@/lib/courier/steadfast.js';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || !['EMPLOYEE', 'ADMIN'].includes(session.user.role)) {
    return Response.json({ error: 'অনুমোদিত নয়' }, { status: 403 });
  }

  const { id } = params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!lead) {
      return Response.json({ error: 'লিড পাওয়া যায়নি' }, { status: 404 });
    }

    // Verify ownership for EMPLOYEE; ADMIN has full access
    if (
      session.user.role === 'EMPLOYEE' &&
      lead.lockedById !== session.user.id &&
      lead.assignedToId !== session.user.id
    ) {
      return Response.json({ error: 'নিষিদ্ধ' }, { status: 403 });
    }

    // Only send if status is CONFIRMED
    if (lead.status !== 'CONFIRMED') {
      return Response.json(
        { error: 'শুধুমাত্র নিশ্চিত লিড পাঠানো যায়' },
        { status: 400 }
      );
    }

    // Reject if already sent or delivered (idempotency)
    if (['SENT', 'DELIVERED'].includes(lead.courierStatus)) {
      return Response.json({
        message: 'পূর্বে পাঠানো হয়েছে',
        consignmentId: lead.courierConsignmentId,
        trackingCode: lead.courierTrackingCode,
        simulated: false,
      });
    }

    // Reject if no confirmed amount
    if (!lead.confirmedAmount) {
      return Response.json(
        { error: 'নিশ্চিত পরিমাণ প্রয়োজন' },
        { status: 400 }
      );
    }

    // Increment attempt and generate invoice
    const newAttempt = lead.courierAttempt + 1;
    const invoice = `${lead.id}-${newAttempt}`;

    // Set status to SENDING
    await prisma.lead.update({
      where: { id },
      data: {
        courierStatus: 'SENDING',
        courierInvoice: invoice,
        courierAttempt: newAttempt,
      },
    });

    // Simulated mode if not configured
    if (!isConfigured()) {
      console.warn(
        `[Courier] Steadfast not configured — simulated send for lead ${id}`
      );
      await new Promise((r) => setTimeout(r, 800));

      const simConsignmentId = `SIM-${invoice}`;
      await prisma.lead.update({
        where: { id },
        data: {
          courierStatus: 'SENT',
          courierConsignmentId: simConsignmentId,
          courierSentAt: new Date(),
          courierError: null,
        },
      });

      return Response.json({
        message: 'কুরিয়ারে পাঠানো হয়েছে',
        consignmentId: simConsignmentId,
        trackingCode: null,
        simulated: true,
      });
    }

    // Real mode: call Steadfast
    const result = await createOrder({
      invoice,
      name: lead.customer.name,
      phone: lead.customer.phone,
      address: lead.customer.address || '',
      codAmount: lead.confirmedAmount,
      note: lead.productPitched || '',
    });

    if (!result.ok) {
      await prisma.lead.update({
        where: { id },
        data: {
          courierStatus: 'FAILED',
          courierError: result.error,
        },
      });

      return Response.json(
        { error: result.error || 'কুরিয়ার সেবা ব্যর্থ' },
        { status: 500 }
      );
    }

    // Success
    await prisma.lead.update({
      where: { id },
      data: {
        courierStatus: 'SENT',
        courierConsignmentId: result.consignmentId,
        courierTrackingCode: result.trackingCode,
        courierSentAt: new Date(),
        courierError: null,
      },
    });

    return Response.json({
      message: 'কুরিয়ারে পাঠানো হয়েছে',
      consignmentId: result.consignmentId,
      trackingCode: result.trackingCode,
      simulated: false,
    });
  } catch (err) {
    console.error('[Courier] Send error:', err);
    return Response.json(
      { error: 'কিছু ত্রুটি ঘটেছে' },
      { status: 500 }
    );
  }
}
