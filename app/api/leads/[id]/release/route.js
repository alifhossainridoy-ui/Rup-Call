import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.js';

const { releaseLead } = require('@/lib/leads/claim.js');

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = params;

  try {
    const success = await releaseLead(id, session.user.id);

    if (!success) {
      return NextResponse.json({ error: 'Lead not found or not owned by you' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Release error:', err);
    return NextResponse.json({ error: 'Failed to release lead' }, { status: 500 });
  }
}
