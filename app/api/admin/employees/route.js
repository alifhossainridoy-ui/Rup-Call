import { requireRole } from '@/lib/guard';
import prisma from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

export async function GET(req) {
  await requireRole('ADMIN');

  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
    },
  });

  // Add lead counts for each employee
  const employeeStats = await prisma.lead.groupBy({
    by: ['assignedToId'],
    _count: { id: true },
    where: { assignedToId: { not: null } },
  });

  const statsMap = {};
  employeeStats.forEach((stat) => {
    statsMap[stat.assignedToId] = stat._count.id;
  });

  const withCounts = employees.map((emp) => ({
    ...emp,
    leadCount: statsMap[emp.id] || 0,
  }));

  return Response.json({ employees: withCounts });
}

export async function POST(req) {
  await requireRole('ADMIN');

  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return Response.json(
      { error: 'name, email, and password required' },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return Response.json(
      { error: 'Email already exists' },
      { status: 400 }
    );
  }

  const passwordHash = await bcryptjs.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'EMPLOYEE',
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
    },
  });

  return Response.json({ employee: { ...user, leadCount: 0 } }, { status: 201 });
}
