// Parse date in DD/MM/YYYY or DD-MM-YYYY format (Bangladeshi convention)
function parseDate(raw) {
  if (!raw) return null;

  // If it's already a Date object (from Excel with cellDates: true)
  if (raw instanceof Date) {
    return raw;
  }

  // Convert to string
  const str = String(raw).trim();

  // If it looks like an Excel serial number (numeric)
  if (/^\d+$/.test(str)) {
    const serial = parseInt(str, 10);
    // Excel date serial: days since 1900-01-01 (with leap year bug)
    // 1 = 1900-01-01, but handle dates from 1900 onward
    if (serial > 0) {
      // Subtract 1 because Excel starts at 1900-01-01 as day 1
      // Add 1 to account for Excel's 1900 leap year bug
      const date = new Date((serial - 1) * 86400000 + Date.UTC(1900, 0, 1));
      // Simple validation: year should be reasonable
      const year = date.getUTCFullYear();
      if (year >= 1900 && year <= 2100) {
        return date;
      }
    }
    return null;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Validate ranges
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    // Check if the date is valid (not an impossible date like Feb 30)
    if (date.getDate() !== day || date.getMonth() !== month - 1) {
      return null;
    }

    return date;
  }

  return null;
}

// Parse amount: strip currency symbols, commas, convert Bengali numerals
function parseAmount(raw) {
  if (raw === null || raw === undefined) return null;

  let str = String(raw).trim();

  // Convert Bengali numerals and some Devanagari to ASCII
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(String.fromCharCode(0x09e6 + i), 'g'), String(i));
  }
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(String.fromCharCode(0x0966 + i), 'g'), String(i));
  }

  // Remove common currency symbols and separators
  str = str.replace(/[৳$€¥]/g, '').replace(/,/g, '').trim();

  const num = parseFloat(str);

  if (isNaN(num) || num <= 0) {
    return null;
  }

  return num;
}

// Parse quantity: convert to integer, default 1 if missing/invalid
function parseQty(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return 1;
  }

  let str = String(raw).trim();

  // Convert Bengali numerals
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(String.fromCharCode(0x09e6 + i), 'g'), String(i));
  }

  const num = parseInt(str, 10);

  if (isNaN(num) || num <= 0) {
    return 1;
  }

  return num;
}

module.exports = { parseDate, parseAmount, parseQty };
