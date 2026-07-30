import { requireRole } from '@/lib/guard';
import prisma from '@/lib/prisma';

const CACHE_TTL = 60000; // 60 seconds
let statsCache = null;
let statsCacheTime = 0;

export async function GET(req) {
  await requireRole('ADMIN');

  const now = Date.now();
  if (statsCache && now - statsCacheTime < CACHE_TTL) {
    return Response.json(statsCache);
  }

  const [leadsByStatus, employeeStats, totalCustomers] = await Promise.all([
    prisma.lead.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ['assignedToId'],
      _count: { id: true },
      where: { assignedToId: { not: null } },
    }),
    prisma.customer.count(),
  ]);

  const stats = {
    totalLeads: leadsByStatus.reduce((sum, g) => sum + g._count.id, 0),
    totalCustomers,
    leadsByStatus: leadsByStatus.reduce((acc, g) => {
      acc[g.status] = g._count.id;
      return acc;
    }, {}),
    employeeStats,
    timestamp: now,
  };

  statsCache = stats;
  statsCacheTime = now;

  return Response.json(stats);
}
