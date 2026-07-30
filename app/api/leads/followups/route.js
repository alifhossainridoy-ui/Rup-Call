import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Today's end of day
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const followups = await prisma.lead.findMany({
      where: {
        OR: [
          { lockedById: session.user.id },
          { assignedToId: session.user.id },
        ],
        status: 'FOLLOW_UP_LATER',
        followUpAt: {
          lte: today,
        },
      },
      include: { customer: true },
      orderBy: { followUpAt: 'asc' },
    });

    return NextResponse.json({ followups });
  } catch (err) {
    console.error('Fetch followups error:', err);
    return NextResponse.json({ error: 'Failed to fetch followups' }, { status: 500 });
  }
}
