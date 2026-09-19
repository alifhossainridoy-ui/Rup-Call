// Column mapping: case-insensitive, whitespace-trimmed, underscores/spaces ignored
const COLUMN_ALIASES = {
  name: [
    'name', 'customer', 'customer name', 'customername', 'customer_name',
    'নাম', 'গ্রাহক', 'গ্রাহক নাম',
  ],
  phone: [
    'phone', 'mobile', 'mobile no', 'mobileno', 'mobile_no',
    'contact', 'number', 'tel', 'telephone',
    'ফোন', 'মোবাইল', 'মোবাইল নম্বর', 'সংযোগ',
  ],
  address: [
    'address', 'location', 'addr',
    'ঠিকানা', 'অবস্থান',
  ],
  product: [
    'product', 'product name', 'productname', 'product_name',
    'item', 'order product', 'orderproduct', 'order_product',
    'পণ্য', 'প্রোডাক্ট', 'আইটেম',
  ],
  date: [
    'order date', 'orderdate', 'order_date',
    'date', 'order_at', 'orderat',
    'তারিখ', 'অর্ডার তারিখ',
  ],
  amount: [
    'amount', 'price', 'total', 'order amount', 'orderamount', 'order_amount',
    'cost', 'value',
    'দাম', 'মূল্য', 'টাকা', 'পরিমাণ টাকা',
  ],
  qty: [
    'qty', 'quantity', 'quantiy', // typo variants
    'pcs', 'piece', 'pieces',
    'পরিমাণ', 'সংখ্যা', 'পিস',
  ],
  note: [
    'note', 'notes', 'remark', 'remarks',
    'comment', 'extra', 'description',
    'নোট', 'মন্তব্য', 'বিবরণ', 'অতিরিক্ত',
  ],
};

function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, ''); // Remove spaces and underscores
}

function buildColumnMap(headers) {
  const map = {};
  const unmappedColumns = [];

  if (!headers || headers.length === 0) {
    return { map: {}, unmappedColumns };
  }

  headers.forEach((header, index) => {
    const normalized = normalizeString(header);

    if (!normalized) {
      unmappedColumns.push(header);
      return;
    }

    let found = false;

    // Check each field's aliases
    for (const [fieldName, aliases] of Object.entries(COLUMN_ALIASES)) {
      for (const alias of aliases) {
        if (normalizeString(alias) === normalized) {
          map[fieldName] = index;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      unmappedColumns.push(header);
    }
  });

  return { map, unmappedColumns };
}

function extractRow(row, columnMap) {
  return {
    name: columnMap.name !== undefined ? row[columnMap.name] : undefined,
    phone: columnMap.phone !== undefined ? row[columnMap.phone] : undefined,
    address: columnMap.address !== undefined ? row[columnMap.address] : undefined,
    product: columnMap.product !== undefined ? row[columnMap.product] : undefined,
    date: columnMap.date !== undefined ? row[columnMap.date] : undefined,
    amount: columnMap.amount !== undefined ? row[columnMap.amount] : undefined,
    qty: columnMap.qty !== undefined ? row[columnMap.qty] : undefined,
    note: columnMap.note !== undefined ? row[columnMap.note] : undefined,
  };
}

module.exports = { buildColumnMap, extractRow };
