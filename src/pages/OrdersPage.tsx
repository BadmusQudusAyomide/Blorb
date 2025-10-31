// src/pages/OrdersPage.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase.config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  arrayUnion,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Search,
  AlertCircle,
  Check,
  DollarSign,
  Info,
  X,
} from "lucide-react";
import TopBar from "../components/dashboard/TopBar";
import Sidebar from "../components/dashboard/Sidebar";
import { formatCurrency } from "../utils/formatters";
import { getSellerSplit } from "../utils/paymentCalculations";
import type { PaymentSplit } from "../types/payment";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images: string[];
  selectedColor?: string;
  selectedSize?: string;
  sellerId: string;
  sellerStatus: "pending" | "approved" | "rejected" | "shipped" | "delivered";
  sellerNotes?: string;
  trackingNumber?: string;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerIds: string[];
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "paid";
  items: { [key: string]: OrderItem };
  sellerItems: {
    [sellerId: string]: OrderItem[];
  };
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
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentInfo: {
    method: string;
    status: string;
    transactionId?: string;
  };
  total: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  statusHistory: {
    status: string;
    timestamp: string;
    updatedBy: string;
    notes: string;
  }[];
  // Enhanced payment fields
  paymentSplits?: PaymentSplit[];
  actualPaymentReceived?: number;
  paymentProcessedAt?: Timestamp;
  walletCreditsProcessed?: boolean;
}

