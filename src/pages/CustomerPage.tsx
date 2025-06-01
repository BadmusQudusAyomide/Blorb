import { useState } from 'react';
import { Users, ShoppingBag, Search, Mail, Phone } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  image?: string;
}

const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  
  // Mock customer data - in a real app, this would come from an API
  const customers: Customer[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, USA',
      totalOrders: 5,
      totalSpent: 1245.99,
      lastOrderDate: '2023-05-15',
      image: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      id: '2',
      name: 'Maria Garcia',
      email: 'maria.garcia@example.com',
      phone: '+1 (555) 987-6543',
      location: 'Los Angeles, USA',
      totalOrders: 3,
      totalSpent: 876.50,
      lastOrderDate: '2023-05-10',
      image: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      id: '3',
      name: 'James Smith',
      email: 'james.smith@example.com',
      phone: '+44 20 1234 5678',
      location: 'London, UK',
      totalOrders: 7,
      totalSpent: 2103.75,
      lastOrderDate: '2023-05-12',
      image: 'https://randomuser.me/api/portraits/men/75.jpg'
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      phone: '+61 2 8765 4321',
      location: 'Sydney, Australia',
      totalOrders: 2,
      totalSpent: 543.20,
      lastOrderDate: '2023-05-08',
      image: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    {
      id: '5',
      name: 'David Kim',
      email: 'david.kim@example.com',
      phone: '+82 10 5678 1234',
      location: 'Seoul, South Korea',
      totalOrders: 4,
      totalSpent: 987.30,
      lastOrderDate: '2023-05-14',
      image: 'https://randomuser.me/api/portraits/men/29.jpg'
    }
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Customers</h2>
            <p className="text-gray-600">View and manage customers who have purchased from your store</p>
          </div>
          
          {/* Search and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-blue-100 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search customers by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-blue-100 p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-50 mr-3">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Customers</p>
                  <p className="text-xl font-semibold text-blue-900">{customers.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Customers Table */}
          <div className="bg-white rounded-lg shadow border border-blue-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Orders
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Last Order
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={customer.image || `https://ui-avatars.com/api/?name=${customer.name.replace(' ', '+')}&background=random`} alt={customer.name} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-blue-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="w-4 h-4 mr-2 text-blue-600" />
                            {customer.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-4 h-4 mr-2 text-blue-600" />
                            {customer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-900">{customer.totalOrders}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <ShoppingBag className="w-4 h-4 mr-1" /> orders
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-900">
                          ${customer.totalSpent.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          View
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-blue-100">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-blue-100 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-blue-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-blue-100 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-blue-50">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
                    <span className="font-medium">{customers.length}</span> customers
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-blue-100 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50"
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    <button
                      aria-current="page"
                      className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    >
                      1
                    </button>
                    <button
                      className="bg-white border-blue-100 text-gray-500 hover:bg-blue-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    >
                      2
                    </button>
                    <button
                      className="bg-white border-blue-100 text-gray-500 hover:bg-blue-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    >
                      3
                    </button>
                    <button
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-blue-100 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomersPage;