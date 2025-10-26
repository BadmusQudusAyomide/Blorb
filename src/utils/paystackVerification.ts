interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data?: {
    account_number: string;
    account_name: string;
    bank_id: number;
  };
}

interface BankInfo {
  name: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

interface PaystackBanksResponse {
  status: boolean;
  message: string;
  data: BankInfo[];
}

// You'll need to set your Paystack secret key in environment variables
const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY || '';

/**
 * Fetches list of Nigerian banks from Paystack
 */
export const fetchNigerianBanks = async (): Promise<BankInfo[]> => {
  try {
    const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: PaystackBanksResponse = await response.json();
    
    if (result.status) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch banks');
    }
  } catch (error) {
    console.error('Error fetching banks:', error);
    throw new Error('Unable to fetch bank list. Please try again.');
  }
};

/**
 * Verifies a bank account number using Paystack's account verification API
 * @param accountNumber - The account number to verify
 * @param bankCode - The bank code (e.g., "044" for Access Bank)
 * @returns Promise with verification result
 */
export const verifyBankAccount = async (
  accountNumber: string,
  bankCode: string
): Promise<PaystackVerificationResponse> => {
  try {
    // Validate inputs
    if (!accountNumber || !bankCode) {
      return {
        status: false,
        message: 'Account number and bank code are required',
      };
    }

    // Remove any spaces or special characters from account number
    const cleanAccountNumber = accountNumber.replace(/\D/g, '');
    
    if (cleanAccountNumber.length < 10) {
      return {
        status: false,
        message: 'Account number must be at least 10 digits',
      };
    }

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${cleanAccountNumber}&bank_code=${bankCode}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 422) {
        return {
          status: false,
          message: 'Invalid account number or bank code',
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: PaystackVerificationResponse = await response.json();
    
    if (result.status && result.data) {
      return {
        status: true,
        message: 'Account verified successfully',
        data: result.data,
      };
    } else {
      return {
        status: false,
        message: result.message || 'Account verification failed',
      };
    }
  } catch (error) {
    console.error('Error verifying account:', error);
    return {
      status: false,
      message: 'Unable to verify account. Please check your internet connection and try again.',
    };
  }
};

/**
 * Validates Nigerian account number format
 * @param accountNumber - The account number to validate
 * @returns boolean indicating if format is valid
 */
export const validateAccountNumber = (accountNumber: string): boolean => {
  const cleanNumber = accountNumber.replace(/\D/g, '');
  return cleanNumber.length === 10;
};

/**
 * Formats account number for display (adds spaces for readability)
 * @param accountNumber - The account number to format
 * @returns formatted account number
 */
export const formatAccountNumber = (accountNumber: string): string => {
  const cleanNumber = accountNumber.replace(/\D/g, '');
  return cleanNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
};
