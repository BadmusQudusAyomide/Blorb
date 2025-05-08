import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  TrendingUp,
  DollarSign,
  Tag,
  MessageSquare,
  Truck,
  Settings,
  HelpCircle,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft
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


const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [activePath, setActivePath] = useState('/dashboard');
  
  // Check if current path is active
  const isActive = (path: string) => {
    return activePath === path;
  };
  
  // Toggle submenu expansion
  const toggleSubmenu = (key: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Handle navigation (would use router in a real app)
  const handleNavigation = (path: string) => {
    setActivePath(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  // Handle screen resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Navigation items with submenus
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
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
      icon: <TrendingUp className="w-5 h-5" />,
      key: 'marketing',
      subItems: [
        { label: 'Campaigns', path: '/marketing/campaigns' },
        { label: 'Discounts', path: '/marketing/discounts' },
        { label: 'Coupons', path: '/marketing/coupons' },
      ]
    },
    {
      label: 'Finances',
      icon: <DollarSign className="w-5 h-5" />,
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
      icon: <MessageSquare className="w-5 h-5" />,
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

  // Calculate sidebar classes based on state
const sidebarClasses = `
    bg-white dark:bg-gray-900 
    transition-all duration-300 ease-in-out
    ${isOpen ? 'w-64' : 'w-20'} 
    ${isMobile && isOpen ? 'fixed inset-y-0 left-0 z-50 w-64' : ''} 
    ${isMobile && !isOpen ? 'hidden' : ''}
    border-r border-gray-200 dark:border-gray-800
    flex flex-col h-screen shadow-sm fixed
  `;

  // Dark overlay for mobile when sidebar is open
  const overlayClasses = `
    fixed inset-0 bg-gray-900 bg-opacity-50 z-40
    transition-opacity duration-300 ease-in-out
    ${isMobile && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
  `;

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button 
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
      )}
      
      {/* Dark overlay for mobile */}
      <div className={overlayClasses} onClick={() => setIsOpen(false)} />
      
      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <div className="bg-indigo-600 text-white p-2 rounded-md">
              <Tag className="w-6 h-6" />
            </div>
            {isOpen && (
              <h2 className="ml-3 text-xl font-bold text-gray-800 dark:text-white">
                Seller Hub
              </h2>
            )}
          </div>
          
          {/* Collapse button for desktop */}
          {!isMobile && (
            <button 
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          )}
          
          {/* Close button for mobile */}
          {isMobile && isOpen && (
            <button 
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
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
                      ${isActive(item.path || '') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
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
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => item.path && handleNavigation(item.path)}
                    className={`
                      flex items-center justify-between w-full px-3 py-2 rounded-md
                      ${isActive(item.path || '') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                      transition-colors duration-150 ease-in-out
                      ${isOpen ? '' : 'justify-center'}
                    `}
                  >
                    <div className="flex items-center">
                      <span className={`${isOpen ? 'mr-3' : ''}`}>{item.icon}</span>
                      {isOpen && <span>{item.label}</span>}
                    </div>
                    
                    {isOpen && item.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )}
                
                {/* Submenu */}
                {item.subItems && isOpen && item.key && expandedMenus[item.key] && (
                  <div className="mt-1 ml-6 space-y-1">
                    {item.subItems.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => handleNavigation(subItem.path)}
                        className={`
                          block w-full text-left pl-3 pr-4 py-2 rounded-md text-sm
                          ${isActive(subItem.path) ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                          transition-colors duration-150 ease-in-out
                        `}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          {isOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <img 
                    src="/api/placeholder/40/40" 
                    alt="User" 
                    className="w-10 h-10 rounded-full border-2 border-indigo-500"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sarah Johnson</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Premium Seller</p>
                </div>
              </div>
              <div className="flex">
                <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 relative">
                  <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src="/api/placeholder/32/32" 
                  alt="User" 
                  className="w-8 h-8 rounded-full border-2 border-indigo-500"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;