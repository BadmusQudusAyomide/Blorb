// src/pages/OrdersPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase.config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Search
} from 'lucide-react';
import TopBar from '../components/dashboard/TopBar';
import Sidebar from '../components/dashboard/Sidebar';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images: string[];
  selectedColor?: string;
  selectedSize?: string;
  sellerId: string;
  sellerStatus: 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered';
  sellerNotes?: string;
  trackingNumber?: string;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerIds: string[];
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: { [key: string]: OrderItem };
  sellerItems: {
    [sellerId: string]: OrderItem[];
  };
  sellerStatuses: {
    [sellerId: string]: {
      status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered';
      approvedAt: Date | null;
      shippedAt: Date | null;
      deliveredAt: Date | null;
      notes: string;
      trackingNumber: string;
    };
  };
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentInfo: {
    method: string;
    status: string;
    transactionId?: string;
  };
  total: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  statusHistory: {
    status: string;
    timestamp: string;
    updatedBy: string;
    notes: string;
  }[];
}

const OrdersPage = () => {
  const { user, seller } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const ordersPerPage = 10;

  // Fetch orders
  useEffect(() => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('Current user:', {
      uid: user.uid,
      email: user.email,
      sellerId: seller?.id
    });

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('sellerIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    console.log('Fetching orders for seller:', user.uid);

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Order data:', {
            id: doc.id,
            sellerIds: data.sellerIds,
            sellerItems: data.sellerItems,
            items: data.items,
            buyerId: data.buyerId,
            buyerName: data.buyerName
          });
          return {
            id: doc.id,
            ...data
          };
        }) as Order[];
        console.log('Fetched orders:', ordersData);
        setOrders(ordersData);
        setLoading(false);
        setError(null);
      }, 
      (error) => {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch orders. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, seller]);

  // Filter orders based on search query and active tab
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingInfo.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingInfo.lastName.toLowerCase().includes(searchQuery.toLowerCase());

    const sellerStatus = order.sellerStatuses[user?.uid || '']?.status || 'pending';
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && sellerStatus === 'pending') ||
      (activeTab === 'approved' && sellerStatus === 'approved') ||
      (activeTab === 'rejected' && sellerStatus === 'rejected');

    return matchesSearch && matchesTab;
  });

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Add new function to handle order status updates
  const handleOrderStatusUpdate = async (orderId: string, newStatus: 'approved' | 'rejected') => {
    if (!user) return;
    
    setProcessingOrder(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const order = orders.find(o => o.id === orderId);
      
      if (!order) return;

      const status = newStatus === 'approved' ? 'approved' : 'rejected';
      const timestamp = new Date().toISOString();
      
      await updateDoc(orderRef, {
        [`sellerStatuses.${user.uid}.status`]: status,
        [`sellerStatuses.${user.uid}.approvedAt`]: newStatus === 'approved' ? Timestamp.now() : null,
        [`sellerStatuses.${user.uid}.notes`]: newStatus === 'approved' ? 'Order approved by seller' : 'Order rejected by seller',
        updatedAt: Timestamp.now(),
        statusHistory: arrayUnion({
          status: status,
          timestamp: timestamp,
          updatedBy: user.uid,
          notes: newStatus === 'approved' ? 'Order approved by seller' : 'Order rejected by seller'
        })
      });

      // Update individual items status
      const sellerItems = order.sellerItems[user.uid] || [];
      for (const item of sellerItems) {
        await updateDoc(orderRef, {
          [`items.${item.id}.sellerStatus`]: status
        });
      }

      setProcessingOrder(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      setProcessingOrder(null);
    }
  };

  // Modify the getStatusClass function to include new statuses
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Modify the getStatusIcon function to include new statuses
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <ShoppingCart className="w-4 h-4 text-gray-500" />;
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        // Pre-process the data to ensure all necessary fields are available
        const processedOrder = {
          id: orderDoc.id,
          ...orderData,
          sellerItems: orderData.sellerItems || {},
          items: orderData.items || {},
          statusHistory: orderData.statusHistory || [],
          shippingInfo: orderData.shippingInfo || {},
          paymentInfo: orderData.paymentInfo || {}
        } as Order;
        setSelectedOrder(processedOrder);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <TopBar />
        <main className="pt-16 pl-0 lg:pl-64">
          <div className="p-4 md:p-6">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <TopBar />
        <main className="pt-16 pl-0 lg:pl-64">
          <div className="p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-150">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Orders</h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Manage your orders
            </p>
          </div>
          
          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-800">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`${
                    activeTab === 'all'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`${
                    activeTab === 'pending'
                      ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`${
                    activeTab === 'approved'
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`${
                    activeTab === 'rejected'
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Rejected
                </button>
            </nav>
            </div>
          </div>
          
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                className="block w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Orders Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Items
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            #{order.orderNumber}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800 dark:text-gray-200">
                            {order.sellerItems[user?.uid || '']?.map((item: OrderItem, index) => (
                              <div key={item.id || index} className="flex items-center">
                                <span>{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                          {order.buyerName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {order.createdAt.toDate().toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(order.sellerStatuses[user?.uid || '']?.status || 'pending')}
                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.sellerStatuses[user?.uid || '']?.status || 'pending')}`}>
                              {order.sellerStatuses[user?.uid || '']?.status?.charAt(0).toUpperCase() + order.sellerStatuses[user?.uid || '']?.status?.slice(1) || 'Pending'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {Object.keys(order.items).length}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800 dark:text-gray-200">
                          ₦{order.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => viewOrderDetails(order.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {filteredOrders.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastOrder, filteredOrders.length)}</span> of{' '}
                    <span className="font-medium">{filteredOrders.length}</span> results
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                  <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Order #{selectedOrder.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedOrder.createdAt.toDate().toLocaleString()}
                    </p>
                  </div>
                    <div className="flex items-center space-x-4">
                      {selectedOrder.sellerStatuses[user?.uid || '']?.status === 'pending' && (
                        <>
                      <button
                            onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'approved')}
                            disabled={processingOrder === selectedOrder.id}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {processingOrder === selectedOrder.id ? (
                              'Processing...'
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept Order
                              </>
                            )}
                      </button>
                          <button
                            onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'rejected')}
                            disabled={processingOrder === selectedOrder.id}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {processingOrder === selectedOrder.id ? (
                              'Processing...'
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Order
                              </>
                            )}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Order Information</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Date:</span> {selectedOrder.createdAt.toDate().toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(selectedOrder.sellerStatuses[user?.uid || '']?.status || 'pending')}`}>
                            {selectedOrder.sellerStatuses[user?.uid || '']?.status?.charAt(0).toUpperCase() + 
                             selectedOrder.sellerStatuses[user?.uid || '']?.status?.slice(1) || 'Pending'}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Total:</span> ₦{selectedOrder.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Customer Information</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Name:</span> {selectedOrder.buyerName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Email:</span> {selectedOrder.buyerEmail}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Phone:</span> {selectedOrder.shippingInfo.phone}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Order Items</h4>
                      <div className="space-y-4">
                        {selectedOrder.sellerItems[user?.uid || '']?.map((item: OrderItem) => (
                          <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <img
                              src={item.images?.[0]}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                              <div className="mt-1 space-y-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Quantity: {item.quantity}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Price: ₦{item.price.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Subtotal: ₦{(item.price * item.quantity).toFixed(2)}
                                </p>
                                {item.selectedColor && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Color: {item.selectedColor}
                                  </p>
                                )}
                                {item.selectedSize && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Size: {item.selectedSize}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status History */}
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Status History</h4>
                      <div className="space-y-2">
                        {selectedOrder.statusHistory.map((status, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(status.timestamp).toLocaleString()}
                              </p>
                              {status.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {status.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;