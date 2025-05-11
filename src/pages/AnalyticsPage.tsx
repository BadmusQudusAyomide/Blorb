import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { 
  BarChart2 as BarChartIcon,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  Cell
} from 'recharts';

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [timeRange, setTimeRange] = useState('30d');
 
  // Mock data
  const salesData = [
    { name: 'Jan', revenue: 5000 },
    { name: 'Feb', revenue: 8000 },
    { name: 'Mar', revenue: 12000 },
    { name: 'Apr', revenue: 6000 },
    { name: 'May', revenue: 9000 },
    { name: 'Jun', revenue: 15000 },
    { name: 'Jul', revenue: 18000 }
  ];

  const customerData = [
    { name: 'New', value: 120, color: '#4F46E5' },
    { name: 'Returning', value: 85, color: '#10B981' },
    { name: 'Inactive', value: 45, color: '#6B7280' }
  ];

  const productPerformance = [
    { name: 'Wireless Headphones', sales: 245, revenue: 12250 },
    { name: 'Smart Watch', sales: 189, revenue: 9450 },
    { name: 'Bluetooth Speaker', sales: 156, revenue: 7800 },
    { name: 'Phone Case', sales: 132, revenue: 1980 },
    { name: 'USB Cable', sales: 98, revenue: 490 }
  ];

  const stats = [
    { title: "Total Revenue", value: "#24,560", change: "+18%", icon: <DollarSign className="w-5 h-5 text-green-600" /> },
    { title: "Total Orders", value: "1,245", change: "+12%", icon: <ShoppingCart className="w-5 h-5 text-indigo-600" /> },
    { title: "New Customers", value: "342", change: "+5%", icon: <Users className="w-5 h-5 text-blue-600" /> },
    { title: "Avg. Order Value", value: "#1,980", change: "+4%", icon: <TrendingUp className="w-5 h-5 text-purple-600" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-150">
      <Sidebar />
      <TopBar />
      
      <main className={`pt-16 transition-all duration-300 ease-in-out`}>
        <div className="p-4 md:p-6">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-1 md:mb-2">Analytics Dashboard</h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Track and analyze your store's performance</p>
          </div>
          
          {/* Time range selector */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 md:gap-4">
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-2 py-1 text-xs md:text-sm rounded-md ${timeRange === '7d' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('7d')}
              >
                7D
              </button>
              <button 
                className={`px-2 py-1 text-xs md:text-sm rounded-md ${timeRange === '30d' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('30d')}
              >
                30D
              </button>
              <button 
                className={`px-2 py-1 text-xs md:text-sm rounded-md ${timeRange === '90d' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('90d')}
              >
                90D
              </button>
              <button 
                className={`px-2 py-1 text-xs md:text-sm rounded-md ${timeRange === '12m' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                onClick={() => setTimeRange('12m')}
              >
                12M
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-xs md:text-sm">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span>Custom Range</span>
              </button>
              
              <button className="flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-xs md:text-sm">
                <Filter className="w-3 h-3 md:w-4 md:h-4" />
                <span>Filters</span>
              </button>
              
              <button className="flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-xs md:text-sm">
                <Download className="w-3 h-3 md:w-4 md:h-4" />
                <span>Export</span>
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
          <div className="border-b border-gray-200 dark:border-gray-800 mb-4 md:mb-6 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max">
              <button
                className={`whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${activeTab === 'sales' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('sales')}
              >
                <div className="flex items-center">
                  <BarChartIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Sales Overview
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${activeTab === 'customers' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('customers')}
              >
                <div className="flex items-center">
                  <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Customer Insights
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${activeTab === 'products' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('products')}
              >
                <div className="flex items-center">
                  <Package className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Product Performance
                </div>
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6 md:mb-8">
            {activeTab === 'sales' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">Sales Performance</h3>
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                      <span>By Revenue</span>
                      <ChevronDown className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                    </button>
                  </div>
                </div>
                
                <div className="h-64 sm:h-80 bg-gray-50 dark:bg-gray-800 rounded-md p-3 md:p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#4F46E5" 
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 md:p-4 h-56 md:h-64">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">Revenue by Category</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {customerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 md:p-4 h-56 md:h-64">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">Order Volume</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'customers' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">Customer Insights</h3>
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                      <span>By Customer Type</span>
                      <ChevronDown className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 md:p-4 h-56 md:h-64 lg:col-span-2">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">Customer Acquisition</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10B981" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 md:p-4 h-56 md:h-64">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">Customer Segments</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {customerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 md:p-4 h-56 md:h-64">
                  <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">Customer Lifetime Value</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">Product Performance</h3>
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                      <span>By Revenue</span>
                      <ChevronDown className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 md:p-4 h-64 md:h-80 mb-4 md:mb-6">
                  <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">Top Selling Products</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs md:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs md:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Units Sold</th>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs md:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs md:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {productPerformance.map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                          <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">{product.sales}</td>
                          <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">₦{product.revenue.toLocaleString()}</td>
                          <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {Math.round((product.revenue / 32430) * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;