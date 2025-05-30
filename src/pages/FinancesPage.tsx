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
  QuerySnapshot
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { TrendingUp, Wallet } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { formatCurrency, formatDate } from '../utils/formatters';

interface Transaction {
  id: string;
  date: Timestamp;
  type: 'sale' | 'refund' | 'payout' | 'withdrawal';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  orderId?: string;
  description: string;
}

interface Payout {
  id: string;
  date: Timestamp;
  amount: number;
  status: 'paid' | 'pending' | 'processing' | 'requested';
  method: 'bank' | 'paypal' | 'card';
  reference: string;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface Order {
  id: string;
  total: number;
}

const FinancesPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchTransactions = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('sellerId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const transactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const fetchPayouts = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const payoutsRef = collection(db, 'payouts');
      const q = query(
        payoutsRef,
        where('sellerId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const payoutsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payout[];

      setPayouts(payoutsData);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      setError('Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const fetchBankAccount = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const sellerDoc = await getDoc(doc(db, 'sellers', user.uid));
      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        if (sellerData.bankDetails) {
          setBankAccount(sellerData.bankDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching bank account:', error);
      setError('Failed to fetch bank account details');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchTransactions();
      fetchPayouts();
      fetchBankAccount();
    }
  }, [user?.uid, fetchTransactions, fetchPayouts, fetchBankAccount]);

  // Fetch orders to calculate total revenue
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    // Fetch orders
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef,
      where('sellerIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOrders = onSnapshot(ordersQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            total: Number(data.total) || 0
          } as Order;
        });
        const revenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
        setTotalRevenue(revenue);
      },
      (error: Error) => {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch orders');
      }
    );

    setLoading(false);

    return () => {
      unsubscribeOrders();
    };
  }, [user?.uid]);

  // Calculate available balance
  const availableBalance = totalRevenue - payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };

    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      sale: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      refund: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      payout: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      withdrawal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };

    return typeClasses[type as keyof typeof typeClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const handlePayoutRequest = async () => {
    if (!user?.uid || !bankAccount) return;
    
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setLoading(true);
      const payoutData = {
        sellerId: user.uid,
        amount,
      status: 'requested',
      method: 'bank',
        reference: `PAY-${Date.now()}`,
        bankAccountId: bankAccount.accountNumber,
        date: Timestamp.now()
      };

      await addDoc(collection(db, 'payouts'), payoutData);
      setPayoutAmount('');
      setError(null);
      setPayoutSuccess(true);
      fetchPayouts();
    } catch (error) {
      console.error('Error requesting payout:', error);
      setError('Failed to request payout. Please try again.');
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

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-900">Finances</h2>
            <p className="text-sm text-gray-600">Manage your finances and track your earnings</p>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md">
              {error}
            </div>
          )}

          {payoutSuccess && (
            <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-md">
              Payout request submitted successfully
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow border border-blue-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-blue-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(availableBalance)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Payout Request Section */}
          <div className="bg-white rounded-lg shadow border border-blue-100 mb-6">
            <div className="p-4 md:p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">Request Payout</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account
                  </label>
                  <input
                    type="text"
                    value={bankAccount?.accountNumber || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Available for payout: {formatCurrency(availableBalance)}
                  </p>
                  <button
                    onClick={handlePayoutRequest}
                    disabled={loading || !bankAccount || availableBalance <= 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Request Payout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
                
          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow border border-blue-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-blue-100">
              <h3 className="text-lg font-medium text-blue-900">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(transaction.type)}`}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                        {formatCurrency(transaction.amount)}
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancesPage;