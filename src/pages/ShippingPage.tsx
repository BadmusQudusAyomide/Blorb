import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { 
  Truck,
  Plus,
  Filter,
  Download,
  Calendar,
  Search,
  Package,
  PackageCheck,
  PackageX,
  Clock,
  X,
  ArrowRight,
  Settings,
  Box,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  cost: string;
  deliveryTime: string;
  status: 'active' | 'inactive' | 'scheduled';
  regions: string[];
}

interface Shipment {
  id: string;
  orderId: string;
  customer: string;
  date: string;
  status: 'pending' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  method: string;
  trackingNumber: string;
  carrier: string;
  weight: string;
  destination: string;
}

interface Carrier {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected';
  lastSync: string;
}

const ShippingPage = () => {
  const [activeTab, setActiveTab] = useState<'methods' | 'shipments' | 'carriers' | 'settings'>('methods');
  const [timeRange, setTimeRange] = useState('30d');
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({
    name: '',
    carrier: '',
    cost: '',
    deliveryTime: '',
    status: 'active' as 'active' | 'inactive' | 'scheduled',
    regions: [] as string[]
  });
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([
    {
      id: '1',
      name: 'Standard Shipping',
      carrier: 'FedEx',
      cost: '$5.99',
      deliveryTime: '3-5 business days',
      status: 'active',
      regions: ['US', 'CA', 'MX']
    },
    {
      id: '2',
      name: 'Express Shipping',
      carrier: 'UPS',
      cost: '$12.99',
      deliveryTime: '1-2 business days',
      status: 'active',
      regions: ['US', 'CA']
    },
    {
      id: '3',
      name: 'Free Shipping',
      carrier: 'USPS',
      cost: '$0.00',
      deliveryTime: '5-7 business days',
      status: 'active',
      regions: ['US']
    },
    {
      id: '4',
      name: 'International Priority',
      carrier: 'DHL',
      cost: '$24.99',
      deliveryTime: '2-4 business days',
      status: 'inactive',
      regions: ['EU', 'AS', 'AU']
    }
  ]);
  const [carriers, setCarriers] = useState<Carrier[]>([
    {
      id: '1',
      name: 'FedEx',
      logo: 'https://via.placeholder.com/80x30?text=FedEx',
      status: 'connected',
      lastSync: '5 minutes ago'
    },
    {
      id: '2',
      name: 'UPS',
      logo: 'https://via.placeholder.com/80x30?text=UPS',
      status: 'connected',
      lastSync: '10 minutes ago'
    },
    {
      id: '3',
      name: 'USPS',
      logo: 'https://via.placeholder.com/80x30?text=USPS',
      status: 'connected',
      lastSync: '15 minutes ago'
    },
    {
      id: '4',
      name: 'DHL',
      logo: 'https://via.placeholder.com/80x30?text=DHL',
      status: 'disconnected',
      lastSync: 'Never'
    }
  ]);

  const shipments: Shipment[] = [
    {
      id: '1',
      orderId: 'ORD-1001',
      customer: 'John Smith',
      date: '2023-05-15',
      status: 'delivered',
      method: 'Standard Shipping',
      trackingNumber: 'TRK123456789',
      carrier: 'FedEx',
      weight: '2.5 lbs',
      destination: 'New York, NY'
    },
    {
      id: '2',
      orderId: 'ORD-1002',
      customer: 'Sarah Johnson',
      date: '2023-05-16',
      status: 'shipped',
      method: 'Express Shipping',
      trackingNumber: 'TRK987654321',
      carrier: 'UPS',
      weight: '1.8 lbs',
      destination: 'Los Angeles, CA'
    },
    {
      id: '3',
      orderId: 'ORD-1003',
      customer: 'Michael Brown',
      date: '2023-05-17',
      status: 'pending',
      method: 'Free Shipping',
      trackingNumber: 'TRK456789123',
      carrier: 'USPS',
      weight: '3.2 lbs',
      destination: 'Chicago, IL'
    },
    {
      id: '4',
      orderId: 'ORD-1004',
      customer: 'Emily Davis',
      date: '2023-05-18',
      status: 'returned',
      method: 'Standard Shipping',
      trackingNumber: 'TRK789123456',
      carrier: 'FedEx',
      weight: '1.5 lbs',
      destination: 'Houston, TX'
    },
    {
      id: '5',
      orderId: 'ORD-1005',
      customer: 'David Wilson',
      date: '2023-05-19',
      status: 'cancelled',
      method: 'Express Shipping',
      trackingNumber: 'TRK321654987',
      carrier: 'UPS',
      weight: '2.0 lbs',
      destination: 'Phoenix, AZ'
    }
  ];

  const stats = [
    { title: "Shipments Today", value: "24", change: "+5", icon: <Truck className="w-5 h-5 text-green-600" /> },
    { title: "Pending Shipments", value: "8", change: "-2", icon: <Package className="w-5 h-5 text-yellow-600" /> },
    { title: "Delivered Today", value: "16", change: "+3", icon: <PackageCheck className="w-5 h-5 text-blue-600" /> },
    { title: "Avg. Delivery Time", value: "2.8 days", change: "-0.5", icon: <Clock className="w-5 h-5 text-purple-600" /> }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'returned':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'shipped':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <PackageCheck className="w-4 h-4 text-green-500" />;
      case 'returned':
        return <PackageX className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return <Box className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleAddMethod = () => {
    if (newMethod.name && newMethod.carrier && newMethod.cost && newMethod.deliveryTime) {
      const method: ShippingMethod = {
        id: (shippingMethods.length + 1).toString(),
        ...newMethod,
        regions: newMethod.regions
      };
      setShippingMethods([...shippingMethods, method]);
      setNewMethod({
        name: '',
        carrier: '',
        cost: '',
        deliveryTime: '',
        status: 'active',
        regions: []
      });
      setShowAddMethod(false);
    }
  };

  const toggleMethodStatus = (id: string) => {
    setShippingMethods(shippingMethods.map(method => 
      method.id === id ? { 
        ...method, 
        status: method.status === 'active' ? 'inactive' : 'active' 
      } : method
    ));
  };

  const connectCarrier = (id: string) => {
    setCarriers(carriers.map(carrier => 
      carrier.id === id ? { 
        ...carrier, 
        status: 'connected',
        lastSync: 'Just now'
      } : carrier
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-150">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Shipping</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage shipping methods, carriers, and track shipments</p>
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
              
              {activeTab === 'methods' && (
                <button 
                  className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                  onClick={() => setShowAddMethod(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Method</span>
                </button>
              )}
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
                    <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mt-1`}>
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
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'methods' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('methods')}
              >
                <div className="flex items-center">
                  <Truck className="w-4 h-4 mr-2" />
                  Shipping Methods
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'shipments' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('shipments')}
              >
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Shipments
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'carriers' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('carriers')}
              >
                <div className="flex items-center">
                  <Box className="w-4 h-4 mr-2" />
                  Carriers
                </div>
              </button>
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('settings')}
              >
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </div>
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-6 mb-8">
            {activeTab === 'methods' && (
              <div>
                {/* Add Method Modal */}
                {showAddMethod && (
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add Shipping Method</h3>
                        <button 
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          onClick={() => setShowAddMethod(false)}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method Name</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                            value={newMethod.name}
                            onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                            placeholder="e.g. Overnight Shipping"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Carrier</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                            value={newMethod.carrier}
                            onChange={(e) => setNewMethod({...newMethod, carrier: e.target.value})}
                          >
                            <option value="">Select Carrier</option>
                            <option value="FedEx">FedEx</option>
                            <option value="UPS">UPS</option>
                            <option value="USPS">USPS</option>
                            <option value="DHL">DHL</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                              value={newMethod.cost}
                              onChange={(e) => setNewMethod({...newMethod, cost: e.target.value})}
                              placeholder="e.g. $9.99"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Time</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                              value={newMethod.deliveryTime}
                              onChange={(e) => setNewMethod({...newMethod, deliveryTime: e.target.value})}
                              placeholder="e.g. 1-2 business days"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                            value={newMethod.status}
                            onChange={(e) => setNewMethod({...newMethod, status: e.target.value as 'active' | 'inactive' | 'scheduled'})}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="scheduled">Scheduled</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Regions</label>
                          <div className="flex flex-wrap gap-2">
                            {['US', 'CA', 'MX', 'EU', 'AS', 'AU'].map(region => (
                              <button
                                key={region}
                                type="button"
                                className={`px-3 py-1 text-xs rounded-full ${newMethod.regions.includes(region) ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                                onClick={() => {
                                  setNewMethod(prev => ({
                                    ...prev,
                                    regions: prev.regions.includes(region)
                                      ? prev.regions.filter(r => r !== region)
                                      : [...prev.regions, region]
                                  }));
                                }}
                              >
                                {region}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => setShowAddMethod(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={handleAddMethod}
                        >
                          Save Method
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Shipping Methods</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search methods..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Methods Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Carrier</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delivery Time</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Regions</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {shippingMethods.map((method) => (
                        <tr key={method.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <Truck className="w-5 h-5 text-gray-400 mr-2" />
                              {method.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {method.carrier}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {method.cost}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {method.deliveryTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-wrap gap-1">
                              {method.regions.map(region => (
                                <span key={region} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                                  {region}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(method.status)}`}>
                              {method.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              className={`mr-3 ${method.status === 'active' ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'}`}
                              onClick={() => toggleMethodStatus(method.id)}
                            >
                              {method.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'shipments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Shipments</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search shipments..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Shipments Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Carrier</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tracking</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {shipments.map((shipment) => (
                        <tr key={shipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            <a href="#" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              {shipment.orderId}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {shipment.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(shipment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              {getStatusIcon(shipment.status)}
                              <span className={`ml-2 capitalize ${getStatusBadge(shipment.status)} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}>
                                {shipment.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {shipment.method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {shipment.carrier}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <a href="#" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              {shipment.trackingNumber}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              Track <ArrowRight className="w-4 h-4 inline ml-1" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Previous
                    </button>
                    <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
                        <span className="font-medium">5</span> shipments
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          aria-current="page"
                          className="z-10 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                        >
                          1
                        </button>
                        <button className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                          2
                        </button>
                        <button className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                          3
                        </button>
                        <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'carriers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Shipping Carriers</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search carriers..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Carriers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {carriers.map((carrier) => (
                    <div key={carrier.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <img src={carrier.logo} alt={carrier.name} className="h-8" />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(carrier.status)}`}>
                          {carrier.status}
                        </span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-1">{carrier.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Last sync: {carrier.lastSync}</p>
                      {carrier.status === 'disconnected' ? (
                        <button
                          onClick={() => connectCarrier(carrier.id)}
                          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Connect
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <button className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Sync Now
                          </button>
                          <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Settings
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Origins</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Set up locations where your products ship from.</p>
                  </div>
                  <div className="col-span-2">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Shipping Address</label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                          defaultValue="123 Main St, Suite 100, San Francisco, CA 94105, United States"
                        />
                      </div>
                      <div>
                        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                          Add Another Location
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Preferences</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Configure your default shipping settings.</p>
                    </div>
                    <div className="col-span-2">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Shipping Method</label>
                          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800">
                            <option>Standard Shipping</option>
                            <option>Express Shipping</option>
                            <option>Free Shipping</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Processing Time</label>
                          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800">
                            <option>Same day</option>
                            <option>1 business day</option>
                            <option>2 business days</option>
                            <option>3 business days</option>
                          </select>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Time needed to prepare an order for shipment</p>
                        </div>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="free-shipping"
                              name="free-shipping"
                              type="checkbox"
                              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="free-shipping" className="font-medium text-gray-700 dark:text-gray-300">
                              Offer free shipping
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">Enable free shipping for orders over a certain amount</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Packaging</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Configure your packaging defaults.</p>
                    </div>
                    <div className="col-span-2">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Package Type</label>
                          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800">
                            <option>Small Box</option>
                            <option>Medium Box</option>
                            <option>Large Box</option>
                            <option>Envelope</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Weight (lbs)</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                              defaultValue="1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Dimensions</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                              defaultValue="8x6x4 in"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    className="bg-white dark:bg-gray-800 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShippingPage;