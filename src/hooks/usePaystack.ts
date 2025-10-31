// src/hooks/usePaystack.ts
import { useState, useCallback } from 'react';
import { paystackService } from '../services/paystackService';

interface PaystackHookReturn {
  initiatePayment: (
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
  ) => Promise<void>;
  verifyPayment: (reference: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  paymentUrl: string | null;
  reference: string | null;
}

export const usePaystack = (): PaystackHookReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const initiatePayment = useCallback(async (
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
  ) => {
    setLoading(true);
    setError(null);
    setPaymentUrl(null);
    setReference(null);

    try {
      const result = await paystackService.processCarouselPayment(
        userEmail,
        userId,
        planData,
        adData
      );

      setPaymentUrl(result.paymentUrl);
      setReference(result.reference);

      // Redirect to Paystack payment page
      window.location.href = result.paymentUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initialization failed';
      setError(errorMessage);
      console.error('Payment initiation error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(async (paymentReference: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const success = await paystackService.handlePaymentCallback(paymentReference);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment verification failed';
      setError(errorMessage);
      console.error('Payment verification error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    initiatePayment,
    verifyPayment,
    loading,
    error,
    paymentUrl,
    reference,
  };
};

export default usePaystack;
