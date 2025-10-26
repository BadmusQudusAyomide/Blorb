import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  TruckIcon,
  EyeIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

interface EscrowOrder {
  id: string;
  orderId: string;
  buyerId: string;
  buyerEmail: string;
  totalAmount: number;
  sellerAmount: number;
  commission: number;
  status: 'pending' | 'released' | 'refunded';
  paymentStatus: 'pending_release' | 'released' | 'refunded';
  deliveryStatus: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  createdAt: any;
  paidAt: any;
  releasedAt: any;
  shippingAddress: any;
  trackingNumber?: string;
  sellerNotes?: string;
}

interface EscrowSellerDashboardProps {
  sellerId: string;
}

const EscrowSellerDashboard: React.FC<EscrowSellerDashboardProps> = ({ sellerId }) => {
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<EscrowOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    pendingOrders: 0,
    pendingPayments: 0,
    totalEarnings: 0,
    releasedPayments: 0
  });

  useEffect(() => {
    if (!sellerId) return;

    // Real-time listener for seller's orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EscrowOrder[];
      
      setOrders(ordersData);
      calculateStats(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sellerId]);

  const calculateStats = (ordersData: EscrowOrder[]) => {
    const pending = ordersData.filter(o => o.status === 'pending').length;
    const pendingPayments = ordersData
      .filter(o => o.paymentStatus === 'pending_release')
      .reduce((sum, o) => sum + o.sellerAmount, 0);
    const releasedPayments = ordersData
      .filter(o => o.paymentStatus === 'released')
      .reduce((sum, o) => sum + o.sellerAmount, 0);
    const totalEarnings = pendingPayments + releasedPayments;

    setStats({
      pendingOrders: pending,
      pendingPayments,
      totalEarnings,
      releasedPayments
    });
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    try {
      setUpdating(true);
      await updateDoc(doc(db, 'orders', orderId), {
        deliveryStatus: status,
        ...(trackingNumber && { trackingNumber }),
        ...(sellerNotes && { sellerNotes }),
        updatedAt: new Date()
      });
      
      setSelectedOrder(null);
      setTrackingNumber('');
      setSellerNotes('');
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Failed to update delivery status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_release':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'released':
      case 'delivered':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'refunded':
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'shipped':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString()}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Escrow Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your orders and track escrow payments
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
          <ShieldCheckIcon className="w-5 h-5" />
          <span>Escrow Protected</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingOrders}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(stats.pendingPayments)}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Released Payments</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.releasedPayments)}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(stats.totalEarnings)}
              </p>
            </div>
            <BanknotesIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>
      </div>

      {/* Escrow Information Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
      >
        <div className="flex items-start space-x-4">
          <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How Escrow Payments Work
            </h3>
            <div className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
              <p>• Customer payments are held securely in escrow until delivery is confirmed</p>
              <p>• You'll receive payment only after the admin confirms successful delivery</p>
              <p>• Mark orders as "shipped" and provide tracking numbers to speed up the process</p>
              <p>• Platform commission (10%) is automatically deducted from your earnings</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Orders List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Orders</h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Orders Yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Orders will appear here when customers purchase your products.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order {order.orderId}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      You earn: {formatCurrency(order.sellerAmount)}
                    </p>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>
                      <CurrencyDollarIcon className="w-4 h-4" />
                      <span className="capitalize">{order.paymentStatus.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Payment Status</p>
                  </div>

                  <div className="text-center">
                    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(order.deliveryStatus)}`}>
                      <TruckIcon className="w-4 h-4" />
                      <span className="capitalize">{order.deliveryStatus}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Delivery Status</p>
                  </div>

                  <div className="text-center">
                    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="capitalize">{order.status}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Order Status</p>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Items ({order.items.length})
                  </p>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="text-sm text-gray-900 dark:text-white">
                        {item.quantity}x {item.productName} - {formatCurrency(item.totalPrice)}
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-sm text-gray-500">
                        +{order.items.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  
                  {order.deliveryStatus === 'pending' && (
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <TruckIcon className="w-4 h-4" />
                      <span>Mark as Shipped</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Order {selectedOrder.orderId}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customer Information</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email: {selectedOrder.buyerEmail}</p>
                  {selectedOrder.shippingAddress && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Shipping Address:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}
                        <br />
                        {selectedOrder.shippingAddress.state}, {selectedOrder.shippingAddress.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Update Delivery Status */}
              {selectedOrder.deliveryStatus !== 'delivered' && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Update Delivery Status</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tracking Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={sellerNotes}
                        onChange={(e) => setSellerNotes(e.target.value)}
                        placeholder="Add any notes about the shipment"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => updateDeliveryStatus(selectedOrder.id, 'shipped')}
                        disabled={updating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {updating ? 'Updating...' : 'Mark as Shipped'}
                      </button>
                      <button
                        onClick={() => updateDeliveryStatus(selectedOrder.id, 'delivered')}
                        disabled={updating}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {updating ? 'Updating...' : 'Mark as Delivered'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EscrowSellerDashboard;
