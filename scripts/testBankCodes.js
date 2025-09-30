// scripts/testBankCodes.js
// Test script for bank code mapping functionality

const { getBankCode, isBankSupported, getSupportedBanks } = require('./bankCodes');

console.log('🧪 Testing Bank Code Mapping\n');

// Test cases for common Nigerian banks
const testCases = [
  // Access Bank variations
  'Access Bank',
  'Access Bank Plc',
  'access bank',
  'ACCESS BANK',
  
  // GTBank variations
  'Guaranty Trust Bank',
  'GTBank',
  'GT Bank',
  'gtb',
  
  // First Bank variations
  'First Bank',
  'First Bank of Nigeria',
  'FirstBank',
  'FBN',
  
  // UBA variations
  'United Bank for Africa',
  'UBA',
  'uba plc',
  
  // Zenith Bank variations
  'Zenith Bank',
  'Zenith Bank Plc',
  'zenith',
  
  // Digital banks
  'Kuda Bank',
  'Opay',
  'PalmPay',
  'Moniepoint',
  
  // Invalid/unsupported banks
  'Random Bank',
  'Non-existent Bank',
  '',
  null,
  undefined
];

console.log('Testing individual bank lookups:');
console.log('-'.repeat(50));

testCases.forEach(bankName => {
  const code = getBankCode(bankName);
  const supported = isBankSupported(bankName);
  const status = code ? '✅' : '❌';
  
  console.log(`${status} "${bankName}" → ${code || 'Not found'} (Supported: ${supported})`);
});

console.log('\n📊 Summary:');
console.log('-'.repeat(30));

const supportedBanks = getSupportedBanks();
console.log(`Total supported bank variations: ${supportedBanks.length}`);

const validTests = testCases.filter(name => name && typeof name === 'string');
const successfulLookups = validTests.filter(name => getBankCode(name) !== null);

console.log(`Test cases: ${testCases.length}`);
console.log(`Valid test cases: ${validTests.length}`);
console.log(`Successful lookups: ${successfulLookups.length}`);
console.log(`Success rate: ${((successfulLookups.length / validTests.length) * 100).toFixed(1)}%`);

console.log('\n🏦 All supported banks:');
console.log('-'.repeat(40));
const uniqueCodes = [...new Set(Object.values(require('./bankCodes').NIGERIAN_BANK_CODES))];
console.log(`Unique bank codes supported: ${uniqueCodes.length}`);
console.log('Bank codes:', uniqueCodes.sort().join(', '));

console.log('\n✅ Bank code mapping test completed!');
