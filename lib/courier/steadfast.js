/**
 * Steadfast Courier API Client
 *
 * FIELDS REQUIRING VERIFICATION AGAINST MERCHANT DOCS:
 * - recipient_name (verify exact field name)
 * - recipient_phone (verify exact field name)
 * - recipient_address (verify exact field name)
 * - cod_amount (verify exact field name)
 * - delivery_status response field (pending, in_review, delivered, partial_delivered, cancelled, return, returned, hold, unknown, etc.)
 * - consignment_id response field (verify exact field name)
 * - tracking_code response field (verify exact field name)
 * - error response field (check if error is nested under a key or at root level)
 *
 * All field names should be confirmed against the Steadfast merchant panel API docs before going live.
 */

const baseUrl = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';
const apiKey = process.env.STEADFAST_API_KEY || '';
const secretKey = process.env.STEADFAST_SECRET_KEY || '';

function isConfigured() {
  return apiKey.trim().length > 0 && secretKey.trim().length > 0;
}

async function createOrder({ invoice, name, phone, address, codAmount, note }) {
  if (!isConfigured()) {
    return {
      ok: false,
      error: 'Steadfast not configured',
      consignmentId: null,
      trackingCode: null,
      raw: null,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${baseUrl}/create_order`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice,
        recipient_name: name,
        recipient_phone: phone,
        recipient_address: address,
        cod_amount: codAmount,
        note: note || '',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const raw = await response.json();

    // Check for error field in response (Steadfast sometimes returns 200 with error payload)
    if (!response.ok || raw.error || !raw.consignment_id) {
      console.error(`[Courier] Create order failed for invoice ${invoice}:`, raw);
      return {
        ok: false,
        error: raw.error || raw.message || 'Unknown error',
        consignmentId: null,
        trackingCode: null,
        raw,
      };
    }

    console.log(`[Courier] Order created: invoice=${invoice}, consignment=${raw.consignment_id}`);
    return {
      ok: true,
      consignmentId: raw.consignment_id,
      trackingCode: raw.tracking_code || null,
      raw,
      error: null,
    };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'Request timeout (15s)' : err.message;
    console.error(`[Courier] Create order error for invoice ${invoice}:`, message);
    return {
      ok: false,
      error: message,
      consignmentId: null,
      trackingCode: null,
      raw: null,
    };
  }
}

async function getStatusByInvoice(invoice) {
  if (!isConfigured()) {
    return {
      ok: false,
      error: 'Steadfast not configured',
      deliveryStatus: null,
      raw: null,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${baseUrl}/status_by_invoice/${invoice}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const raw = await response.json();

    if (!response.ok || raw.error) {
      console.error(`[Courier] Status check failed for invoice ${invoice}:`, raw);
      return {
        ok: false,
        error: raw.error || raw.message || 'Unknown error',
        deliveryStatus: null,
        raw,
      };
    }

    const status = raw.delivery_status || raw.status;
    console.log(`[Courier] Status check: invoice=${invoice}, status=${status}`);
    return {
      ok: true,
      deliveryStatus: status,
      raw,
      error: null,
    };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'Request timeout (15s)' : err.message;
    console.error(`[Courier] Status check error for invoice ${invoice}:`, message);
    return {
      ok: false,
      error: message,
      deliveryStatus: null,
      raw: null,
    };
  }
}

module.exports = {
  isConfigured,
  createOrder,
  getStatusByInvoice,
};
