import {
    collection,
    doc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    runTransaction,
    setDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';
import type {
    WalletCredit,
    EnhancedOrder,
    EnhancedTransaction,
    SellerFinancialRecord,
    PaymentSplit
} from '../types/payment';
import { PLATFORM_FEE_PERCENTAGE } from '../utils/paymentCalculations';

/**
 * Process wallet credit for a single seller when they approve an order
 */
export const processSellerPayment = async (order: EnhancedOrder, sellerId: string): Promise<void> => {
    try {
        // Calculate the payment split for this seller
        const sellerItems = Object.values(order.items || {}).filter(item => item.sellerId === sellerId);
        const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const platformFee = sellerTotal * PLATFORM_FEE_PERCENTAGE;
        const sellerAmount = sellerTotal - platformFee;

        const paymentSplit: PaymentSplit = {
            sellerId,
            sellerName: `Seller ${sellerId}`,
            orderAmount: sellerTotal,
            platformFee,
            sellerAmount,
            actualAmountReceived: sellerAmount,
            processedAt: Timestamp.now(),
            transactionId: `split_${order.id}_${sellerId}_${Date.now()}`
        };

        // Update the order with the payment split if it doesn't exist
        if (!order.paymentSplits?.some(split => split.sellerId === sellerId)) {
            await updateDoc(doc(db, 'orders', order.id), {
                paymentSplits: [...(order.paymentSplits || []), paymentSplit]
            });
        }

        const sellerFinancialRef = doc(db, 'sellerFinancials', sellerId);
        const walletCreditRef = doc(collection(db, 'walletCredits'));

        // Create wallet credit record
        const walletCredit: Omit<WalletCredit, 'id'> = {
            sellerId,
            orderId: order.id,
            amount: sellerAmount,
            source: 'order_payment',
            status: 'completed',
            createdAt: Timestamp.now(),
            processedAt: Timestamp.now(),
            metadata: {
                orderNumber: order.orderNumber,
                buyerName: order.buyerName,
                platformFee,
                originalAmount: sellerTotal
            }
        };

        // Create transaction record
        const transactionRecord: Omit<EnhancedTransaction, 'id'> = {
            sellerId,
            date: Timestamp.now(),
            type: 'wallet_credit',
            amount: sellerAmount,
            status: 'completed',
            orderId: order.id,
            description: `Payment for order ${order.orderNumber}`,
            metadata: {
                platformFee,
                originalAmount: sellerTotal,
                paymentSplitId: paymentSplit.transactionId
            }
        };

        // Use a transaction to ensure atomic updates
        await runTransaction(db, async (transaction) => {
            // Get current financial data
            const financialDoc = await transaction.get(sellerFinancialRef);
            let currentData: SellerFinancialRecord | null = null;

            if (financialDoc.exists()) {
                currentData = financialDoc.data() as SellerFinancialRecord;
            }

            // Update seller financials
            const newTotalRevenue = (currentData?.totalRevenue || 0) + sellerTotal;
            const newActualAmount = (currentData?.actualAmountReceived || 0) + sellerAmount;
            const newAvailableBalance = (currentData?.availableBalance || 0) + sellerAmount;

            transaction.set(sellerFinancialRef, {
                sellerId,
                totalRevenue: newTotalRevenue,
                actualAmountReceived: newActualAmount,
                availableBalance: newAvailableBalance,
                totalWithdrawn: currentData?.totalWithdrawn || 0,
                pendingWithdrawals: currentData?.pendingWithdrawals || 0,
                lastUpdated: Timestamp.now()
            }, { merge: true });

            // Add wallet credit
            transaction.set(walletCreditRef, walletCredit);

            // Add transaction record
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, transactionRecord);
        });

        console.log(`Successfully processed payment for seller ${sellerId} on order ${order.id}`);
    } catch (error) {
        console.error(`Error processing payment for seller ${sellerId} on order ${order.id}:`, error);
        throw error;
    }
};

/**
 * Simulate order payment processing (for testing)
 */
