import { Truck } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { useState } from 'react';

const ShippingPage = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-900">Shipping</h2>
            <p className="text-sm text-gray-600">Manage your shipping methods and carriers</p>
          </div>
          
          {/* Coming Soon Message */}
          <div className="bg-white rounded-lg shadow border border-blue-100 p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-full">
                <Truck className="w-12 h-12 text-blue-600" />
            </div>
              <h3 className="text-xl font-semibold text-blue-900">Coming Soon</h3>
              <p className="text-gray-600 max-w-md">
                We're developing a comprehensive shipping management system to help you streamline your delivery operations.
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Features coming soon:
                </p>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Multiple carrier integration</li>
                  <li>• Shipping rate calculator</li>
                  <li>• Order tracking system</li>
                  <li>• Shipping label generation</li>
                  <li>• Delivery time estimates</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
              <div>
                  <h4 className="text-lg font-medium text-blue-900">Carrier Integration</h4>
                  <p className="text-sm text-gray-600">Connect with multiple shipping carriers</p>
                    </div>
                  </div>
                </div>
                
            <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                    <div>
                  <h4 className="text-lg font-medium text-blue-900">Rate Calculator</h4>
                  <p className="text-sm text-gray-600">Calculate shipping costs instantly</p>
                    </div>
                  </div>
                </div>
                
            <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                      <div>
                  <h4 className="text-lg font-medium text-blue-900">Tracking System</h4>
                  <p className="text-sm text-gray-600">Real-time order tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShippingPage;