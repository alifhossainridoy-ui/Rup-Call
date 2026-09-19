/**
 * Map Steadfast delivery_status strings to our CourierStatus enum
 *
 * Steadfast statuses observed or documented:
 * - pending / in_review -> PENDING
 * - delivered / partial_delivered -> DELIVERED
 * - cancelled / return / returned -> RETURNED
 * - hold / unknown / anything else -> SENT (keep as in-transit, not silent delivered)
 */

const statusMap = {
  pending: 'PENDING',
  in_review: 'PENDING',
  delivered: 'DELIVERED',
  partial_delivered: 'DELIVERED',
  cancelled: 'RETURNED',
  return: 'RETURNED',
  returned: 'RETURNED',
  hold: 'SENT',
  unknown: 'SENT',
};

function mapStatus(steadfastStatus) {
  if (!steadfastStatus) return 'SENT';
  const lower = String(steadfastStatus).toLowerCase();
  return statusMap[lower] || 'SENT';
}

function getLabelInBengali(courierStatus) {
  const labels = {
    NOT_SENT: 'পাঠানো হয়নি',
    PENDING: 'অপেক্ষমাণ',
    SENDING: 'পাঠানো হচ্ছে',
    SENT: 'পাঠানো হয়েছে',
    DELIVERED: 'ডেলিভার্ড',
    FAILED: 'ব্যর্থ',
    RETURNED: 'রিটার্ন',
  };
  return labels[courierStatus] || courierStatus;
}

module.exports = {
  mapStatus,
  getLabelInBengali,
  statusMap,
};
