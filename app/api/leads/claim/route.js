import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.js';

const { claimNextLead } = require('@/lib/leads/claim.js');

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const lead = await claimNextLead(session.user.id);

    if (!lead) {
      return NextResponse.json({ lead: null }, { status: 204 });
    }

    return NextResponse.json({ lead });
  } catch (err) {
    console.error('Claim error:', err);
    return NextResponse.json({ error: 'Failed to claim lead' }, { status: 500 });
  }
}
