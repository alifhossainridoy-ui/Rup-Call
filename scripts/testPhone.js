const { normalizePhone } = require('../lib/upload/phone.js');

const testCases = [
  { input: '+8801712345678', expected: '01712345678', desc: 'with +88 prefix' },
  { input: '8801712345678', expected: '01712345678', desc: '88 prefix' },
  { input: '01712345678', expected: '01712345678', desc: 'already normalized' },
  { input: '1712345678', expected: '01712345678', desc: '10 digits starting with 1' },
  { input: '017-1234-5678', expected: '01712345678', desc: 'with dashes' },
  { input: '০১৭১२३४५६७८', expected: '01712345678', desc: 'Bengali numerals' },
  { input: '0121234567', expected: null, desc: 'invalid pattern (01-2)' },
  { input: 'abc', expected: null, desc: 'non-numeric' },
  { input: '', expected: null, desc: 'empty string' },
];

let passed = 0;
let failed = 0;

console.log('🧪 Testing phone normalization...\n');

testCases.forEach(({ input, expected, desc }) => {
  const result = normalizePhone(input);
  const status = result === expected ? '✓' : '✗';

  if (result === expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(
    `${status} ${desc}`,
    `\n   Input: "${input}" → Expected: "${expected}", Got: "${result}"`
  );
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
