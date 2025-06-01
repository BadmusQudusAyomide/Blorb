import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import {
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  Tag,
  Truck,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Image,
  LayoutDashboard,
  Megaphone,
  Wallet,
  MessageCircle
} from 'lucide-react';

interface SubItem {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: ReactNode;  
  path?: string;
  key?: string;
  subItems?: SubItem[];
  badge?: number;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { seller } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [activePath, setActivePath] = useState('/dashboard');
  
  const isActive = (path: string) => {
    return activePath === path;
  };
  
  const toggleSubmenu = (key: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleNavigation = (path: string) => {
    setActivePath(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [setIsOpen]);
  
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMobile, isOpen]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/dashboard',
    },
    {
      label: 'Orders',
      icon: <ShoppingCart className="w-5 h-5" />,
      key: 'orders',
      subItems: [
        { label: 'All Orders', path: '/orders' },
        { label: 'Pending', path: '/orders/pending' },
        { label: 'Processing', path: '/orders/processing' },
        { label: 'Completed', path: '/orders/completed' },
        { label: 'Cancelled', path: '/orders/cancelled' },
      ]
    },
    {
      label: 'Products',
      icon: <Package className="w-5 h-5" />,
      key: 'products',
      subItems: [
        { label: 'All Products', path: '/products' },
        { label: 'Add New', path: '/products/new' },
        { label: 'Categories', path: '/products/categories' },
        { label: 'Inventory', path: '/products/inventory' },
      ]
    },
    {
      label: 'Customers',
      icon: <Users className="w-5 h-5" />,
      path: '/customers',
    },
    {
      label: 'Analytics',
      icon: <BarChart2 className="w-5 h-5" />,
      key: 'analytics',
      subItems: [
        { label: 'Sales Overview', path: '/analytics/sales' },
        { label: 'Customer Insights', path: '/analytics/customers' },
        { label: 'Product Performance', path: '/analytics/products' },
      ]
    },
    {
      label: 'Marketing',
      icon: <Megaphone className="w-5 h-5" />,
      key: 'marketing',
      subItems: [
        { label: 'Campaigns', path: '/marketing/campaigns' },
        { label: 'Discounts', path: '/marketing/discounts' },
        { label: 'Coupons', path: '/marketing/coupons' },
      ]
    },
    {
      label: 'Carousel',
      icon: <Image className="w-5 h-5" />,
      path: '/carousel',
    },
    {
      label: 'Finances',
      icon: <Wallet className="w-5 h-5" />,
      key: 'finances',
      subItems: [
        { label: 'Transactions', path: '/finances/transactions' },
        { label: 'Payouts', path: '/finances/payouts' },
        { label: 'Statements', path: '/finances/statements' },
      ]
    },
    {
      label: 'Shipping',
      icon: <Truck className="w-5 h-5" />,
      path: '/shipping',
    },
    {
      label: 'Messages',
      icon: <MessageCircle className="w-5 h-5" />,
      path: '/messages',
      badge: 3,
    },
    {
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      path: '/settings',
    },
    {
      label: 'Help Center',
      icon: <HelpCircle className="w-5 h-5" />,
      path: '/help',
    }
  ];

  const sidebarClasses = `
    bg-white 
    transition-all duration-300 ease-in-out
    ${isOpen ? 'w-64' : 'w-20'} 
    ${isMobile && isOpen ? 'fixed inset-y-0 left-0 z-50 w-64' : ''} 
    ${isMobile && !isOpen ? 'hidden' : ''}
    border-r border-gray-200
    flex flex-col h-screen shadow-sm fixed
    z-30
  `;

  const overlayClasses = `
    fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40
    transition-all duration-300 ease-in-out
    ${isMobile && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
  `;

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button 
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="w-6 h-6 text-blue-800" />
        </button>
      )}
      
      {/* Blur overlay for mobile */}
      <div className={overlayClasses} onClick={() => setIsOpen(false)} />
      
      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-800 text-white p-2 rounded-md">
              <Tag className="w-6 h-6" />
            </div>
            {isOpen && (
              <h2 className="ml-3 text-xl font-bold text-blue-800">
                BlorbMart
              </h2>
            )}
          </div>
          
          {/* Collapse button for desktop */}
          {!isMobile && (
            <button 
              className="p-1 rounded-md hover:bg-blue-50"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <ChevronLeft className="w-5 h-5 text-blue-800" />
              ) : (
                <ChevronRight className="w-5 h-5 text-blue-800" />
              )}
            </button>
          )}
          
          {/* Close button for mobile */}
          {isMobile && isOpen && (
            <button 
              className="p-1 rounded-md hover:bg-blue-50"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-blue-800" />
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {navItems.map((item, index) => (
              <div key={index}>
                {/* Main menu item */}
                {item.subItems ? (
                  <button
                    className={`
                      flex items-center justify-between w-full px-3 py-2 rounded-md
                      ${isActive(item.path || '') ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-blue-50'}
                      transition-colors duration-150 ease-in-out
                      ${isOpen ? 'text-left' : 'justify-center'}
                    `}
                    onClick={() => isOpen && item.key && toggleSubmenu(item.key)}
                  >
                    <div className="flex items-center">
                      <span className={`${isOpen ? 'mr-3' : ''}`}>{item.icon}</span>
                      {isOpen && <span>{item.label}</span>}
                    </div>
                    
                    {isOpen && item.key && (
                      expandedMenus[item.key] ? 
                      <ChevronDown className="w-4 h-4 text-blue-800" /> : 
                      <ChevronRight className="w-4 h-4 text-blue-800" />
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path || '#'}
                    onClick={() => handleNavigation(item.path || '')}
                    className={`
                      flex items-center justify-between w-full px-3 py-2 rounded-md
                      ${isActive(item.path || '') ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-blue-50'}
                      transition-colors duration-150 ease-in-out
                      ${isOpen ? '' : 'justify-center'}
                    `}
                  >
                    <div className="flex items-center">
                      <span className={`${isOpen ? 'mr-3' : ''}`}>{item.icon}</span>
                      {isOpen && <span>{item.label}</span>}
                    </div>
                    
                    {isOpen && item.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
                
                {/* Submenu */}
                {item.subItems && isOpen && item.key && expandedMenus[item.key] && (
                  <div className="mt-1 ml-6 space-y-1">
                    {item.subItems.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        to={subItem.path}
                        className={`
                          block w-full text-left pl-3 pr-4 py-2 rounded-md text-sm
                          ${isActive(subItem.path) ? 'bg-blue-50 text-blue-800' : 'text-gray-600 hover:bg-blue-50'}
                          transition-colors duration-150 ease-in-out
                        `}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {isOpen ? (
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-800 font-medium">
                    {seller?.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{seller?.name || 'Seller'}</p>
                <p className="text-xs text-gray-500">{seller?.storeName || 'Store'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-800 text-sm font-medium">
                    {seller?.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;