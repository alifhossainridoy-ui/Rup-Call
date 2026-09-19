import { requireRole } from '@/lib/guard';
import prisma from '@/lib/prisma';

export async function POST(req) {
  await requireRole('ADMIN');

  const { leadIds, employeeId } = await req.json();

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return Response.json(
      { error: 'leadIds must be a non-empty array' },
      { status: 400 }
    );
  }

  if (leadIds.length > 500) {
    return Response.json(
      { error: 'Maximum 500 leads per assign' },
      { status: 400 }
    );
  }

  if (!employeeId) {
    return Response.json({ error: 'employeeId required' }, { status: 400 });
  }

  // Verify employee exists
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
  });

  if (!employee || employee.role !== 'EMPLOYEE' || !employee.active) {
    return Response.json({ error: 'Invalid employee' }, { status: 400 });
  }

  const result = await prisma.lead.updateMany({
    where: {
      id: { in: leadIds },
      lockedById: null, // Skip locked leads
    },
    data: {
      assignedToId: employeeId,
      lockedById: null,
      lockedAt: null,
    },
  });

  return Response.json({
    assigned: result.count,
    skipped: leadIds.length - result.count,
  });
}
