// src/types/payment.ts
import { Timestamp } from 'firebase/firestore';

export interface PaymentSplit {
  sellerId: string;
  sellerName: string;
  orderAmount: number; // Original order amount for this seller
  platformFee: number; // 15% platform fee
  sellerAmount: number; // 85% amount credited to seller
  actualAmountReceived: number; // Actual amount credited to wallet
  processedAt: Timestamp;
  transactionId: string;
}

export interface WalletCredit {
  id: string;
  sellerId: string;
  orderId: string;
  amount: number;
  source: 'order_payment' | 'refund' | 'adjustment';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  processedAt?: Timestamp;
  metadata?: {
    orderNumber?: string;
    buyerName?: string;
    platformFee?: number;
    originalAmount?: number;
  };
}

export interface EnhancedOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerIds: string[];
  status: "pending" | "approved" | "rejected" | "processing" | "shipped" | "delivered" | "cancelled" | "paid";
  items: { [key: string]: OrderItem };
  sellerItems: {
    [sellerId: string]: OrderItem[];
  };
  sellerStatuses: {
    [sellerId: string]: {
      status: "pending" | "approved" | "rejected" | "shipped" | "delivered";
      approvedAt: Date | null;
      shippedAt: Date | null;
      deliveredAt: Date | null;
      notes: string;
      trackingNumber: string;
    };
  };
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  total: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  statusHistory: StatusHistoryItem[];
  // New payment split fields
  paymentSplits?: PaymentSplit[];
  actualPaymentReceived?: number;
  paymentProcessedAt?: Timestamp;
  walletCreditsProcessed?: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images: string[];
  selectedColor?: string;
  selectedSize?: string;
  sellerId: string;
  sellerStatus: "pending" | "approved" | "rejected" | "shipped" | "delivered";
  sellerNotes?: string;
  trackingNumber?: string;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface PaymentInfo {
  method: string;
  status: string;
  transactionId?: string;
  amount?: number;
  processedAt?: Timestamp;
}

export interface StatusHistoryItem {
  status: string;
  timestamp: string;
  updatedBy: string;
  notes: string;
}

export interface EnhancedTransaction {
  id: string;
  sellerId: string;
  date: Timestamp;
  type: "sale" | "refund" | "payout" | "withdrawal" | "wallet_credit";
  amount: number;
  status: "completed" | "pending" | "failed";
  orderId?: string;
  payoutId?: string;
  walletCreditId?: string;
  description: string;
  metadata?: {
    platformFee?: number;
    originalAmount?: number;
    paymentSplitId?: string;
  };
}

export interface SellerFinancialRecord {
  sellerId: string;
  totalRevenue: number; // Total from order amounts (legacy)
  actualAmountReceived: number; // Real money received from payment splits
  availableBalance: number; // Real money available for withdrawal
  totalWithdrawn: number;
  pendingWithdrawals: number;
  lastUpdated: Timestamp;
  walletCredits: WalletCredit[];
}
