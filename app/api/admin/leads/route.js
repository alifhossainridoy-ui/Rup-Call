import { requireRole } from '@/lib/guard';
import prisma from '@/lib/prisma';
import { normalizePhone } from '@/lib/upload/phone';

export async function GET(req) {
  await requireRole('ADMIN');

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const status = url.searchParams.get('status');
  const employeeId = url.searchParams.get('employeeId');
  const courierStatus = url.searchParams.get('courierStatus');
  const q = url.searchParams.get('q');

  const where = {};

  if (status) where.status = status;
  if (employeeId) where.assignedToId = employeeId;
  if (courierStatus) where.courierStatus = courierStatus;

  if (q) {
    const normalized = normalizePhone(q);
    if (normalized && normalized.match(/^01[3-9]\d{8}$/)) {
      where.customer = {
        phone: normalized,
      };
    } else {
      where.customer = {
        name: { contains: q, mode: 'insensitive' },
      };
    }
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      customer: true,
      assignedTo: { select: { id: true, name: true } },
      lockedBy: { select: { id: true, name: true } },
      callLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const hasMore = leads.length > limit;
  const items = hasMore ? leads.slice(0, limit) : leads;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return Response.json({
    leads: items,
    nextCursor,
    hasMore,
  });
}
