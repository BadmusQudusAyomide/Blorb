import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { 
  TrendingUp,
  Tag,
  Mail,
  Bell,
  Plus,
  Filter,
  Download,
  Calendar,
  Search,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  type: 'discount' | 'email' | 'social';
  startDate: string;
  endDate: string;
  budget: number;
  revenue: number;
  roi: number;
}

interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  uses: number;
  maxUses: number | null;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'scheduled';
}

const MarketingPage = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'discounts' | 'coupons' | 'emails'>('campaigns');
  const [timeRange, setTimeRange] = useState('30d');
  
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Mock data - in a real app, this would come from an API
  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Summer Sale',
      status: 'active',
      type: 'discount',
      startDate: '2023-05-01',
      endDate: '2023-05-31',
      budget: 5000,
      revenue: 24500,
      roi: 390
    },
    {
      id: '2',
      name: 'New Product Launch',
      status: 'active',
      type: 'email',
      startDate: '2023-05-15',
      endDate: '2023-06-15',
      budget: 3000,
      revenue: 18000,
      roi: 500
    },
    {
      id: '3',
      name: 'Spring Clearance',
      status: 'completed',
      type: 'social',
      startDate: '2023-04-01',
      endDate: '2023-04-30',
      budget: 2000,
      revenue: 12500,
      roi: 525
    },
    {
      id: '4',
      name: 'Loyalty Rewards',
      status: 'paused',
      type: 'email',
      startDate: '2023-05-10',
      endDate: '2023-06-10',
      budget: 1500,
      revenue: 4500,
      roi: 200
    }
  ];

  const discounts: Discount[] = [
    {
      id: '1',
      code: 'SUMMER20',
      type: 'percentage',
      value: 20,
      uses: 124,
      maxUses: 200,
      startDate: '2023-05-01',
      endDate: '2023-05-31',
      status: 'active'
    },
    {
      id: '2',
      code: 'FREESHIP',
      type: 'fixed',
      value: 500,
      uses: 89,
      maxUses: null,
      startDate: '2023-05-15',
      endDate: '2023-06-15',
      status: 'active'
    },
    {
      id: '3',
      code: 'SPRING15',
      type: 'percentage',
      value: 15,
      uses: 200,
      maxUses: 200,
      startDate: '2023-04-01',
      endDate: '2023-04-30',
      status: 'expired'
    },
    {
      id: '4',
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      uses: 56,
      maxUses: 100,
      startDate: '2023-06-01',
      endDate: '2023-06-30',
      status: 'scheduled'
    }
  ];

  const stats = [
    { title: "Active Campaigns", value: "2", change: "+1", icon: <TrendingUp className="w-5 h-5 text-green-600" /> },
    { title: "Total Revenue", value: "₦42,500", change: "+18%", icon: <Tag className="w-5 h-5 text-indigo-600" /> },
    { title: "Email Open Rate", value: "42%", change: "+5%", icon: <Mail className="w-5 h-5 text-blue-600" /> },
    { title: "Discount Usage", value: "213", change: "+32%", icon: <Bell className="w-5 h-5 text-purple-600" /> }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'discount':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'email':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'social':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-150">
      <Sidebar />
      <TopBar />
      
    
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-1 md:mb-2">Marketing</h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage campaigns, discounts, and customer engagement</p>
          </div>
          
          {/* Time range selector and filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 md:gap-4">
            <div className="flex items-center space-x-1 md:space-x-2">
              <button 
                className={`px-2 py-1 text-xs md:px-3 md:py-1 md:text-sm rounded-md ${timeRange === '7d' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('7d')}
              >
                7D
              </button>
              <button 
                className={`px-2 py-1 text-xs md:px-3 md:py-1 md:text-sm rounded-md ${timeRange === '30d' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('30d')}
              >
                30D
              </button>
              <button 
                className={`px-2 py-1 text-xs md:px-3 md:py-1 md:text-sm rounded-md ${timeRange === '90d' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('90d')}
              >
                90D
              </button>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* Mobile filters dropdown */}
              <div className="md:hidden relative">
                <button 
                  className="flex items-center space-x-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-xs"
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                >
                  <Filter className="w-3 h-3 md:w-4 md:h-4" />
                  <span>Filters</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${mobileFiltersOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {mobileFiltersOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                    <button className="flex items-center space-x-1 px-3 py-1.5 w-full text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Calendar className="w-4 h-4" />
                      <span>Custom Range</span>
                    </button>
                    <button className="flex items-center space-x-1 px-3 py-1.5 w-full text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Desktop filters */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="relative">
                  <button className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Custom Range</span>
                  </button>
                </div>
                
                <button className="hidden md:flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm">
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>
                
                <button className="hidden md:flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
              
              <button className="flex items-center space-x-1 px-2 py-1 md:px-3 md:py-1.5 bg-indigo-600 text-white rounded-md text-xs md:text-sm hover:bg-indigo-700">
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Create New</span>
              </button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 md:p-6 border border-gray-200 dark:border-gray-800 transition-all duration-150 hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                    <p className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-white mt-1">{stat.value}</p>
                    <p className="text-xs md:text-sm text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
                  </div>
                  <div className="p-1 md:p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 mb-4 md:mb-6">
            <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto pb-1">
              <button
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-xs md:text-sm ${activeTab === 'campaigns' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('campaigns')}
              >
                <div className="flex items-center">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Campaigns
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-xs md:text-sm ${activeTab === 'discounts' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('discounts')}
              >
                <div className="flex items-center">
                  <Tag className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Discounts
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-xs md:text-sm ${activeTab === 'coupons' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('coupons')}
              >
                <div className="flex items-center">
                  <Tag className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Coupons
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-xs md:text-sm ${activeTab === 'emails' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('emails')}
              >
                <div className="flex items-center">
                  <Mail className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Emails
                </div>
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6 md:mb-8">
            {activeTab === 'campaigns' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">Marketing Campaigns</h3>
                  <div className="w-full md:w-auto">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search campaigns..."
                        className="block w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs md:text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Campaigns Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                        <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="hidden sm:table-cell px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                        <th scope="col" className="hidden sm:table-cell px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Budget</th>
                        <th scope="col" className="hidden md:table-cell px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                        <th scope="col" className="hidden md:table-cell px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ROI</th>
                        <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                            <div className="truncate max-w-[120px] md:max-w-none">{campaign.name}</div>
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(campaign.type)}`}>
                              {campaign.type}
                            </span>
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                          </td>
                          <td className="hidden sm:table-cell px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            ₦{campaign.budget.toLocaleString()}
                          </td>
                          <td className="hidden md:table-cell px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            ₦{campaign.revenue.toLocaleString()}
                          </td>
                          <td className="hidden md:table-cell px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {campaign.roi}%
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-medium">
                            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                              <span className="hidden md:inline">View </span>
                              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'discounts' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">Discount Codes</h3>
                  <div className="w-full md:w-auto">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search discounts..."
                        className="block w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs md:text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Discounts Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                        <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                        <th scope="col" className="hidden sm:table-cell px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usage</th>
                        <th scope="col" className="hidden md:table-cell px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                        <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {discounts.map((discount) => (
                        <tr key={discount.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                            <div className="truncate max-w-[80px] md:max-w-none">{discount.code}</div>
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {discount.type === 'percentage' ? 'Pct' : 'Fixed'}
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {discount.type === 'percentage' ? `${discount.value}%` : `₦${discount.value}`}
                          </td>
                          <td className="hidden sm:table-cell px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {discount.uses}{discount.maxUses ? `/${discount.maxUses}` : ''}
                          </td>
                          <td className="hidden md:table-cell px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(discount.status)}`}>
                              {discount.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-medium">
                            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                              <span className="hidden md:inline">View </span>
                              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'coupons' && (
              <div className="text-center py-8 md:py-12">
                <div className="mx-auto w-16 h-16 md:w-24 md:h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Tag className="w-6 h-6 md:w-10 md:h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-1 md:mb-2">Coupon Management</h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-6">Create and manage coupon codes for your customers</p>
                <button className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 border border-transparent text-xs md:text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <Plus className="-ml-0.5 mr-1.5 h-3 w-3 md:-ml-1 md:mr-2 md:h-5 md:w-5" />
                  Create Coupon
                </button>
              </div>
            )}
            
            {activeTab === 'emails' && (
              <div className="text-center py-8 md:py-12">
                <div className="mx-auto w-16 h-16 md:w-24 md:h-24 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Mail className="w-6 h-6 md:w-10 md:h-10 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-1 md:mb-2">Email Marketing</h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-6">Create and send email campaigns to your customers</p>
                <button className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 border border-transparent text-xs md:text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
                  <Plus className="-ml-0.5 mr-1.5 h-3 w-3 md:-ml-1 md:mr-2 md:h-5 md:w-5" />
                  Create Email Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketingPage;