import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase.config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  CreditCard, 
  History,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  date: Timestamp;
  type: 'sale' | 'refund' | 'payout' | 'withdrawal';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  orderId?: string;
  payoutId?: string;
  description: string;
}

interface Payout {
  id: string;
  sellerId: string;
  amount: number;
  status: 'requested' | 'approved' | 'rejected' | 'processed';
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  adminNotes?: string;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface Order {
  id: string;
  total: number;
  createdAt: Timestamp;
}

const FinancesPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      
      // Fetch transactions
      const transactionsRef = collection(db, 'transactions');
      const transactionsQuery = query(
        transactionsRef,
        where('sellerId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(transactionsData);

      // Fetch payouts
      const payoutsRef = collection(db, 'payouts');
      const payoutsQuery = query(
        payoutsRef,
        where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payoutsData = payoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payout[];
      setPayouts(payoutsData);

      // Fetch bank account
      const sellerDoc = await getDoc(doc(db, 'sellers', user.uid));
      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        if (sellerData.bankDetails) {
          setBankAccounts([sellerData.bankDetails]);
          setSelectedBankAccount(sellerData.bankDetails);
        }
      }

      // Fetch orders for revenue calculation
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(
        ordersRef,
        where('sellerIds', 'array-contains', user.uid),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          total: Number(data.total) || 0,
          createdAt: data.createdAt
        } as Order;
      });
      setOrders(ordersData);
      const revenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
      setTotalRevenue(revenue);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up real-time listeners
  useEffect(() => {
    if (!user?.uid) return;

    const transactionsRef = collection(db, 'transactions');
    const transactionsQuery = query(
      transactionsRef,
      where('sellerId', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(data);
    });

    const payoutsRef = collection(db, 'payouts');
    const payoutsQuery = query(
      payoutsRef,
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribePayouts = onSnapshot(payoutsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payout[];
      setPayouts(data);
    });

    return () => {
      unsubscribeTransactions();
      unsubscribePayouts();
    };
  }, [user?.uid]);

  // Calculate available balance - UPDATED to include pending withdrawals
  const availableBalance = totalRevenue - 
    transactions
      .filter(tx => tx.type === 'withdrawal' && (tx.status === 'completed' || tx.status === 'pending'))
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Validate payout amount
  const validatePayoutAmount = (amount: string) => {
    const value = parseFloat(amount);
    if (isNaN(value)) {
      setAmountError('Please enter a valid amount');
      return false;
    }
    
    if (value <= 0) {
      setAmountError('Amount must be greater than zero');
      return false;
    }
    
    if (value > availableBalance) {
      setAmountError('Amount exceeds your available balance');
      return false;
    }

    if (value < 1000) {
      setAmountError('Minimum payout amount is ₦1,000');
      return false;
    }
    
    setAmountError(null);
    return true;
  };

  // Handle payout amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPayoutAmount(value);
    validatePayoutAmount(value);
  };

  // Prepare data for charts
  const prepareRevenueData = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    return orders
      .filter(order => order.createdAt.toDate() >= last30Days)
      .reduce((acc: Record<string, number>, order) => {
        const date = order.createdAt.toDate().toLocaleDateString();
        acc[date] = (acc[date] || 0) + order.total;
        return acc;
      }, {});
  };

  const preparePayoutData = () => {
    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 12);
    
    return payouts
      .filter(payout => payout.createdAt.toDate() >= last12Months)
      .reduce((acc: Record<string, number>, payout) => {
        const monthYear = payout.createdAt.toDate().toLocaleDateString('default', { 
          month: 'short', 
          year: 'numeric' 
        });
        acc[monthYear] = (acc[monthYear] || 0) + payout.amount;
        return acc;
      }, {});
  };

  // Status and type badge helpers
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      requested: 'bg-purple-100 text-purple-800',
      approved: 'bg-teal-100 text-teal-800',
      rejected: 'bg-red-100 text-red-800',
      processed: 'bg-green-100 text-green-800'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      sale: 'bg-green-100 text-green-800',
      refund: 'bg-red-100 text-red-800',
      payout: 'bg-blue-100 text-blue-800',
      withdrawal: 'bg-yellow-100 text-yellow-800'
    };
    return typeClasses[type as keyof typeof typeClasses] || 'bg-gray-100 text-gray-800';
  };

  // Handle payout request
  const handlePayoutRequest = async () => {
    if (!user?.uid || !selectedBankAccount) return;
    
    if (!validatePayoutAmount(payoutAmount)) return;

    const amount = parseFloat(payoutAmount);
    
    try {
      setLoading(true);
      setError(null);
      
      // Create payout record
      const payoutData = {
        sellerId: user.uid,
        amount,
        status: 'requested',
        bankDetails: selectedBankAccount,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const payoutRef = await addDoc(collection(db, 'payouts'), payoutData);
      
      // Create transaction record
      const transactionData = {
        sellerId: user.uid,
        date: Timestamp.now(),
        type: 'withdrawal',
        amount: -amount,
        status: 'pending',
        description: `Payout request #${payoutRef.id}`,
        payoutId: payoutRef.id
      };
      
      await addDoc(collection(db, 'transactions'), transactionData);

      setPayoutAmount('');
      setPayoutSuccess(true);
      setShowPayoutModal(false);
    } catch (error) {
      console.error('Error requesting payout:', error);
      setError('Failed to request payout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel payout request
  const cancelPayoutRequest = async (payoutId: string) => {
    if (!window.confirm('Are you sure you want to cancel this payout request?')) return;

    try {
      setLoading(true);
      
      // Update payout status
      await updateDoc(doc(db, 'payouts', payoutId), {
        status: 'rejected',
        updatedAt: Timestamp.now(),
        adminNotes: 'Cancelled by seller'
      });

      // Update related transaction
      const relatedTx = transactions.find(tx => tx.payoutId === payoutId);
      if (relatedTx) {
        await updateDoc(doc(db, 'transactions', relatedTx.id), {
          status: 'failed',
          description: `Payout cancelled - ${relatedTx.description}`
        });
      }

      setPayoutSuccess(true);
      setTimeout(() => setPayoutSuccess(false), 3000);
    } catch (error) {
      console.error('Error cancelling payout:', error);
      setError('Failed to cancel payout');
    } finally {
      setLoading(false);
    }
  };

  // Close success message after 3 seconds
  useEffect(() => {
    if (payoutSuccess) {
      const timer = setTimeout(() => {
        setPayoutSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [payoutSuccess]);

  // Prepare chart data
  const revenueChartData = Object.entries(prepareRevenueData()).map(([date, revenue]) => ({
    date,
    revenue
  }));

  const payoutChartData = Object.entries(preparePayoutData()).map(([month, amount]) => ({
    month,
    amount
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Financial Dashboard</h2>
            <p className="text-sm text-gray-600">Manage your earnings, payouts, and transactions</p>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {payoutSuccess && (
            <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-md flex items-center">
              <Check className="w-5 h-5 mr-2" />
              Operation completed successfully
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalRevenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(availableBalance)}</p>
                  <p className="text-xs text-gray-500 mt-1">Ready for withdrawal</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payouts</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(payouts.reduce((sum, payout) => sum + payout.amount, 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All-time withdrawals</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <ArrowUpRight className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(
                      payouts
                        .filter(p => p.status === 'requested' || p.status === 'approved')
                        .reduce((sum, payout) => sum + payout.amount, 0)
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">In processing</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <History className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Revenue (Last 30 Days)</h3>
              <div className="h-64">
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₦${value.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#4f46e5" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No revenue data available for the last 30 days
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Payouts (Last 12 Months)</h3>
              <div className="h-64">
                {payoutChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payoutChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₦${value.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Payout']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="#8884d8" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No payout data available for the last 12 months
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Request Payout</h3>
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Transfer your available balance to your bank account. Minimum withdrawal: ₦1,000
              </p>
              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={availableBalance < 1000}
                className={`w-full px-4 py-2 rounded-md ${
                  availableBalance >= 1000 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Request Payout
              </button>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Bank Accounts</h3>
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              {bankAccounts.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-800">{bankAccounts[0].bankName}</p>
                  <p className="text-sm text-gray-600">•••• {bankAccounts[0].accountNumber.slice(-4)}</p>
                  <p className="text-sm text-gray-600 mt-1">{bankAccounts[0].accountName}</p>
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-800">
                    Update Bank Details
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">No bank account added</p>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Add Bank Account
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
                <History className="w-6 h-6 text-green-600" />
              </div>
              {transactions.slice(0, 2).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(tx.date)}</p>
                  </div>
                  <div className={`text-sm font-medium ${
                    tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-sm text-gray-600">No recent transactions</p>
              )}
              {transactions.length > 0 && (
                <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                  View All Transactions
                </button>
              )}
            </div>
          </div>
                
          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
            <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Transaction History</h3>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">All</button>
                <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">Sales</button>
                <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">Payouts</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(transaction.type)}`}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payouts Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Payout History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(payout.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payout.bankDetails.bankName} (••••{payout.bankDetails.accountNumber.slice(-4)})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(payout.status)}`}>
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payout.status === 'requested' && (
                          <button 
                            onClick={() => cancelPayoutRequest(payout.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No payout history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Request Payout</h3>
              <button 
                onClick={() => {
                  setShowPayoutModal(false);
                  setError(null);
                  setAmountError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Balance
                </label>
                <div className="p-3 bg-gray-50 rounded-md text-lg font-medium">
                  {formatCurrency(availableBalance)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    className={`w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      amountError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="1000"
                    max={availableBalance}
                    step="100"
                  />
                </div>
                {amountError && (
                  <p className="mt-1 text-sm text-red-600">{amountError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Minimum withdrawal: {formatCurrency(1000)}
                </p>
              </div>

              {selectedBankAccount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{selectedBankAccount.bankName}</p>
                    <p className="text-sm text-gray-600">•••• {selectedBankAccount.accountNumber.slice(-4)}</p>
                    <p className="text-sm text-gray-600">{selectedBankAccount.accountName}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowPayoutModal(false);
                    setError(null);
                    setAmountError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayoutRequest}
                  disabled={loading || !!amountError}
                  className={`px-4 py-2 rounded-md ${
                    !amountError && availableBalance >= 1000
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Processing...' : 'Request Payout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancesPage;
