// src/utils/paymentCalculations.ts
import { Timestamp } from 'firebase/firestore';
import type { PaymentSplit, EnhancedOrder } from '../types/payment';

export const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee
export const SELLER_PERCENTAGE = 0.85; // 85% goes to seller

export const calculatePaymentSplits = (order: EnhancedOrder): PaymentSplit[] => {
  console.log('Calculating payment splits for order:', order.id);

  // Debug: Log order structure
  console.log('Order structure:', {
    sellerIds: order.sellerIds,
    items: order.items,
    sellerItems: order.sellerItems
  });

  const splits: PaymentSplit[] = [];
  const sellerTotals: { [sellerId: string]: { amount: number; sellerName: string } } = {};

  // First, check if we have sellerItems (newer format)
  if (order.sellerItems && Object.keys(order.sellerItems).length > 0) {
    console.log('Using sellerItems for payment splits');
    Object.entries(order.sellerItems).forEach(([sellerId, items]) => {
      if (!sellerId) {
        console.error('Found empty sellerId in sellerItems');
        return;
      }

      const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      sellerTotals[sellerId] = {
        amount: total,
        sellerName: `Seller ${sellerId}`
      };
    });
  }
  // Fall back to items array (older format)
  else if (order.items) {
    console.log('Using items array for payment splits');
    Object.values(order.items).forEach(item => {
      const sellerId = item.sellerId || (order.sellerIds && order.sellerIds[0]);
      if (!sellerId) {
        console.error('Item is missing sellerId and no sellerIds in order:', item);
        return;
      }

      if (!sellerTotals[sellerId]) {
        sellerTotals[sellerId] = {
          amount: 0,
          sellerName: `Seller ${sellerId}`
        };
      }

      const itemTotal = item.price * (item.quantity || 1);
      sellerTotals[sellerId].amount += itemTotal;
    });
  }

  // Create payment splits
  Object.entries(sellerTotals).forEach(([sellerId, { amount, sellerName }]) => {
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
    const sellerAmount = amount * SELLER_PERCENTAGE;

    splits.push({
      sellerId,
      sellerName,
      orderAmount: amount,
      platformFee,
      sellerAmount,
      actualAmountReceived: sellerAmount,
      processedAt: Timestamp.now(),
      transactionId: `split_${order.id}_${sellerId}_${Date.now()}`
    });
  });

  console.log('Generated payment splits:', splits);
  return splits;
};

export const calculateTotalPlatformFees = (paymentSplits: PaymentSplit[]): number => {
  return paymentSplits.reduce((sum, split) => sum + split.platformFee, 0);
};

export const calculateTotalSellerAmounts = (paymentSplits: PaymentSplit[]): number => {
  return paymentSplits.reduce((sum, split) => sum + split.sellerAmount, 0);
};

export const getSellerSplit = (paymentSplits: PaymentSplit[], sellerId: string): PaymentSplit | undefined => {
  return paymentSplits.find(split => split.sellerId === sellerId);
};

export const calculateAvailableBalance = (
  actualAmountReceived: number,
  totalWithdrawn: number,
  pendingWithdrawals: number
): number => {
  return actualAmountReceived - totalWithdrawn - pendingWithdrawals;
};

export const formatPaymentBreakdown = (split: PaymentSplit) => {
  return {
    sellerId: split.sellerId,
    orderAmount: split.orderAmount,
    platformFee: split.platformFee,
    sellerAmount: split.sellerAmount,
    feePercentage: PLATFORM_FEE_PERCENTAGE * 100
  };
};

export const validatePaymentSplit = (split: PaymentSplit): boolean => {
  if (!split.sellerId) return false;
  if (split.orderAmount <= 0) return false;
  if (split.platformFee < 0 || split.sellerAmount < 0) return false;
  if (Math.abs((split.platformFee + split.sellerAmount) - split.orderAmount) > 0.01) {
    return false; // Allow for small floating point differences
  }
  return true;
};