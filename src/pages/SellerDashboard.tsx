import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase.config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import Sidebar from "../components/dashboard/Sidebar";
import TopBar from "../components/dashboard/TopBar";
import { DollarSign, TrendingUp, ShoppingCart, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sellerId: string;
  createdAt: Date;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: Timestamp;
  sellerIds: string[];
  sellerStatuses: {
    [sellerId: string]: {
      status: "pending" | "approved" | "rejected" | "shipped" | "delivered";
      approvedAt: Date | null;
      shippedAt: Date | null;
      deliveredAt: Date | null;
      notes: string;
      trackingNumber: string;
    };
  };
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: ReactElement;
}

const getStatusClass = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "shipped":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

const SellerDashboard = () => {
  const { user, seller } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    growthRate: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  // Calculate stats
  const totalProducts = stats.totalProducts;
  const totalOrders = stats.totalOrders;
  const totalRevenue = recentOrders
    .filter(
      (order) =>
        order.sellerStatuses &&
        order.sellerStatuses[user?.uid || ""]?.status === "approved"
    )
    .reduce((sum, order) => sum + (order.total || 0), 0);
  const growthRate =
    totalOrders > 0
      ? (
          (recentOrders.filter(
            (o) =>
              o.createdAt.toDate() >
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length /
            totalOrders) *
          100
        ).toFixed(0)
      : 0;

  // Fetch products and orders
  useEffect(() => {
    if (!user?.uid) return;

    setError(null);

    // Fetch products
    const productsRef = collection(db, "products");
    const productsQuery = query(
      productsRef,
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeProducts = onSnapshot(
      productsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const productsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            price: Number(data.price) || 0,
            createdAt: data.createdAt?.toDate(),
          } as Product;
        });
        setRecentProducts(productsData);
        setStats((prevStats) => ({
          ...prevStats,
          totalProducts: productsData.length,
        }));
      },
      (error: Error) => {
        console.error("Error fetching products:", error);
        setError("Failed to fetch products");
      }
    );

    // Fetch orders
    const ordersRef = collection(db, "orders");
    const ordersQuery = query(
      ordersRef,
      where("sellerIds", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const ordersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            total: Number(data.total) || 0,
          } as Order;
        });
        setRecentOrders(ordersData);
        setStats((prevStats) => ({
          ...prevStats,
          totalOrders: ordersData.length,
        }));
      },
      (error: Error) => {
        console.error("Error fetching orders:", error);
        setError("Failed to fetch orders");
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [user?.uid]);

  const statsCards: StatCard[] = [
    {
      title: "Total Orders",
      value: totalOrders.toString(),
      change: "+12%",
      icon: <ShoppingCart className="w-6 h-6 text-white" />,
    },
    {
      title: "Products",
      value: totalProducts.toString(),
      change: "+5%",
      icon: <Package className="w-6 h-6 text-white" />,
    },
    {
      title: "Revenue",
      value: `₦${totalRevenue.toFixed(2)}`,
      change: "+18%",
      icon: <DollarSign className="w-6 h-6 text-white" />,
    },
    {
      title: "Growth",
      value: `+${growthRate}%`,
      change: "+4%",
      icon: <TrendingUp className="w-6 h-6 text-white" />,
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <TopBar setIsOpen={setIsOpen} />
        <main className="pt-16 pl-0 lg:pl-64">
          <div className="p-4 md:p-6">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />

      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome back, {seller?.name || "Seller"}!
            </h2>
            <p className="text-gray-600">
              Here's what's happening with your store today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <div
                key={index}
                className="bg-indigo-800 rounded-lg shadow p-6 border border-indigo-700 transition-all duration-150 hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-indigo-100">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-semibold text-white mt-1">
                      {stat.value}
                    </p>
                    <p className="text-sm text-indigo-200 mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-700">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Recent Orders
              </h3>
              <button className="text-sm text-indigo-800 hover:text-indigo-600">
                View All Orders
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.slice(0, 5).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-indigo-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-800">
                        #{order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                            order.sellerStatuses?.[user?.uid || ""]?.status ||
                              "pending"
                          )}`}
                        >
                          {order.sellerStatuses?.[user?.uid || ""]?.status
                            ? order.sellerStatuses[user?.uid || ""].status
                                .charAt(0)
                                .toUpperCase() +
                              order.sellerStatuses[
                                user?.uid || ""
                              ].status.slice(1)
                            : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        ₦{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {order.createdAt.toDate().toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Products */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Recent Products
              </h3>
              <button className="text-sm text-indigo-800 hover:text-indigo-600">
                View All Products
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentProducts.slice(0, 5).map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-indigo-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover mr-3"
                            />
                          )}
                          <span className="text-sm font-medium text-gray-800">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        ₦{product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {product.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;
