# Paystack Bank Account Verification Setup

This document explains how to set up Paystack bank account verification for your Blorb application.

## Prerequisites

1. A Paystack account (sign up at https://paystack.com)
2. Access to your Paystack dashboard

## Setup Instructions

### 1. Get Your Paystack Secret Key

1. Log in to your Paystack dashboard
2. Navigate to Settings > API Keys & Webhooks
3. Copy your **Secret Key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)

### 2. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and replace the placeholder with your actual Paystack secret key:
   ```
   REACT_APP_PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_key_here
   ```

### 3. Security Considerations

- **Never commit your `.env` file to version control**
- Use test keys during development
- Only use live keys in production
- Regularly rotate your API keys

## How It Works

### Bank Account Verification Process

1. **User Input**: Users select their bank from a dropdown and enter their 10-digit account number
2. **Validation**: The system validates the account number format
3. **Verification**: When the user clicks "Verify", the system calls Paystack's account resolution API
4. **Result**: If successful, the account name is automatically populated and marked as verified

### Features Implemented

- ✅ Real-time bank list fetching from Paystack
- ✅ Account number format validation (10 digits)
- ✅ Paystack account verification integration
- ✅ Visual verification status indicators
- ✅ Automatic account name population
- ✅ Form validation requiring verified accounts
- ✅ Error handling and user feedback

### API Endpoints Used

- `GET https://api.paystack.co/bank?country=nigeria` - Fetch Nigerian banks
- `GET https://api.paystack.co/bank/resolve?account_number={number}&bank_code={code}` - Verify account

## Testing

### Test Mode

When using test keys (`sk_test_`), you can use these test account numbers:

- **Access Bank (044)**: 0123456789
- **GTBank (058)**: 0123456789
- **First Bank (011)**: 0123456789

These will return test account names for verification testing.

### Error Scenarios

The system handles various error scenarios:

- Invalid account numbers
- Network connectivity issues
- Invalid bank codes
- Paystack API errors
- Rate limiting

## Troubleshooting

### Common Issues

1. **"Failed to load bank list"**
   - Check your internet connection
   - Verify your Paystack secret key is correct
   - Ensure the key has the necessary permissions

2. **"Account verification failed"**
   - Verify the account number is exactly 10 digits
   - Ensure the selected bank is correct
   - Check if the account actually exists

3. **"Unable to verify account"**
   - This usually indicates a network or API issue
   - Try again after a few moments
   - Check Paystack service status

### Support

For Paystack-related issues, contact Paystack support at support@paystack.com
For application-specific issues, refer to your development team.

## Production Deployment

Before going live:

1. Replace test keys with live keys
2. Test with real bank accounts
3. Monitor verification success rates
4. Set up proper error logging
5. Consider implementing retry mechanisms for failed verifications

---

**Important**: This verification system helps prevent fraudulent account details but doesn't guarantee that the account holder is the legitimate user. Additional KYC processes may be required for high-value transactions.
