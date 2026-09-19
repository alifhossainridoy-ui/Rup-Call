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
  const { status, productPitched, note, followUpAt } = body;

  if (!status) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Verify ownership
    if (lead.lockedById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate FOLLOW_UP_LATER requires a date
    if (status === 'FOLLOW_UP_LATER' && !followUpAt) {
      return NextResponse.json(
        { error: 'followUpAt is required for FOLLOW_UP_LATER status' },
        { status: 400 }
      );
    }

    // Use transaction for atomic updates
    const result = await prisma.$transaction(async (tx) => {
      // Create CallLog
      const callLog = await tx.callLog.create({
        data: {
          leadId: id,
          employeeId: session.user.id,
          statusAtCall: lead.status,
          productPitched: productPitched || null,
          note: note || null,
        },
      });

      // Prepare lead update
      const updateData = {
        status,
        updatedAt: new Date(),
        productPitched: productPitched || lead.productPitched,
      };

      // Handle CONFIRMED status
      if (status === 'CONFIRMED') {
        updateData.confirmedAt = new Date();
        // Set confirmed amount or fall back to old order amount
        if (lead.confirmedAmount === null) {
          updateData.confirmedAmount = lead.customer?.oldOrderAmount || null;
        }
        // Clear lock (work is done)
        updateData.lockedById = null;
        updateData.lockedAt = null;
      }
      // Handle FOLLOW_UP_LATER status
      else if (status === 'FOLLOW_UP_LATER') {
        updateData.followUpAt = new Date(followUpAt);
        // Clear lock but keep assignment
        updateData.lockedById = null;
        updateData.lockedAt = null;
        updateData.assignedToId = session.user.id;
      }
      // Other statuses keep the lock
      else {
        // Keep current lock
      }

      // Update Lead
      const updatedLead = await tx.lead.update({
        where: { id },
        data: updateData,
        include: { customer: true },
      });

      return { callLog, lead: updatedLead };
    });

    return NextResponse.json({
      lead: result.lead,
      callLog: result.callLog,
    });
  } catch (err) {
    console.error('Status update error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
