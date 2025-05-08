import { Link } from 'react-router-dom';
import { Home, Package, Settings } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="h-screen w-64 bg-white border-r shadow-sm fixed top-0 left-0 p-6">
      <h2 className="text-2xl font-bold mb-10">Seller Panel</h2>
      <nav className="flex flex-col space-y-4">
        <Link to="/dashboard" className="flex items-center text-gray-700 hover:text-indigo-600">
          <Home className="w-5 h-5 mr-2" /> Dashboard
        </Link>
        <Link to="/products" className="flex items-center text-gray-700 hover:text-indigo-600">
          <Package className="w-5 h-5 mr-2" /> Products
        </Link>
        <Link to="/settings" className="flex items-center text-gray-700 hover:text-indigo-600">
          <Settings className="w-5 h-5 mr-2" /> Settings
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
