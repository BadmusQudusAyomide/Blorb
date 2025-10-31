// src/services/paystackService.ts
import { db } from '../firebase.config';
import { collection, addDoc } from 'firebase/firestore';

interface PaystackPaymentData {
  email: string;
  amount: number; // Amount in kobo (multiply by 100)
  reference?: string;
  callback_url?: string;
  metadata?: {
    userId: string;
    planId: string;
    planName: string;
    days: number;
    adTitle: string;
    [key: string]: any;
  };
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    metadata?: any;
  };
}

class PaystackService {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor() {
    // In production, these should be environment variables
    this.secretKey = process.env.REACT_APP_PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key';
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment(paymentData: PaystackPaymentData): Promise<PaystackResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          amount: paymentData.amount * 100, // Convert to kobo
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Payment initialization failed');
      }

      return result;
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<PaystackVerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Payment verification failed');
      }

      return result;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Generate a unique payment reference
   */
  generateReference(prefix: string = 'carousel'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Process carousel ad payment
   */
  async processCarouselPayment(
    userEmail: string,
    userId: string,
    planData: {
      id: string;
      name: string;
      price: number;
      days: number;
    },
    adData: {
      title: string;
      description: string;
      image: string;
      link?: string;
    }
  ): Promise<{ paymentUrl: string; reference: string }> {
    try {
      const reference = this.generateReference('carousel');
      const processingFee = 2500; // ₦2,500
      const totalAmount = planData.price + processingFee;

      const paymentData: PaystackPaymentData = {
        email: userEmail,
        amount: totalAmount,
        reference,
        callback_url: `${window.location.origin}/carousel?payment=success`,
        metadata: {
          userId,
          planId: planData.id,
          planName: planData.name,
          days: planData.days,
          adTitle: adData.title,
          adDescription: adData.description,
          adImage: adData.image,
          adLink: adData.link || '',
          processingFee,
          basePrice: planData.price,
        },
      };

      // Initialize payment with Paystack
      const response = await this.initializePayment(paymentData);

      if (!response.status || !response.data) {
        throw new Error('Failed to initialize payment');
      }

      // Save payment record to Firebase
      await addDoc(collection(db, 'payments'), {
        reference,
        userId,
        type: 'carousel_ad',
        amount: totalAmount,
        status: 'pending',
        planData,
        adData,
        paymentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        paymentUrl: response.data.authorization_url,
        reference: response.data.reference,
      };
    } catch (error) {
      console.error('Error processing carousel payment:', error);
      throw error;
    }
  }

  /**
   * Handle payment callback and create carousel ad
   */
  async handlePaymentCallback(reference: string): Promise<boolean> {
    try {
      // Verify payment with Paystack
      const verification = await this.verifyPayment(reference);

      if (!verification.status || !verification.data) {
        throw new Error('Payment verification failed');
      }

      const { data } = verification;

      if (data.status !== 'success') {
        throw new Error(`Payment failed: ${data.gateway_response}`);
      }

      // Note: In a real app, you'd query by reference to find and update the payment document

      // Create carousel ad from metadata
      if (data.metadata) {
        const carouselData = {
          image: data.metadata.adImage,
          title: data.metadata.adTitle,
          description: data.metadata.adDescription,
          link: data.metadata.adLink || '',
          planId: data.metadata.planId,
          planName: data.metadata.planName,
          days: data.metadata.days,
          price: data.metadata.basePrice,
          paymentStatus: 'completed' as const,
          userId: data.metadata.userId,
          paymentReference: reference,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await addDoc(collection(db, 'carousel'), carouselData);
      }

      return true;
    } catch (error) {
      console.error('Error handling payment callback:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(reference: string): Promise<'success' | 'failed' | 'pending'> {
    try {
      const verification = await this.verifyPayment(reference);
      return verification.data?.status || 'failed';
    } catch (error) {
      console.error('Error getting payment status:', error);
      return 'failed';
    }
  }
}

export const paystackService = new PaystackService();
export default paystackService;
