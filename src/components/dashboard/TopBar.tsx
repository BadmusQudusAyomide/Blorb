import { Bell, Search, ChevronDown, Menu } from 'lucide-react';

const TopBar = () => {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 fixed top-0 left-0 right-0 z-40 shadow-sm transition-all duration-300 ease-in-out lg:left-64">
      <div className="flex items-center space-x-4">
        {/* Mobile menu button (hidden on larger screens) */}
        <button className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors duration-150"
            placeholder="Search..."
          />
        </div>
        
        {/* Mobile search button (visible only on small screens) */}
        <button className="sm:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative transition-colors duration-150">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <img
              src="https://i.pravatar.cc/40"
              alt="avatar"
              className="w-8 h-8 rounded-full border-2 border-indigo-500"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sarah Johnson</span>
              <ChevronDown className="w-4 h-4 ml-1 text-gray-500 dark:text-gray-400" />
            </div>
            <span className="block text-xs text-gray-500 dark:text-gray-400">Premium Seller</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;