// scripts/bankCodes.js
// Nigerian bank name to Paystack bank code mapping

const NIGERIAN_BANK_CODES = {
  // Access Bank variations
  'access bank': '044',
  'access bank plc': '044',
  'access bank nigeria': '044',
  'access': '044',
  
  // Guaranty Trust Bank variations
  'guaranty trust bank': '058',
  'gtbank': '058',
  'gtb': '058',
  'gt bank': '058',
  'guaranty trust bank plc': '058',
  
  // First Bank variations
  'first bank': '011',
  'first bank of nigeria': '011',
  'first bank plc': '011',
  'firstbank': '011',
  'fbn': '011',
  
  // United Bank for Africa variations
  'united bank for africa': '033',
  'uba': '033',
  'uba plc': '033',
  'united bank for africa plc': '033',
  
  // Zenith Bank variations
  'zenith bank': '057',
  'zenith bank plc': '057',
  'zenith': '057',
  
  // Union Bank variations
  'union bank': '032',
  'union bank of nigeria': '032',
  'union bank plc': '032',
  'union bank nigeria': '032',
  
  // Fidelity Bank variations
  'fidelity bank': '070',
  'fidelity bank plc': '070',
  'fidelity': '070',
  
  // Sterling Bank variations
  'sterling bank': '232',
  'sterling bank plc': '232',
  'sterling': '232',
  
  // Stanbic IBTC variations
  'stanbic ibtc bank': '221',
  'stanbic ibtc': '221',
  'stanbic': '221',
  'stanbic ibtc bank plc': '221',
  
  // Standard Chartered variations
  'standard chartered': '068',
  'standard chartered bank': '068',
  'scb': '068',
  
  // Ecobank variations
  'ecobank': '050',
  'ecobank nigeria': '050',
  'ecobank plc': '050',
  
  // FCMB variations
  'fcmb': '214',
  'first city monument bank': '214',
  'fcmb plc': '214',
  
  // Heritage Bank variations
  'heritage bank': '030',
  'heritage bank plc': '030',
  'heritage': '030',
  
  // Keystone Bank variations
  'keystone bank': '082',
  'keystone bank limited': '082',
  'keystone': '082',
  
  // Polaris Bank variations
  'polaris bank': '076',
  'polaris bank limited': '076',
  'polaris': '076',
  
  // Providus Bank variations
  'providus bank': '101',
  'providus bank plc': '101',
  'providus': '101',
  
  // Wema Bank variations
  'wema bank': '035',
  'wema bank plc': '035',
  'wema': '035',
  
  // Unity Bank variations
  'unity bank': '215',
  'unity bank plc': '215',
  'unity': '215',
  
  // Citibank variations
  'citibank': '023',
  'citibank nigeria': '023',
  'citi': '023',
  
  // Kuda Bank (digital)
  'kuda bank': '50211',
  'kuda': '50211',
  'kuda microfinance bank': '50211',
  
  // Opay (digital)
  'opay': '999992',
  'opay digital services': '999992',
  
  // Palmpay (digital)
  'palmpay': '999991',
  'palmpay limited': '999991',
  
  // Moniepoint (digital)
  'moniepoint': '50515',
  'moniepoint microfinance bank': '50515',
  
  // VFD Microfinance Bank
  'vfd microfinance bank': '566',
  'vfd': '566',
  
  // Rubies Bank
  'rubies bank': '125',
  'rubies microfinance bank': '125',
  
  // Carbon (digital)
  'carbon': '565',
  'carbon microfinance bank': '565',
  
  // Sparkle Bank
  'sparkle bank': '51310',
  'sparkle microfinance bank': '51310',
  
  // Titan Trust Bank
  'titan trust bank': '102',
  'titan trust': '102',
  'ttb': '102',
  
  // Globus Bank
  'globus bank': '00103',
  'globus bank limited': '00103',
  
  // SunTrust Bank
  'suntrust bank': '100',
  'suntrust': '100',
  
  // Coronation Bank
  'coronation bank': '559',
  'coronation merchant bank': '559',
  
  // Jaiz Bank (Islamic)
  'jaiz bank': '301',
  'jaiz bank plc': '301',
  'jaiz': '301',
  
  // TAJ Bank (Islamic)
  'taj bank': '302',
  'taj bank limited': '302',
  'taj': '302'
};

/**
 * Get Paystack bank code from bank name
 * @param {string} bankName - Bank name to lookup
 * @returns {string|null} - Paystack bank code or null if not found
 */
function getBankCode(bankName) {
  if (!bankName || typeof bankName !== 'string') {
    return null;
  }
  
  // Normalize bank name: lowercase, trim, remove extra spaces
  const normalizedName = bankName.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Direct lookup
  if (NIGERIAN_BANK_CODES[normalizedName]) {
    return NIGERIAN_BANK_CODES[normalizedName];
  }
  
  // Try partial matches for common cases
  const bankKeys = Object.keys(NIGERIAN_BANK_CODES);
  
  // Look for exact word matches
  for (const key of bankKeys) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return NIGERIAN_BANK_CODES[key];
    }
  }
  
  return null;
}

/**
 * Get all supported bank names
 * @returns {string[]} - Array of supported bank names
 */
function getSupportedBanks() {
  return Object.keys(NIGERIAN_BANK_CODES);
}

/**
 * Validate if bank is supported
 * @param {string} bankName - Bank name to validate
 * @returns {boolean} - True if bank is supported
 */
function isBankSupported(bankName) {
  return getBankCode(bankName) !== null;
}

module.exports = {
  NIGERIAN_BANK_CODES,
  getBankCode,
  getSupportedBanks,
  isBankSupported
};
