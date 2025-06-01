import { 
  Mail, 
  Tag, 
  TrendingUp 
} from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
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
  const [isOpen, setIsOpen] = useState(true);

  // Mock data - in a real app, this would come from an API
  const mockCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Summer Sale',
      status: 'active',
      type: 'discount',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      budget: 5000,
      revenue: 25000,
      roi: 5
    },
    {
      id: '2',
      name: 'Email Newsletter',
      status: 'active',
      type: 'email',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      budget: 1000,
      revenue: 15000,
      roi: 15
    }
  ];

  const mockDiscounts: Discount[] = [
    {
      id: '1',
      code: 'SUMMER20',
      type: 'percentage',
      value: 20,
      uses: 150,
      maxUses: 1000,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      status: 'active'
    },
    {
      id: '2',
      code: 'WELCOME10',
      type: 'fixed',
      value: 10,
      uses: 75,
      maxUses: 500,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };

    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      discount: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      email: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      social: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    return typeClasses[type as keyof typeof typeClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
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
                  <p className="text-2xl font-bold text-blue-900">2</p>
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
                  <p className="text-2xl font-bold text-blue-900">₦42,500</p>
                  </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Tag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
          </div>
          
            <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Email Open Rate</p>
                  <p className="text-2xl font-bold text-blue-900">42%</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Campaigns Table */}
          <div className="bg-white rounded-lg shadow border border-blue-100 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900">Active Campaigns</h3>
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
                      </tr>
                    </thead>
                <tbody className="bg-white divide-y divide-blue-100">
                  {mockCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₦{campaign.budget.toLocaleString()}
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₦{campaign.revenue.toLocaleString()}
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.roi}x
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
                
                {/* Discounts Table */}
          <div className="bg-white rounded-lg shadow border border-blue-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900">Active Discounts</h3>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Valid Until
                    </th>
                      </tr>
                    </thead>
                <tbody className="bg-white divide-y divide-blue-100">
                  {mockDiscounts.map((discount) => (
                    <tr key={discount.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-900">{discount.code}</div>
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(discount.type)}`}>
                          {discount.type.charAt(0).toUpperCase() + discount.type.slice(1)}
                        </span>
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {discount.type === 'percentage' ? `${discount.value}%` : `₦${discount.value}`}
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {discount.uses} / {discount.maxUses || '∞'}
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(discount.status)}`}>
                          {discount.status.charAt(0).toUpperCase() + discount.status.slice(1)}
                            </span>
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {discount.endDate}
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