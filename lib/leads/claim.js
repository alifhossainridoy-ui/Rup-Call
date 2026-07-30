const { prisma } = require('@/lib/prisma');

async function claimNextLead(userId) {
  // Atomic claim with FOR UPDATE SKIP LOCKED
  const result = await prisma.$queryRaw`
    UPDATE "Lead"
    SET "lockedById" = ${userId}, "lockedAt" = now(), "updatedAt" = now()
    WHERE id = (
      SELECT id FROM "Lead"
      WHERE ("lockedById" IS NULL OR "lockedAt" < now() - interval '30 minutes')
        AND "assignedToId" IS NULL
        AND status IN ('NEW', 'CALLED_NO_ANSWER')
      ORDER BY priority DESC, "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id
  `;

  if (!result || result.length === 0) {
    return null;
  }

  const leadId = result[0].id;

  // Fetch full lead + customer
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { customer: true },
  });

  return lead;
}

async function releaseLead(leadId, userId) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead || lead.lockedById !== userId) {
    return false;
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      lockedById: null,
      lockedAt: null,
      updatedAt: new Date(),
    },
  });

  return true;
}

module.exports = { claimNextLead, releaseLead };
