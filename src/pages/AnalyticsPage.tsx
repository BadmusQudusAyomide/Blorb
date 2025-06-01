import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase.config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { 
  TrendingUp, 
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { formatCurrency } from '../utils/formatters';

interface Order {
  id: string;
  total: number;
  createdAt: Timestamp;
  status: string;
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [stats, setStats] = useState<StatCard[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!user) return;

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('sellerIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        
        // Calculate stats based on time range
        const now = new Date();
        const timeRanges = {
          '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        };

        const filteredOrders = ordersData.filter(order => 
          order.createdAt.toDate() >= timeRanges[timeRange]
        );

        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        setStats([
          {
            title: 'Total Revenue',
            value: formatCurrency(totalRevenue),
            change: '+12.5%',
            trend: 'up',
            icon: <DollarSign className="w-6 h-6 text-blue-600" />
          },
          {
            title: 'Total Orders',
            value: totalOrders.toString(),
            change: '+8.2%',
            trend: 'up',
            icon: <ShoppingCart className="w-6 h-6 text-blue-600" />
          },
          {
            title: 'Average Order Value',
            value: formatCurrency(avgOrderValue),
            change: '+4.3%',
            trend: 'up',
            icon: <TrendingUp className="w-6 h-6 text-blue-600" />
          },
          {
            title: 'Total Products',
            value: '156',
            change: '0%',
            trend: 'up',
            icon: <Package className="w-6 h-6 text-blue-600" />
          }
        ]);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch orders');
      }
    );

    return () => unsubscribe();
  }, [user, timeRange]);

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-900">Analytics</h2>
            <p className="text-sm text-gray-600">Track your store's performance and growth</p>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md">
              {error}
            </div>
          )}

          {/* Time Range Selector */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Time Range:</span>
            </div>
            <div className="flex space-x-2">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {range}
              </button>
              ))}
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow border border-blue-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-full">
                    {stat.icon}
                  </div>
                  <div className={`flex items-center ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDown className="w-4 h-4 mr-1" />
                    )}
                    <span className="text-sm font-medium">{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-blue-900">{stat.value}</p>
              </div>
            ))}
          </div>
          
          {/* Coming Soon Message */}
          <div className="bg-white rounded-lg shadow border border-blue-100 p-6 text-center">
            <h3 className="text-lg font-medium text-blue-900 mb-2">More Analytics Coming Soon</h3>
            <p className="text-gray-600">
              We're working on adding more detailed analytics including:
            </p>
            <ul className="mt-4 text-gray-600 space-y-2">
              <li>• Sales trends and forecasting</li>
              <li>• Customer behavior analysis</li>
              <li>• Product performance metrics</li>
              <li>• Marketing campaign effectiveness</li>
              <li>• Inventory turnover rates</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;