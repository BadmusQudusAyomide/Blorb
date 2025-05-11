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
  XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  date: string;
  type: 'sale' | 'refund' | 'payout' | 'withdrawal';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  orderId?: string;
  description: string;
}

interface Payout {
  id: string;
  date: string;
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
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts' | 'statements' | 'request'>('transactions');
  const [timeRange, setTimeRange] = useState('30d');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [availableBalance] = useState(28700);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payouts, setPayouts] = useState<Payout[]>([
    {
      id: '1',
      date: '2023-05-15',
      amount: 15000,
      status: 'paid',
      method: 'bank',
      reference: 'PAY-2023-05-15-001'
    },
    {
      id: '2',
      date: '2023-05-08',
      amount: 12500,
      status: 'paid',
      method: 'bank',
      reference: 'PAY-2023-05-08-001'
    },
    {
      id: '3',
      date: '2023-05-01',
      amount: 18000,
      status: 'paid',
      method: 'bank',
      reference: 'PAY-2023-05-01-001'
    },
    {
      id: '4',
      date: '2023-04-24',
      amount: 9500,
      status: 'paid',
      method: 'bank',
      reference: 'PAY-2023-04-24-001'
    }
  ]);

  // Mock data - in a real app, this would come from an API
  const transactions: Transaction[] = [
    {
      id: '1',
      date: '2023-05-15',
      type: 'sale',
      amount: 12500,
      status: 'completed',
      orderId: '#1001',
      description: 'Wireless Headphones'
    },
    {
      id: '2',
      date: '2023-05-14',
      type: 'sale',
      amount: 8500,
      status: 'completed',
      orderId: '#1002',
      description: 'Smart Watch'
    },
    {
      id: '3',
      date: '2023-05-14',
      type: 'refund',
      amount: -4500,
      status: 'completed',
      orderId: '#1003',
      description: 'Bluetooth Speaker (Return)'
    },
    {
      id: '4',
      date: '2023-05-13',
      type: 'payout',
      amount: -15000,
      status: 'pending',
      description: 'Weekly Payout'
    },
    {
      id: '5',
      date: '2023-05-12',
      type: 'sale',
      amount: 3200,
      status: 'completed',
      orderId: '#1004',
      description: 'Phone Case'
    }
  ];

  const bankAccounts: BankAccount[] = [
    {
      id: '1',
      bankName: 'Guaranty Trust Bank',
      accountNumber: '0123456789',
      accountName: 'John Doe',
      isDefault: true
    },
    {
      id: '2',
      bankName: 'Zenith Bank',
      accountNumber: '9876543210',
      accountName: 'John Doe',
      isDefault: false
    }
  ];

  const stats = [
    { title: "Total Revenue", value: "₦42,500", change: "+18%", icon: <DollarSign className="w-5 h-5 text-green-600" /> },
    { title: "Available Balance", value: "₦28,700", change: "+12%", icon: <CreditCard className="w-5 h-5 text-indigo-600" /> },
    { title: "Pending Payouts", value: "₦15,000", change: "+5%", icon: <TrendingUp className="w-5 h-5 text-blue-600" /> },
    { title: "Total Expenses", value: "₦4,500", change: "-8%", icon: <TrendingDown className="w-5 h-5 text-purple-600" /> }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'requested':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'refund':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'payout':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'withdrawal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePayoutRequest = () => {
    setPayoutError('');
    
    if (!payoutAmount) {
      setPayoutError('Please enter an amount');
      return;
    }
    
    if (!selectedAccount) {
      setPayoutError('Please select a bank account');
      return;
    }
    
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayoutError('Please enter a valid amount');
      return;
    }
    
    if (amount > availableBalance) {
      setPayoutError('Amount exceeds available balance');
      return;
    }

    // In a real app, this would call an API to request payout
    console.log(`Requesting payout of ${formatCurrency(amount)} to account ${selectedAccount}`);
    
    // Add to payouts (simulated)
    const newPayout: Payout = {
      id: `req-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: amount,
      status: 'requested',
      method: 'bank',
      reference: `REQ-${Math.floor(Math.random() * 10000)}`
    };

    setPayouts([newPayout, ...payouts]);
    setPayoutSuccess(true);
    
    // Reset form
    setTimeout(() => {
      setPayoutAmount('');
      setSelectedAccount('');
      setShowRequestModal(false);
      setActiveTab('payouts');
      setPayoutSuccess(false);
    }, 2000);
  };

  const handleAccountSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation(); // Prevent modal from closing
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
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Finances</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your store's finances, transactions, and payouts</p>
          </div>
          
          {/* Time range selector and filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center space-x-2">
              <button 
                className={`px-3 py-1 text-sm rounded-md ${timeRange === '7d' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('7d')}
              >
                7D
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md ${timeRange === '30d' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('30d')}
              >
                30D
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md ${timeRange === '90d' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('90d')}
              >
                90D
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md ${timeRange === '12m' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('12m')}
              >
                12M
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Custom Range</span>
                </button>
              </div>
              
              <button className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              
              <button className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            
              <button 
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors"
                onClick={() => setShowRequestModal(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Request Payout</span>
              </button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800 transition-all duration-150 hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'transactions' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('transactions')}
              >
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Transactions
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'payouts' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('payouts')}
              >
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payouts
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'statements' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('statements')}
              >
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Statements
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'request' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('request')}
              >
                <div className="flex items-center">
                  <Wallet className="w-4 h-4 mr-2" />
                  Request Payout
                </div>
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-6 mb-8">
            {activeTab === 'transactions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Transaction History</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Transactions Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(transaction.type)}`}>
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {transaction.orderId || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {transaction.description}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(transaction.status)}`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                              View <ArrowRight className="w-4 h-4 inline ml-1" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'payouts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Payout History</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search payouts..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <button 
                      className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors"
                      onClick={() => setShowRequestModal(true)}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Request Payout</span>
                    </button>
                  </div>
                </div>
                
                {/* Payouts Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(payout.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(payout.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {payout.method.charAt(0).toUpperCase() + payout.method.slice(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {payout.reference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(payout.status)}`}>
                              {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                              View <ArrowRight className="w-4 h-4 inline ml-1" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'statements' && (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Financial Statements</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">View and download your monthly financial statements</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <button className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">May 2023</span>
                    <Download className="w-5 h-5 mt-2 text-indigo-600 dark:text-indigo-400" />
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">April 2023</span>
                    <Download className="w-5 h-5 mt-2 text-indigo-600 dark:text-indigo-400" />
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">March 2023</span>
                    <Download className="w-5 h-5 mt-2 text-indigo-600 dark:text-indigo-400" />
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'request' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                      <Banknote className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Available Balance</h3>
                      <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white">
                        {formatCurrency(availableBalance)}
                      </p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        You can request a payout of up to your available balance.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payout Amount
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">₦</span>
                      </div>
                      <input
                        type="text"
                        name="amount"
                        id="amount"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                        placeholder="0.00"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <button
                          onClick={() => setPayoutAmount(availableBalance.toString())}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-r-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bank Account
                    </label>
                    <select
                      id="account"
                      name="account"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"
                      value={selectedAccount}
                      onChange={handleAccountSelect}
                    >
                      <option value="">Select a bank account</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bankName} - {account.accountNumber} ({account.accountName})
                          {account.isDefault && ' (Default)'}
                        </option>
                      ))}
                    </select>
                    <button className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                      + Add new bank account
                    </button>
                  </div>

                  {payoutError && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{payoutError}</h3>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="button"
                      className="w-full bg-indigo-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={!payoutAmount || !selectedAccount}
                      onClick={handlePayoutRequest}
                    >
                      Request Payout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
          
      {/* Request Payout Modal */}
      {showRequestModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75" onClick={() => setShowRequestModal(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
              onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
            >
              <div>
                {payoutSuccess ? (
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        Payout Requested Successfully
                      </h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Your payout request for {formatCurrency(parseFloat(payoutAmount))} has been submitted.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6">
                      <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                        onClick={() => {
                          setShowRequestModal(false);
                          setPayoutSuccess(false);
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                      <Wallet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        Request Payout
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="modal-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">₦</span>
                            </div>
                            <input
                              type="text"
                              id="modal-amount"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                              placeholder="0.00"
                              value={payoutAmount}
                              onChange={(e) => setPayoutAmount(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center">
                              <button
                                onClick={() => setPayoutAmount(availableBalance.toString())}
                                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-r-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                Max
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Available balance: {formatCurrency(availableBalance)}
                          </p>
                        </div>

                        <div>
                          <label htmlFor="modal-account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Bank Account
                          </label>
                          <select
                            id="modal-account"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"
                            value={selectedAccount}
                            onChange={handleAccountSelect}
                          >
                            <option value="">Select a bank account</option>
                            {bankAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.bankName} - {account.accountNumber} ({account.accountName})
                                {account.isDefault && ' (Default)'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {payoutError && (
                          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{payoutError}</h3>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {!payoutSuccess && (
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={!payoutAmount || !selectedAccount}
                    onClick={handlePayoutRequest}
                  >
                    Request Payout
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-colors"
                    onClick={() => {
                      setShowRequestModal(false);
                      setPayoutError('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancesPage;