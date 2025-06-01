import { MessageCircle } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { useState } from 'react';

const MessagesPage = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-900">Messages</h2>
            <p className="text-sm text-gray-600">Communicate with your customers</p>
          </div>

          {/* Coming Soon Message */}
          <div className="bg-white rounded-lg shadow border border-blue-100 p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-full">
                <MessageCircle className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900">Coming Soon</h3>
              <p className="text-gray-600 max-w-md">
                We're working on bringing you a powerful messaging system to help you communicate with your customers more effectively.
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Features coming soon:
                </p>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Real-time chat with customers</li>
                  <li>• Message templates and quick replies</li>
                  <li>• Order-related messaging</li>
                  <li>• Customer support integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;