const OrdersPage = () => {
  const { user, seller } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const ordersPerPage = 10;

  // Add new state for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    orderId: string;
    action: "approved" | "rejected";
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showPaymentSplitModal, setShowPaymentSplitModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);

  // Fetch orders
  useEffect(() => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    console.log("Current user:", {
      uid: user.uid,
      email: user.email,
      sellerId: seller?.id,
    });

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("sellerIds", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

    console.log("Fetching orders for seller:", user.uid);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Order data:", {
            id: doc.id,
            sellerIds: data.sellerIds,
            sellerItems: data.sellerItems,
            items: data.items,
            buyerId: data.buyerId,
            buyerName: data.buyerName,
          });
          return {
            id: doc.id,
            ...data,
          };
        }) as Order[];
        console.log("Fetched orders:", ordersData);
        setOrders(ordersData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setError("Failed to fetch orders. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, seller]);

  // Filter orders based on search query and active tab
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingInfo.firstName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      order.shippingInfo.lastName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const sellerStatus =
      order.sellerStatuses?.[user?.uid || ""]?.status || "pending";
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && sellerStatus === "pending") ||
      (activeTab === "approved" && sellerStatus === "approved") ||
      (activeTab === "rejected" && sellerStatus === "rejected");

    return matchesSearch && matchesTab;
  });

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Update the handleOrderStatusUpdate function
  const handleOrderStatusUpdate = async (
    orderId: string,
    newStatus: "approved" | "rejected"
  ) => {
    if (!user) return;

    setPendingAction({
      orderId,
      action: newStatus,
    });
    setShowConfirmModal(true);
  };

  // Add new function to handle the confirmed action
  const handleConfirmedAction = async () => {
    if (!user || !pendingAction) return;

    setProcessingOrder(pendingAction.orderId);
    try {
      const orderRef = doc(db, "orders", pendingAction.orderId);
      const order = orders.find((o) => o.id === pendingAction.orderId);

      if (!order) return;

      // Defensive: Initialize missing seller structures so update can proceed
      if (!order.sellerStatuses || !order.sellerStatuses[user.uid]) {
        order.sellerStatuses = order.sellerStatuses || ({} as any);
        (order.sellerStatuses as any)[user.uid] = {
          status: "pending",
          approvedAt: null,
          shippedAt: null,
          deliveredAt: null,
          notes: "",
          trackingNumber: "",
        } as any;
      }
      if (!order.sellerItems || !order.sellerItems[user.uid]) {
        const fallback = Object.values(order.items || {}).filter(
          (it: any) => it.sellerId === user.uid
        ) as any[];
        order.sellerItems = order.sellerItems || ({} as any);
        (order.sellerItems as any)[user.uid] = fallback;
      }

      const status = pendingAction.action;
      const timestamp = new Date().toISOString();
      const updates: any = {
        [`sellerStatuses.${user.uid}.status`]: status,
        [`sellerStatuses.${user.uid}.approvedAt`]: status === "approved" ? Timestamp.now() : null,
        [`sellerStatuses.${user.uid}.notes`]: status === "approved"
          ? "Order approved by seller"
          : "Order rejected by seller",
        updatedAt: Timestamp.now(),
        statusHistory: arrayUnion({
          status: status,
          timestamp: timestamp,
          updatedBy: user.uid,
          notes: status === "approved"
            ? "Order approved by seller"
            : "Order rejected by seller",
        }),
      };

      // Update the order status first
      await updateDoc(orderRef, updates);
      
      // Update individual items status
      const sellerItems = order.sellerItems[user.uid] || [];
      for (const item of sellerItems) {
        await updateDoc(orderRef, {
          [`items.${item.id}.sellerStatus`]: status,
        });
      }

      if (status === 'approved') {
        // Create a temporary updated sellerStatuses
        const updatedSellerStatuses = {
          ...order.sellerStatuses,
          [user.uid]: {
            ...order.sellerStatuses[user.uid],
            status: 'approved',
            approvedAt: Timestamp.now()
          }
        };

        // If this is the last seller to approve, mark the order as processing
        const allSellersApproved = Object.entries(updatedSellerStatuses)
          .every(([, sellerStatus]) => sellerStatus.status === 'approved');
        
        if (allSellersApproved) {
          await updateDoc(orderRef, {
            status: 'processing',
            updatedAt: Timestamp.now()
          });
        }
      }

      setProcessingOrder(null);
      setShowConfirmModal(false);
      setPendingAction(null);
    } catch (error) {
      console.error("Error updating order status:", error);
      setProcessingOrder(null);
      setShowConfirmModal(false);
      setPendingAction(null);
    }
  };

  // Modify the getStatusClass function to include new statuses
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
      case "paid":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Modify the getStatusIcon function to include new statuses
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "processing":
        return <Truck className="w-4 h-4 text-blue-500" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "paid":
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      default:
        return <ShoppingCart className="w-4 h-4 text-gray-500" />;
    }
  };

  // Handle simulating order payment (for testing)


  // Show payment split details
  const showPaymentSplitDetails = (order: Order) => {
    setSelectedOrderForPayment(order);
    setShowPaymentSplitModal(true);
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        // Pre-process the data to ensure all necessary fields are available
        const processedOrder = {
          id: orderDoc.id,
          ...orderData,
          sellerItems: orderData.sellerItems || {},
          items: orderData.items || {},
          statusHistory: orderData.statusHistory || [],
          shippingInfo: orderData.shippingInfo || {},
          paymentInfo: orderData.paymentInfo || {},
        } as Order;
        setSelectedOrder(processedOrder);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!user) return;

    // Show confirmation dialog
    if (
      !window.confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      )
    ) {
      return;
    }

    setProcessingOrder(orderId);
    setDeleteError(null);
    setSuccessMessage(null);

    try {
      const orderRef = doc(db, "orders", orderId);
      await deleteDoc(orderRef);

      setProcessingOrder(null);
      setSelectedOrder(null);
      setSuccessMessage("Order deleted successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting order:", error);
      setProcessingOrder(null);
      setDeleteError(
        "Failed to delete order. You may not have permission to delete this order."
      );

      // Clear error message after 5 seconds
      setTimeout(() => {
        setDeleteError(null);
      }, 5000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <TopBar setIsOpen={setIsSidebarOpen} />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <TopBar setIsOpen={setIsSidebarOpen} />
        <main className="pt-16 pl-0 lg:pl-64">
          <div className="p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-200 dark:bg-gray-800 rounded"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <TopBar setIsOpen={setIsSidebarOpen} />

      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-indigo-900">
              Orders
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              Manage your orders
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-indigo-100">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`${
                    activeTab === "all"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`${
                    activeTab === "pending"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("approved")}
                  className={`${
                    activeTab === "approved"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setActiveTab("rejected")}
                  className={`${
                    activeTab === "rejected"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Rejected
                </button>
              </nav>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                className="block w-full pl-9 sm:pl-10 pr-3 py-2 border border-indigo-100 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow border border-indigo-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-indigo-100">
                <thead className="bg-indigo-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider"
                    >
                      Order
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider"
                    >
                      Items
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-indigo-900 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-indigo-900 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-indigo-100">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-indigo-50 transition-colors duration-150"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-indigo-600">
                            #{order.orderNumber}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {(
                              order.sellerItems?.[user?.uid || ""] ||
                              Object.values(order.items || {}).filter(
                                (it: any) => it.sellerId === (user?.uid || "")
                              )
                            ).map((item: any, index: number) => (
                              <div key={item.id || index} className="flex items-center">
                                <span>{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.buyerName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt.toDate().toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(
                              order.sellerStatuses?.[user?.uid || ""]?.status ||
                                "pending"
                            )}
                            <span
                              className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                                order.sellerStatuses?.[user?.uid || ""]
                                  ?.status || "pending"
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
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Object.keys(order.items).length}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          <div className="flex flex-col items-end">
                            <span>₦{order.total.toFixed(2)}</span>
                            {order.paymentSplits && (
                              <span className="text-xs text-green-600">
                                +₦{getSellerSplit(order.paymentSplits, user?.uid || "")?.sellerAmount.toFixed(2) || "0.00"} credited
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => viewOrderDetails(order.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View Details
                            </button>

                            {order.paymentSplits && (
                              <button
                                onClick={() => showPaymentSplitDetails(order)}
                                className="inline-flex items-center px-2 py-1.5 border border-blue-600 text-sm font-medium rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                title="View payment split"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredOrders.length > 0 && (
              <div className="px-4 py-4 border-t border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstOrder + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastOrder, filteredOrders.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{filteredOrders.length}</span>{" "}
                    results
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-indigo-100 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-indigo-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-indigo-100 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-indigo-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-indigo-900">
                        Order #{selectedOrder.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedOrder.createdAt.toDate().toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {(selectedOrder.sellerStatuses?.[user?.uid || ""]?.status || "pending") === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleOrderStatusUpdate(
                                selectedOrder.id,
                                "approved"
                              )
                            }
                            disabled={processingOrder === selectedOrder.id}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingOrder === selectedOrder.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </div>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept Order
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleOrderStatusUpdate(
                                selectedOrder.id,
                                "rejected"
                              )
                            }
                            disabled={processingOrder === selectedOrder.id}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingOrder === selectedOrder.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </div>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Order
                              </>
                            )}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                        disabled={processingOrder === selectedOrder.id}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingOrder === selectedOrder.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Delete Order
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="inline-flex items-center px-3 py-2 border border-indigo-100 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Information */}
                    <div>
                      <h4 className="font-medium text-indigo-900 mb-4">
                        Order Information
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Date:</span>{" "}
                          {selectedOrder.createdAt.toDate().toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Status:</span>{" "}
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusClass(
                              selectedOrder.sellerStatuses?.[user?.uid || ""]
                                ?.status || "pending"
                            )}`}
                          >
                            {selectedOrder.sellerStatuses?.[user?.uid || ""]
                              ?.status
                              ? selectedOrder.sellerStatuses[
                                  user?.uid || ""
                                ].status
                                  .charAt(0)
                                  .toUpperCase() +
                                selectedOrder.sellerStatuses[
                                  user?.uid || ""
                                ].status.slice(1)
                              : "Pending"}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Total:</span> ₦
                          {selectedOrder.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div>
                      <h4 className="font-medium text-indigo-900 mb-4">
                        Customer Information
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Name:</span>{" "}
                          {selectedOrder.buyerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span>{" "}
                          {selectedOrder.buyerEmail}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span>{" "}
                          {selectedOrder.shippingInfo.phone}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-indigo-900 mb-4">
                        Order Items
                      </h4>
                      <div className="space-y-4">
                        {selectedOrder.sellerItems[user?.uid || ""]?.map(
                          (item: OrderItem) => (
                            <div
                              key={item.id}
                              className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-lg"
                            >
                              <img
                                src={item.images?.[0]}
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-indigo-900">
                                  {item.name}
                                </p>
                                <div className="mt-1 space-y-1">
                                  <p className="text-sm text-gray-600">
                                    Quantity: {item.quantity}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Price: ₦{item.price.toFixed(2)}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Subtotal: ₦
                                    {(item.price * item.quantity).toFixed(2)}
                                  </p>
                                  {item.selectedColor && (
                                    <p className="text-sm text-gray-600">
                                      Color: {item.selectedColor}
                                    </p>
                                  )}
                                  {item.selectedSize && (
                                    <p className="text-sm text-gray-600">
                                      Size: {item.selectedSize}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Status History */}
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-indigo-900 mb-4">
                        Status History
                      </h4>
                      <div className="space-y-2">
                        {selectedOrder.statusHistory.map((status, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-indigo-900">
                                {status.status.charAt(0).toUpperCase() +
                                  status.status.slice(1)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(status.timestamp).toLocaleString()}
                              </p>
                              {status.notes && (
                                <p className="text-sm text-gray-600">
                                  {status.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmModal && pendingAction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {pendingAction.action === "approved"
                      ? "Accept Order"
                      : "Reject Order"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {pendingAction.action === "approved"
                      ? "Are you sure you want to accept this order? This action cannot be undone."
                      : "Are you sure you want to reject this order? This action cannot be undone."}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setPendingAction(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmedAction}
                      disabled={processingOrder === pendingAction.orderId}
                      className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        pendingAction.action === "approved"
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "bg-red-600 hover:bg-red-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {processingOrder === pendingAction.orderId ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : pendingAction.action === "approved" ? (
                        "Accept Order"
                      ) : (
                        "Reject Order"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-md flex items-center">
              <Check className="w-5 h-5 mr-2" />
              {successMessage}
            </div>
          )}

          {deleteError && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {deleteError}
            </div>
          )}

          {/* Payment Split Modal */}
          {showPaymentSplitModal && selectedOrderForPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-indigo-900">
                        Payment Split Details
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Order #{selectedOrderForPayment.orderNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPaymentSplitModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedOrderForPayment.paymentSplits ? (
                    <div className="space-y-6">
                      {/* Order Summary */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Order Value:</span>
                            <span className="ml-2 font-medium">{formatCurrency(selectedOrderForPayment.total)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Payment Status:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              selectedOrderForPayment.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedOrderForPayment.status === 'paid' ? 'Paid' : 'Pending Payment'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Platform Fee (15%):</span>
                            <span className="ml-2 font-medium text-red-600">
                              -{formatCurrency(selectedOrderForPayment.total * 0.15)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Seller Share (85%):</span>
                            <span className="ml-2 font-medium text-green-600">
                              +{formatCurrency(selectedOrderForPayment.total * 0.85)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Your Split */}
                      {(() => {
                        const yourSplit = getSellerSplit(selectedOrderForPayment.paymentSplits, user?.uid || "");
                        if (yourSplit) {
                          return (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2" />
                                Your Payment Split
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                  <div className="text-gray-600">Order Amount</div>
                                  <div className="text-lg font-bold text-gray-900">
                                    {formatCurrency(yourSplit.orderAmount)}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-600">Platform Fee</div>
                                  <div className="text-lg font-bold text-red-600">
                                    -{formatCurrency(yourSplit.platformFee)}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-600">Amount Credited</div>
                                  <div className="text-lg font-bold text-green-600">
                                    +{formatCurrency(yourSplit.sellerAmount)}
                                  </div>
                                </div>
                              </div>
                              {selectedOrderForPayment.status === 'paid' && (
                                <div className="mt-3 p-3 bg-green-100 rounded-md">
                                  <div className="flex items-center text-green-800">
                                    <Check className="w-4 h-4 mr-2" />
                                    <span className="text-sm font-medium">
                                      {formatCurrency(yourSplit.sellerAmount)} has been credited to your wallet
                                    </span>
                                  </div>
                                  <div className="text-xs text-green-600 mt-1">
                                    Processed: {yourSplit.processedAt.toDate().toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* All Sellers Split */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">All Sellers Split</h4>
                        <div className="space-y-3">
                          {selectedOrderForPayment.paymentSplits.map((split, index) => (
                            <div key={index} className={`p-3 rounded-lg border ${
                              split.sellerId === user?.uid 
                                ? 'border-blue-200 bg-blue-50' 
                                : 'border-gray-200 bg-gray-50'
                            }`}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {split.sellerName}
                                    {split.sellerId === user?.uid && (
                                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Order: {formatCurrency(split.orderAmount)} | 
                                    Fee: {formatCurrency(split.platformFee)} | 
                                    Credit: {formatCurrency(split.sellerAmount)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600">
                                    +{formatCurrency(split.sellerAmount)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No payment split information available for this order.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Payment splits are generated when the order is paid.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowPaymentSplitModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;
