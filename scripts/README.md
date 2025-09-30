# Blorb Paystack Subaccount Creation Scripts

This directory contains scripts for bulk creation of Paystack subaccounts for sellers in the Blorb marketplace.

## 📋 Overview

The bulk subaccount creation script automatically:
- Fetches all sellers from Firestore with complete bank details
- Creates Paystack subaccounts with 15% platform fee
- Updates seller documents with subaccount codes
- Updates all seller products with subaccount references
- Provides comprehensive error handling and reporting

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd scripts
npm install
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Paystack secret key
PAYSTACK_SECRET_KEY=sk_live_your_actual_secret_key
```

### 3. Firebase Setup
The script uses your existing Firebase project configuration (blorbmart2). No additional setup needed since your app is already connected to Firebase.

### 4. Test Bank Code Mapping
```bash
npm run test-bank-codes
```

### 5. Run Bulk Subaccount Creation
```bash
npm run create-subaccounts
```

## 📁 Files

### Core Scripts
- **`paystackSubaccounts.js`** - Main bulk creation script
- **`bankCodes.js`** - Nigerian bank name to Paystack code mapping
- **`testBankCodes.js`** - Test script for bank code validation

### Configuration
- **`package.json`** - Node.js dependencies and scripts
- **`.env.example`** - Environment variable template
- **`README.md`** - This documentation

## 🔧 Configuration

### Environment Variables
```bash
PAYSTACK_SECRET_KEY=sk_live_your_secret_key  # Required
BATCH_SIZE=10                                # Optional: Sellers per batch
RETRY_ATTEMPTS=2                             # Optional: Retry failed requests
RETRY_DELAY=2000                            # Optional: Delay between retries (ms)
```

### Script Parameters
- **Platform Fee**: 15% (configured in script)
- **Batch Processing**: 10 sellers per batch (configurable)
- **Retry Logic**: 2 attempts with 2-second delays
- **Timeout**: 30 seconds per API call

## 📊 Process Flow

1. **Fetch Sellers**: Query Firestore for `role === "seller"`
2. **Filter Eligible**: Check for complete bank details and missing subaccounts
3. **Validate Banks**: Ensure bank names map to Paystack codes
4. **Create Subaccounts**: Batch API calls to Paystack
5. **Update Firestore**: Add subaccount codes to seller documents
6. **Update Products**: Link products to seller subaccounts
7. **Generate Report**: Summary of successes and failures

## 🏦 Supported Banks

The script supports 40+ Nigerian banks including:

### Major Banks
- Access Bank (044)
- Guaranty Trust Bank (058)
- First Bank (011)
- United Bank for Africa (033)
- Zenith Bank (057)
- Union Bank (032)
- Fidelity Bank (070)
- Sterling Bank (232)

### Digital Banks
- Kuda Bank (50211)
- Opay (999992)
- PalmPay (999991)
- Moniepoint (50515)

### Islamic Banks
- Jaiz Bank (301)
- TAJ Bank (302)

*See `bankCodes.js` for complete list*

## 🛡️ Error Handling

### Validation Errors
- Missing bank details
- Unsupported banks
- Invalid account numbers

### API Errors
- Network timeouts
- Paystack API failures
- Rate limiting

### Database Errors
- Firestore update failures
- Transaction conflicts

### Retry Logic
- Failed requests retry up to 2 times
- 2-second delay between retries
- Comprehensive error logging

## 📈 Reporting

The script generates a detailed summary report:

```
📊 BULK SUBACCOUNT CREATION SUMMARY REPORT
============================================================
📈 Total Sellers Found: 150
✅ Eligible Sellers: 120
⏭️  Skipped Sellers: 30
🎉 Successful Creations: 115
❌ Failed Creations: 5
📊 Success Rate: 95.8%

❌ ERRORS ENCOUNTERED:
----------------------------------------
1. Seller: John Doe
   Type: paystack_creation
   Error: Invalid account number

2. Seller: Jane Smith
   Type: firestore_update
   Error: Permission denied
```

## 🔍 Testing

### Test Bank Code Mapping
```bash
npm run test-bank-codes
```

This validates:
- Bank name variations
- Code lookup accuracy
- Supported bank coverage

### Dry Run Mode
For testing, you can modify the script to skip actual Paystack API calls and Firestore updates.

## 🚨 Important Notes

### Production Considerations
- **Backup Database**: Always backup Firestore before running
- **Test Environment**: Run on staging first
- **Rate Limits**: Paystack has API rate limits
- **Monitoring**: Monitor for failed transactions

### Security
- Never commit `.env` files
- Use environment variables for secrets
- Restrict Firebase service account permissions
- Use Paystack test keys for development

### Data Integrity
- Script prevents duplicate subaccounts
- Atomic Firestore transactions
- Comprehensive audit logging
- Rollback procedures documented

## 🆘 Troubleshooting

### Common Issues

**"PAYSTACK_SECRET_KEY not found"**
- Ensure `.env` file exists with valid key
- Check environment variable loading

**"Unsupported bank: XYZ Bank"**
- Add bank mapping to `bankCodes.js`
- Verify bank name spelling

**"Permission denied"**
- Check Firebase service account permissions
- Verify Firestore security rules

**"Network timeout"**
- Increase timeout in script
- Check internet connection
- Verify Paystack API status

### Getting Help
1. Check error logs in console output
2. Review Firestore security rules
3. Verify Paystack API credentials
4. Contact Paystack support for API issues

## 🔄 Integration with Wallet Credit System

This script integrates with the existing wallet credit system:
- Subaccounts enable direct payment routing
- Maintains 15% platform fee structure
- Compatible with real-time wallet credits
- Preserves existing payout approval workflow

## 📝 License

MIT License - See main project license for details.
