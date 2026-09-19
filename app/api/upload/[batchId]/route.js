import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  const { batchId } = params;

  if (!batchId) {
    return NextResponse.json({ error: 'Batch ID required' }, { status: 400 });
  }

  try {
    const batch = await prisma.uploadBatch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        status: true,
        totalRows: true,
        processedRows: true,
        skippedRows: true,
        errorLog: true,
        fileName: true,
        createdAt: true,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
