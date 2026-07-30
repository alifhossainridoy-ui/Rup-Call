import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const { amount } = body;

  if (amount === undefined || amount === null) {
    return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0 || numAmount > 1000000) {
    return NextResponse.json(
      { error: 'Amount must be a valid number between 0 and 1,000,000' },
      { status: 400 }
    );
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Verify ownership (locked by or assigned to session user)
    if (lead.lockedById !== session.user.id && lead.assignedToId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create PriceChangeLog
      const priceLog = await tx.priceChangeLog.create({
        data: {
          leadId: id,
          changedById: session.user.id,
          oldAmount: lead.confirmedAmount,
          newAmount: numAmount,
        },
      });

      // Update Lead price
      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          confirmedAmount: numAmount,
          updatedAt: new Date(),
        },
        include: { customer: true },
      });

      return { priceLog, lead: updatedLead };
    });

    return NextResponse.json({
      lead: result.lead,
      priceLog: result.priceLog,
    });
  } catch (err) {
    console.error('Price update error:', err);
    return NextResponse.json({ error: 'Failed to update price' }, { status: 500 });
  }
}
