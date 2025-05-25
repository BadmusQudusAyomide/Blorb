import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
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
  const [selectedAccount, setSelectedAccount] = useState<string>('');
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
  const [loading, setLoading] = useState(false);
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
        const bankAccountsRef = collection(db, 'bankAccounts');
        const bankAccountsQuery = query(
          bankAccountsRef,
          where('sellerId', '==', user.uid)
        );

        const unsubscribeBankAccounts = onSnapshot(bankAccountsQuery, (snapshot) => {
          const bankAccountsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as BankAccount[];
          setBankAccounts(bankAccountsData);
          
          // Set default account if available
          const defaultAccount = bankAccountsData.find(account => account.isDefault);
          if (defaultAccount) {
            setSelectedAccount(defaultAccount.id);
          }
        });

        return unsubscribeBankAccounts;
      } catch (err) {
        console.error('Error fetching bank accounts:', err);
        setError('Failed to fetch bank accounts');
      }
    };

    const unsubscribeBankAccounts = fetchBankAccounts();

    return () => {
      unsubscribeTransactions();
      unsubscribePayouts();
      unsubscribeBankAccounts?.then(unsubscribe => unsubscribe());
    };
  }, [user?.uid]);

  const stats = [
    { title: "Total Revenue", value: "₦42,500", change: "+18%", icon: <DollarSign className="w-5 h-5 text-green-600" /> },
    { title: "Available Balance", value: "₦28,700", change: "+12%", icon: <CreditCard className="w-5 h-5 text-indigo-600" /> },
    { title: "Pending Payouts", value: "₦15,000", change: "+5%", icon: <TrendingUp className="w-5 h-5 text-blue-600" /> },
    { title: "Total Expenses", value: "₦4,500", change: "-8%", icon: <TrendingDown className="w-5 h-5 text-purple-600" /> }
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      requested: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
    };

    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      sale: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      refund: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      payout: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      withdrawal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
    };

    return typeClasses[type as keyof typeof typeClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (timestamp: Timestamp) => {
    return new Date(timestamp.toDate()).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePayoutRequest = async () => {
    if (!user?.uid || !selectedAccount) return;

    try {
      setLoading(true);
      setError(null);

      const selectedBankAccount = bankAccounts.find(account => account.id === selectedAccount);
      if (!selectedBankAccount) {
        throw new Error('Selected bank account not found');
      }

      const payoutData = {
        sellerId: user.uid,
        amount: availableBalance,
        status: 'requested',
        method: 'bank',
        bankAccount: {
          bankName: selectedBankAccount.bankName,
          accountNumber: selectedBankAccount.accountNumber,
          accountName: selectedBankAccount.accountName
        },
        date: Timestamp.now(),
        reference: `PAY-${Date.now()}`
      };

      await addDoc(collection(db, 'payouts'), payoutData);
      setPayoutSuccess(true);
    } catch (err) {
      console.error('Error requesting payout:', err);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-150">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Finances</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your earnings and payouts</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
              {error}
            </div>
          )}

          {payoutSuccess && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
              Payout request submitted successfully
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(availableBalance)}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Payouts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalPayouts)}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payouts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(pendingPayouts)}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <CreditCard className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Payout Request Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-800">
            <div className="p-4 md:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Request Payout</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Bank Account
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={handleAccountSelect}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select a bank account</option>
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Available for payout: {formatCurrency(availableBalance)}
                  </p>
                  <button
                    onClick={handlePayoutRequest}
                    disabled={loading || !selectedAccount || availableBalance <= 0}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Request Payout'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(transaction.type)}`}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
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