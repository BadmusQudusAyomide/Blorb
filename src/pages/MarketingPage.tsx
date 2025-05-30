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
  DollarSign,
  BarChart,
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
    <div className="min-h-screen bg-white">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900">Marketing</h2>
            <p className="text-gray-600">Manage your marketing campaigns and promotions</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-blue-900">3</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-900">₦24,500</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average ROI</p>
                  <p className="text-2xl font-bold text-blue-900">245%</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <BarChart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Campaigns Section */}
          <div className="bg-white rounded-lg shadow border border-blue-100 mb-8">
            <div className="p-6 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-blue-900">Active Campaigns</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Create Campaign
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      ROI
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-100">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-900">{campaign.name}</div>
                        <div className="text-sm text-gray-600">
                          {campaign.startDate} - {campaign.endDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(campaign.type)}`}>
                          {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(campaign.status)}`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ₦{campaign.budget.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ₦{campaign.revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {campaign.roi}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-700 mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discount Codes Section */}
          <div className="bg-white rounded-lg shadow border border-blue-100">
            <div className="p-6 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-blue-900">Discount Codes</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Create Code
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Uses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-100">
                  {discounts.map((discount) => (
                    <tr key={discount.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-900">{discount.code}</div>
                        <div className="text-sm text-gray-600">
                          {discount.startDate} - {discount.endDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(discount.type)}`}>
                          {discount.type.charAt(0).toUpperCase() + discount.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {discount.type === 'percentage' ? `${discount.value}%` : `₦${discount.value}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {discount.uses} / {discount.maxUses || '∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(discount.status)}`}>
                          {discount.status.charAt(0).toUpperCase() + discount.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-700 mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          Delete
                        </button>
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

export default MarketingPage;