// Priority weight configuration - tune these to adjust scoring
const PRIORITY_WEIGHTS = {
  amountTiers: {
    high: { threshold: 3000, points: 30 },
    medium: { threshold: 1500, points: 20 },
    low: { threshold: 800, points: 10 },
  },
  recencyTiers: {
    recent: { days: 90, points: 25 },
    moderate: { days: 180, points: 15 },
    older: { days: 365, points: 5 },
  },
  qtyBonus: {
    threshold: 2,
    points: 10,
  },
};

function computePriority({ amount, orderDate, qty }) {
  let score = 0;

  // Amount tiers
  if (amount !== null && amount !== undefined) {
    if (amount >= PRIORITY_WEIGHTS.amountTiers.high.threshold) {
      score += PRIORITY_WEIGHTS.amountTiers.high.points;
    } else if (amount >= PRIORITY_WEIGHTS.amountTiers.medium.threshold) {
      score += PRIORITY_WEIGHTS.amountTiers.medium.points;
    } else if (amount >= PRIORITY_WEIGHTS.amountTiers.low.threshold) {
      score += PRIORITY_WEIGHTS.amountTiers.low.points;
    }
  }

  // Recency
  if (orderDate instanceof Date) {
    const daysAgo = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysAgo <= PRIORITY_WEIGHTS.recencyTiers.recent.days) {
      score += PRIORITY_WEIGHTS.recencyTiers.recent.points;
    } else if (daysAgo <= PRIORITY_WEIGHTS.recencyTiers.moderate.days) {
      score += PRIORITY_WEIGHTS.recencyTiers.moderate.points;
    } else if (daysAgo <= PRIORITY_WEIGHTS.recencyTiers.older.days) {
      score += PRIORITY_WEIGHTS.recencyTiers.older.points;
    }
  }

  // Quantity bonus
  if (qty !== null && qty !== undefined && qty >= PRIORITY_WEIGHTS.qtyBonus.threshold) {
    score += PRIORITY_WEIGHTS.qtyBonus.points;
  }

  return score;
}

module.exports = { PRIORITY_WEIGHTS, computePriority };
