import { useAuth } from '../../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const TopBar = () => {
  const { user, seller, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-gray-200 z-40">
      <div className="h-full px-3 sm:px-4 flex items-center justify-between">
        <div className="flex items-center pl-12 lg:pl-0">
          <h1 className="text-lg sm:text-xl font-semibold text-blue-800">Dashboard </h1>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* User Profile Section */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-800" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700">
                {seller?.name || user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {seller?.storeName || 'Seller'}
              </p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-2 sm:px-3 py-2 text-sm text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;