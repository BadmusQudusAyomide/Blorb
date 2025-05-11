import { Mail, Clock } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';

const MessagesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64">
        {/* Blurred Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center filter blur-sm opacity-20 dark:opacity-10"></div>
        
        {/* Coming Soon Container */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 text-center">
          <div className="w-full max-w-md p-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 mb-6">
              <Mail className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Messages Coming Soon</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We're working hard to bring you a seamless messaging experience. Stay tuned!
            </p>
            <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="mr-2 h-4 w-4" />
              <span>Launching soon</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;