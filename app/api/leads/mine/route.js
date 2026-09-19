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
    const leads = await prisma.lead.findMany({
      where: {
        lockedById: session.user.id,
        status: {
          notIn: ['CONFIRMED', 'CANCELLED', 'EXPIRED'],
        },
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ leads });
  } catch (err) {
    console.error('Fetch leads error:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
