import { requireRole } from '@/lib/guard';
import prisma from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

export async function PATCH(req, { params }) {
  await requireRole('ADMIN');

  const { id } = params;
  const { name, active, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user || user.role !== 'EMPLOYEE') {
    return Response.json({ error: 'Employee not found' }, { status: 404 });
  }

  const data = {};
  if (name !== undefined) data.name = name;
  if (active !== undefined) data.active = active;
  if (password) data.passwordHash = await bcryptjs.hash(password, 10);

  // If deactivating, release all locked leads
  if (active === false) {
    await prisma.lead.updateMany({
      where: { lockedById: id },
      data: { lockedById: null, lockedAt: null },
    });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
    },
  });

  // Add lead count
  const leadCount = await prisma.lead.count({
    where: { assignedToId: id },
  });

  return Response.json({
    employee: { ...updated, leadCount },
  });
}
