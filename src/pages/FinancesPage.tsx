import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { 
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Calendar,
  ArrowRight,
  Search,
  Plus,
  Banknote,
  Wallet,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { db } from '../firebase.config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDocs
} from 'firebase/firestore';

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
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

const FinancesPage = () => {
  const { user, seller } = useAuth();
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts' | 'statements' | 'request'>('transactions');
  const [timeRange, setTimeRange] = useState('30d');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate financial stats
  useEffect(() => {
    setTotalRevenue(transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0));

    setTotalPayouts(payouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0));

    setPendingPayouts(payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0));

    setAvailableBalance(totalRevenue - totalPayouts - pendingPayouts);
  }, [transactions, payouts, totalRevenue, totalPayouts, pendingPayouts]);

  // Fetch financial data
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    // Fetch transactions
    const transactionsRef = collection(db, 'transactions');
    const transactionsQuery = query(
      transactionsRef,
      where('sellerId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery,
      (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            amount: Number(data.amount) || 0,
            date: data.date
          } as Transaction;
        });
        setTransactions(transactionsData);
      },
      (error) => {
        console.error('Error fetching transactions:', error);
        setError('Failed to fetch transactions');
      }
    );

    // Fetch payouts
    const payoutsRef = collection(db, 'payouts');
    const payoutsQuery = query(
      payoutsRef,
      where('sellerId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribePayouts = onSnapshot(payoutsQuery,
      (snapshot) => {
        const payoutsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            amount: Number(data.amount) || 0,
            date: data.date
          } as Payout;
        });
        setPayouts(payoutsData);
      },
      (error) => {
        console.error('Error fetching payouts:', error);
        setError('Failed to fetch payouts');
      }
    );

    // Fetch bank accounts
    const fetchBankAccounts = async () => {
      try {
        if (seller?.bankDetails) {
          setBankAccounts([{
            id: '1',
            bankName: seller.bankDetails.bankName,
            accountNumber: seller.bankDetails.accountNumber,
            accountName: seller.bankDetails.accountName,
            isDefault: true
          }]);
        }
      } catch (error) {
        console.error('Error fetching bank accounts:', error);
        setError('Failed to fetch bank accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchBankAccounts();

    return () => {
      unsubscribeTransactions();
      unsubscribePayouts();
    };
  }, [user?.uid, seller?.bankDetails]);

  const stats = [
    { title: "Total Revenue", value: "₦42,500", change: "+18%", icon: <DollarSign className="w-5 h-5 text-green-600" /> },
    { title: "Available Balance", value: "₦28,700", change: "+12%", icon: <CreditCard className="w-5 h-5 text-indigo-600" /> },
    { title: "Pending Payouts", value: "₦15,000", change: "+5%", icon: <TrendingUp className="w-5 h-5 text-blue-600" /> },
    { title: "Total Expenses", value: "₦4,500", change: "-8%", icon: <TrendingDown className="w-5 h-5 text-purple-600" /> }
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      sale: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      refund: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      payout: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      withdrawal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeClasses[type as keyof typeof typeClasses]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePayoutRequest = async () => {
    if (!selectedAccount || availableBalance <= 0) return;

    try {
      setLoading(true);
      const payoutsRef = collection(db, 'payouts');
      const newPayout = {
        sellerId: user?.uid,
        amount: availableBalance,
        status: 'requested',
        method: 'bank',
        reference: `PAY-${Date.now()}`,
        date: Timestamp.now(),
        bankAccountId: selectedAccount
      };

      await addDoc(payoutsRef, newPayout);
      setError(null);
    } catch (error) {
      console.error('Error requesting payout:', error);
      setError('Failed to request payout');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAccount(e.target.value);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64">
        <div className="p-4 md:p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Finances
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your earnings and payouts</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">{formatCurrency(totalRevenue)}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">+12% from last month</p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Balance</p>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">{formatCurrency(availableBalance)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ready for withdrawal</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Payouts</p>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">{formatCurrency(totalPayouts)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All time</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Payouts</p>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">{formatCurrency(pendingPayouts)}</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">In processing</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <CreditCard className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Payout Request Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 mb-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Request Payout</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={selectedAccount}
                  onChange={handleAccountSelect}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handlePayoutRequest}
                  disabled={!selectedAccount || availableBalance <= 0 || loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Request Payout'}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {transactions.slice(0, 5).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(transaction.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payouts */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Payouts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {payouts.slice(0, 5).map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(payout.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {payout.method.charAt(0).toUpperCase() + payout.method.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {payout.reference}
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