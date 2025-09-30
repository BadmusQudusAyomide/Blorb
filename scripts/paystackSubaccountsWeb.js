// scripts/paystackSubaccountsWeb.js
// Bulk Paystack subaccount creation script using Firebase Web SDK

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc, writeBatch, serverTimestamp } = require('firebase/firestore');
const axios = require('axios');
const { getBankCode, isBankSupported } = require('./bankCodes');
require('dotenv').config();

// Firebase configuration (from your existing config)
const firebaseConfig = {
  apiKey: "AIzaSyCKG09EfN4LrAqYaJ6WTphBN4BEl3DYwbQ",
  authDomain: "blorbmart2.firebaseapp.com",
  projectId: "blorbmart2",
  storageBucket: "blorbmart2.firebasestorage.app",
  messagingSenderId: "323656404685",
  appId: "1:323656404685:web:767a7e5221d30bc0b0e384"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PLATFORM_PERCENTAGE = 15; // 15% platform fee
const BATCH_SIZE = 10; // Process sellers in batches
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
 * Fetch all sellers from Firestore
 */
async function fetchSellers() {
  try {
    log('Fetching sellers from Firestore...');
    
    const sellersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'seller')
    );
    
    const sellersSnapshot = await getDocs(sellersQuery);
    
    const sellers = [];
    sellersSnapshot.forEach(doc => {
      const data = doc.data();
      sellers.push({
        id: doc.id,
        ...data
      });
    });
    
    stats.totalSellers = sellers.length;
    log(`Found ${sellers.length} total sellers`);
    
    return sellers;
  } catch (error) {
    log(`Error fetching sellers: ${error.message}`, 'error');
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
 * Update seller document in Firestore with subaccount details
 */
async function updateSellerDocument(seller, subaccountData) {
  try {
    const sellerRef = doc(db, 'users', seller.id);
    
    const updateData = {
      subaccountCode: subaccountData.subaccountCode,
      subaccountId: subaccountData.subaccountId,
      subaccountCreatedAt: serverTimestamp(),
      paystackSubaccount: subaccountData.data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(sellerRef, updateData);
    log(`Updated Firestore document for ${seller.fullName || seller.id}`, 'success');
    
    return true;
  } catch (error) {
    log(`Failed to update Firestore for ${seller.fullName || seller.id}: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Update seller's products with subaccount code
 */
async function updateSellerProducts(sellerId, subaccountCode) {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerId)
    );
    
    const productsSnapshot = await getDocs(productsQuery);
    
    if (productsSnapshot.empty) {
      log(`No products found for seller ${sellerId}`);
      return true;
    }
    
    const batch = writeBatch(db);
    let productCount = 0;
    
    productsSnapshot.forEach(docSnapshot => {
      const productRef = doc(db, 'products', docSnapshot.id);
      batch.update(productRef, {
        subaccountCode,
        updatedAt: serverTimestamp()
      });
      productCount++;
    });
    
    await batch.commit();
    log(`Updated ${productCount} products for seller ${sellerId}`, 'success');
    
    return true;
  } catch (error) {
    log(`Failed to update products for seller ${sellerId}: ${error.message}`, 'error');
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
    }
    
    // Update seller's products
    const productsUpdateSuccess = await updateSellerProducts(seller.id, subaccountResult.subaccountCode);
    if (!productsUpdateSuccess) {
      stats.errors.push({
        sellerId: seller.id,
        sellerName: seller.fullName || seller.id,
        error: 'Failed to update products',
        type: 'products_update'
      });
    }
    
    if (updateSuccess && productsUpdateSuccess) {
      stats.successfulCreations++;
      log(`✅ Successfully processed seller ${seller.fullName || seller.id}`, 'success');
      return true;
    } else {
      stats.failedCreations++;
      return false;
    }
    
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
    
    // Process batch concurrently
    const promises = batch.map(seller => processSeller(seller));
    await Promise.all(promises);
    
    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < sellers.length) {
      log('Waiting 3 seconds before next batch...');
      await sleep(3000);
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
    log('🚀 Starting bulk Paystack subaccount creation script (Web SDK)...');
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
  updateSellerDocument,
  updateSellerProducts
};
