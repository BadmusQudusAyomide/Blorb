// scripts/paystackSubaccountsSimple.js
// Simplified Paystack subaccount creation script using direct REST API calls

const axios = require('axios');
const { getBankCode, isBankSupported } = require('./bankCodes');
require('dotenv').config();

// Configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const FIREBASE_PROJECT_ID = 'blorbmart2';
const PLATFORM_PERCENTAGE = 15; // 15% platform fee
const BATCH_SIZE = 5; // Smaller batches for stability
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 2000; // 2 seconds

// Validation
if (!PAYSTACK_SECRET_KEY) {
  console.error('❌ PAYSTACK_SECRET_KEY environment variable is required');
  process.exit(1);
}

// Statistics tracking
const stats = {
  totalSellers: 0,
  eligibleSellers: 0,
  successfulCreations: 0,
  failedCreations: 0,
  skippedSellers: 0,
  errors: []
};

/**
 * Sleep utility for delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Log with timestamp
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Fetch sellers using Firestore REST API
 */
async function fetchSellers() {
  try {
    log('Fetching sellers from Firestore using REST API...');
    
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users`;
    
    const response = await axios.get(url, {
      params: {
        'pageSize': 1000
      }
    });
    
    const sellers = [];
    
    if (response.data.documents) {
      response.data.documents.forEach(doc => {
        const fields = doc.fields || {};
        
        // Check if role is seller
        if (fields.role && fields.role.stringValue === 'seller') {
          const seller = {
            id: doc.name.split('/').pop(),
            role: fields.role.stringValue,
            fullName: fields.fullName?.stringValue || '',
            businessName: fields.businessName?.stringValue || '',
            email: fields.email?.stringValue || '',
            phoneNumber: fields.phoneNumber?.stringValue || '',
            subaccountCode: fields.subaccountCode?.stringValue || null,
            bankDetails: {}
          };
          
          // Parse bank details if they exist
          if (fields.bankDetails && fields.bankDetails.mapValue) {
            const bankFields = fields.bankDetails.mapValue.fields || {};
            seller.bankDetails = {
              bankName: bankFields.bankName?.stringValue || '',
              accountNumber: bankFields.accountNumber?.stringValue || '',
              accountName: bankFields.accountName?.stringValue || ''
            };
          }
          
          sellers.push(seller);
        }
      });
    }
    
    stats.totalSellers = sellers.length;
    log(`Found ${sellers.length} total sellers`);
    
    return sellers;
  } catch (error) {
    log(`Error fetching sellers: ${error.message}`, 'error');
    if (error.response) {
      log(`Response status: ${error.response.status}`, 'error');
      log(`Response data: ${JSON.stringify(error.response.data)}`, 'error');
    }
    throw error;
  }
}

/**
 * Filter sellers eligible for subaccount creation
 */
function filterEligibleSellers(sellers) {
  log('Filtering eligible sellers...');
  
  const eligible = sellers.filter(seller => {
    // Skip if already has subaccount
    if (seller.subaccountCode) {
      log(`Skipping ${seller.fullName || seller.id} - already has subaccount: ${seller.subaccountCode}`);
      stats.skippedSellers++;
      return false;
    }
    
    // Check for required bank details
    const bankDetails = seller.bankDetails || {};
    const hasRequiredFields = bankDetails.bankName && 
                             bankDetails.accountNumber && 
                             bankDetails.accountName;
    
    if (!hasRequiredFields) {
      log(`Skipping ${seller.fullName || seller.id} - incomplete bank details`);
      stats.skippedSellers++;
      return false;
    }
    
    // Validate bank is supported
    if (!isBankSupported(bankDetails.bankName)) {
      log(`Skipping ${seller.fullName || seller.id} - unsupported bank: ${bankDetails.bankName}`, 'error');
      stats.errors.push({
        sellerId: seller.id,
        error: `Unsupported bank: ${bankDetails.bankName}`,
        type: 'validation'
      });
      stats.skippedSellers++;
      return false;
    }
    
    return true;
  });
  
  stats.eligibleSellers = eligible.length;
  log(`${eligible.length} sellers eligible for subaccount creation`);
  
  return eligible;
}

/**
 * Create Paystack subaccount for a seller
 */
async function createPaystackSubaccount(seller, retryCount = 0) {
  try {
    const bankDetails = seller.bankDetails;
    const bankCode = getBankCode(bankDetails.bankName);
    
    const payload = {
      business_name: seller.businessName || seller.fullName || `Seller ${seller.id}`,
      settlement_bank: bankCode,
      account_number: bankDetails.accountNumber,
      percentage_charge: PLATFORM_PERCENTAGE,
      description: `Blorb Marketplace - ${seller.fullName || seller.id}`,
      primary_contact_email: seller.email,
      primary_contact_name: seller.fullName || seller.businessName,
      primary_contact_phone: seller.phoneNumber || '',
      metadata: {
        seller_id: seller.id,
        marketplace: 'blorb',
        created_by: 'bulk_script'
      }
    };
    
    log(`Creating subaccount for ${seller.fullName || seller.id}...`);
    
    const response = await axios.post(`${PAYSTACK_BASE_URL}/subaccount`, payload, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    if (response.data.status && response.data.data) {
      const subaccountCode = response.data.data.subaccount_code;
      log(`✅ Created subaccount ${subaccountCode} for ${seller.fullName || seller.id}`, 'success');
      
      return {
        success: true,
        subaccountCode,
        subaccountId: response.data.data.id,
        data: response.data.data
      };
    } else {
      throw new Error(`Invalid response from Paystack: ${JSON.stringify(response.data)}`);
    }
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    log(`Failed to create subaccount for ${seller.fullName || seller.id}: ${errorMessage}`, 'error');
    
    // Retry logic
    if (retryCount < RETRY_ATTEMPTS) {
      log(`Retrying in ${RETRY_DELAY/1000} seconds... (attempt ${retryCount + 1}/${RETRY_ATTEMPTS})`);
      await sleep(RETRY_DELAY);
      return createPaystackSubaccount(seller, retryCount + 1);
    }
    
    return {
      success: false,
      error: errorMessage,
      sellerId: seller.id
    };
  }
}

/**
 * Update seller document in Firestore using REST API
 */
async function updateSellerDocument(seller, subaccountData) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${seller.id}`;
    
    const updateData = {
      fields: {
        subaccountCode: { stringValue: subaccountData.subaccountCode },
        subaccountId: { stringValue: subaccountData.subaccountId },
        subaccountCreatedAt: { timestampValue: new Date().toISOString() },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
    };
    
    const response = await axios.patch(url, updateData, {
      params: {
        'updateMask.fieldPaths': 'subaccountCode,subaccountId,subaccountCreatedAt,updatedAt'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      log(`Updated Firestore document for ${seller.fullName || seller.id}`, 'success');
      return true;
    } else {
      log(`Failed to update Firestore for ${seller.fullName || seller.id}: Status ${response.status}`, 'error');
      return false;
    }
    
  } catch (error) {
    log(`Failed to update Firestore for ${seller.fullName || seller.id}: ${error.message}`, 'error');
    if (error.response) {
      log(`Response status: ${error.response.status}`, 'error');
      log(`Response data: ${JSON.stringify(error.response.data)}`, 'error');
    }
    return false;
  }
}

/**
 * Process a single seller
 */
async function processSeller(seller) {
  try {
    // Create Paystack subaccount
    const subaccountResult = await createPaystackSubaccount(seller);
    
    if (!subaccountResult.success) {
      stats.failedCreations++;
      stats.errors.push({
        sellerId: seller.id,
        sellerName: seller.fullName || seller.id,
        error: subaccountResult.error,
        type: 'paystack_creation'
      });
      return false;
    }
    
    // Update seller document
    const updateSuccess = await updateSellerDocument(seller, subaccountResult);
    if (!updateSuccess) {
      stats.errors.push({
        sellerId: seller.id,
        sellerName: seller.fullName || seller.id,
        error: 'Failed to update Firestore document',
        type: 'firestore_update'
      });
      stats.failedCreations++;
      return false;
    }
    
    stats.successfulCreations++;
    log(`✅ Successfully processed seller ${seller.fullName || seller.id}`, 'success');
    return true;
    
  } catch (error) {
    log(`Error processing seller ${seller.fullName || seller.id}: ${error.message}`, 'error');
    stats.failedCreations++;
    stats.errors.push({
      sellerId: seller.id,
      sellerName: seller.fullName || seller.id,
      error: error.message,
      type: 'processing_error'
    });
    return false;
  }
}

/**
 * Process sellers in batches
 */
async function processSellersInBatches(sellers) {
  log(`Processing ${sellers.length} sellers in batches of ${BATCH_SIZE}...`);
  
  for (let i = 0; i < sellers.length; i += BATCH_SIZE) {
    const batch = sellers.slice(i, i + BATCH_SIZE);
    log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(sellers.length/BATCH_SIZE)} (${batch.length} sellers)`);
    
    // Process batch sequentially to avoid rate limits
    for (const seller of batch) {
      await processSeller(seller);
      await sleep(1000); // 1 second delay between sellers
    }
    
    // Delay between batches
    if (i + BATCH_SIZE < sellers.length) {
      log('Waiting 5 seconds before next batch...');
      await sleep(5000);
    }
  }
}

/**
 * Generate and display summary report
 */
function generateSummaryReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 BULK SUBACCOUNT CREATION SUMMARY REPORT');
  console.log('='.repeat(60));
  console.log(`📈 Total Sellers Found: ${stats.totalSellers}`);
  console.log(`✅ Eligible Sellers: ${stats.eligibleSellers}`);
  console.log(`⏭️  Skipped Sellers: ${stats.skippedSellers}`);
  console.log(`🎉 Successful Creations: ${stats.successfulCreations}`);
  console.log(`❌ Failed Creations: ${stats.failedCreations}`);
  console.log(`📊 Success Rate: ${stats.eligibleSellers > 0 ? ((stats.successfulCreations / stats.eligibleSellers) * 100).toFixed(1) : 0}%`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    console.log('-'.repeat(40));
    stats.errors.forEach((error, index) => {
      console.log(`${index + 1}. Seller: ${error.sellerName || error.sellerId}`);
      console.log(`   Type: ${error.type}`);
      console.log(`   Error: ${error.error}`);
      console.log('');
    });
  }
  
  console.log('='.repeat(60));
  console.log(`✅ Script completed at ${new Date().toISOString()}`);
  console.log('='.repeat(60));
}

/**
 * Main execution function
 */
async function main() {
  try {
    log('🚀 Starting bulk Paystack subaccount creation script (REST API)...');
    log(`Platform fee: ${PLATFORM_PERCENTAGE}%`);
    log(`Batch size: ${BATCH_SIZE}`);
    log(`Retry attempts: ${RETRY_ATTEMPTS}`);
    
    // Fetch all sellers
    const allSellers = await fetchSellers();
    
    if (allSellers.length === 0) {
      log('No sellers found in database');
      return;
    }
    
    // Filter eligible sellers
    const eligibleSellers = filterEligibleSellers(allSellers);
    
    if (eligibleSellers.length === 0) {
      log('No eligible sellers found for subaccount creation');
      generateSummaryReport();
      return;
    }
    
    // Show preview of eligible sellers
    console.log('\n📋 ELIGIBLE SELLERS:');
    eligibleSellers.forEach((seller, index) => {
      console.log(`${index + 1}. ${seller.fullName || seller.id} (${seller.bankDetails.bankName})`);
    });
    
    // Confirm before proceeding
    console.log(`\n⚠️  About to create ${eligibleSellers.length} Paystack subaccounts.`);
    console.log('This action cannot be undone. Continue? (y/N)');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      log('Operation cancelled by user');
      return;
    }
    
    // Process sellers
    await processSellersInBatches(eligibleSellers);
    
    // Generate summary report
    generateSummaryReport();
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Script interrupted by user');
  generateSummaryReport();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  fetchSellers,
  filterEligibleSellers,
  createPaystackSubaccount,
  updateSellerDocument
};
