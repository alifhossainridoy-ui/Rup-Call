// Convert Bengali/Devanagari numerals to ASCII
function convertBengaliNumerals(str) {
  // Bengali numerals: ০-৯ (U+09E6 to U+09EF)
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(String.fromCharCode(0x09e6 + i), 'g'), String(i));
  }
  // Devanagari numerals: ०-९ (U+0966 to U+096F)
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(String.fromCharCode(0x0966 + i), 'g'), String(i));
  }
  return str;
}

function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // Convert Bengali/Devanagari numerals to ASCII
  let normalized = convertBengaliNumerals(raw.trim());

  // Remove all non-digit characters
  normalized = normalized.replace(/\D/g, '');

  if (!normalized) return null;

  // Handle different formats:
  // +8801712345678 or 8801712345678 (13 digits starting with 880)
  if (normalized.startsWith('880') && normalized.length === 13) {
    normalized = '0' + normalized.slice(3);
  }
  // 88 prefix (rare case, 13 digits)
  else if (normalized.startsWith('88') && normalized.length === 13) {
    normalized = '0' + normalized.slice(2);
  }
  // 10 digits starting with 1
  else if (normalized.length === 10 && normalized.startsWith('1')) {
    normalized = '0' + normalized;
  }
  // Already 11 digits starting with 01
  else if (normalized.length === 11 && normalized.startsWith('01')) {
    // Keep as-is
  }
  // Other lengths/formats are invalid
  else if (normalized.length !== 11 || !normalized.startsWith('01')) {
    return null;
  }

  // Final validation: must be 01[3-9]XXXXXXXX
  if (!/^01[3-9]\d{8}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

module.exports = { normalizePhone };