export const simulateOrderPayment = async (orderId: string): Promise<void> => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            throw new Error('Order not found');
        }

        const order = { id: orderSnap.id, ...orderSnap.data() } as EnhancedOrder;

        // For each seller in the order, process their payment
        const sellerIds = [...new Set(Object.values(order.items || {}).map(item => item.sellerId))];

        for (const sellerId of sellerIds) {
            await processSellerPayment(order, sellerId);
        }

        // Update order status
        await updateDoc(orderRef, {
            status: 'paid',
            paymentInfo: {
                status: 'completed',
                processedAt: Timestamp.now()
            },
            updatedAt: Timestamp.now()
        });

        console.log(`Successfully processed payment for order ${orderId}`);
    } catch (error) {
        console.error('Error simulating payment:', error);
        throw error;
    }
};

/**
 * Get financial status for a seller
 * @param sellerId - The ID of the seller
 * @returns Promise with the seller's financial status
 */
export const getSellerFinancialStatus = async (sellerId: string): Promise<SellerFinancialRecord> => {
    try {
        const sellerFinancialRef = doc(db, 'sellerFinancials', sellerId);
        const financialDoc = await getDoc(sellerFinancialRef);
        
        if (!financialDoc.exists()) {
            // Initialize with default values if no record exists
            const defaultFinancials: SellerFinancialRecord = {
                sellerId,
                totalRevenue: 0,
                actualAmountReceived: 0,
                availableBalance: 0,
                totalWithdrawn: 0,
                pendingWithdrawals: 0,
                lastUpdated: Timestamp.now(),
                walletCredits: []
            };
            
            // Create the document with default values
            await setDoc(sellerFinancialRef, defaultFinancials);
            return defaultFinancials;
        }
        
        const data = financialDoc.data();
        return {
            id: financialDoc.id,
            sellerId: data.sellerId,
            totalRevenue: data.totalRevenue || 0,
            actualAmountReceived: data.actualAmountReceived || 0,
            availableBalance: data.availableBalance || 0,
            totalWithdrawn: data.totalWithdrawn || 0,
            pendingWithdrawals: data.pendingWithdrawals || 0,
            lastUpdated: data.lastUpdated || Timestamp.now(),
            walletCredits: data.walletCredits || []
        } as SellerFinancialRecord;
    } catch (error) {
        console.error('Error getting seller financial status:', error);
        throw error;
    }
};

/**
 * Get wallet credits for a seller
 * @param sellerId - The ID of the seller
 * @param limit - Maximum number of credits to return (default: 10)
 * @returns Promise with an array of wallet credits
 */
export const getSellerWalletCredits = async (sellerId: string, limit: number = 10): Promise<WalletCredit[]> => {
    try {
        const walletCreditsRef = collection(db, 'walletCredits');
        const q = query(
            walletCreditsRef,
            where('sellerId', '==', sellerId),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.slice(0, limit).map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                sellerId: data.sellerId,
                orderId: data.orderId,
                amount: data.amount,
                source: data.source,
                status: data.status,
                createdAt: data.createdAt,
                processedAt: data.processedAt,
                metadata: data.metadata || {}
            } as WalletCredit;
        });
    } catch (error) {
        console.error('Error getting wallet credits:', error);
        throw error;
    }
};

/**
 * Update seller's balance after a withdrawal
 * @param sellerId - The ID of the seller
 * @param amount - The amount to withdraw
 * @returns Promise that resolves when the update is complete
 */
export const updateBalanceAfterWithdrawal = async (sellerId: string, amount: number): Promise<void> => {
    try {
        const sellerFinancialRef = doc(db, 'sellerFinancials', sellerId);
        
        await runTransaction(db, async (transaction) => {
            const financialDoc = await transaction.get(sellerFinancialRef);
            
            if (!financialDoc.exists()) {
                throw new Error('Seller financial record not found');
            }
            
            const currentData = financialDoc.data() as SellerFinancialRecord;
            
            if (currentData.availableBalance < amount) {
                throw new Error('Insufficient balance for withdrawal');
            }
            
            transaction.update(sellerFinancialRef, {
                availableBalance: currentData.availableBalance - amount,
                totalWithdrawn: (currentData.totalWithdrawn || 0) + amount,
                lastUpdated: Timestamp.now()
            });
        });
    } catch (error) {
        console.error('Error updating balance after withdrawal:', error);
        throw error;
    }
};

// Export processOrderPaymentSplits for backward compatibility
export const processOrderPaymentSplits = simulateOrderPayment;