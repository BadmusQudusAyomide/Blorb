// src/App.tsx
import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import SellerDashboard from './pages/SellerDashboard';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CustomerPage from './pages/CustomerPage';
import AnalyticsPage from './pages/AnalyticsPage'; 
import MarketingPage from './pages/MarketingPage';
import FinancesPage from './pages/FinancesPage';
import MessagesPage from './pages/MessagesPage';
import ShippingPage from './pages/ShippingPage';
import SettingsPage from './pages/SettingsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import CarouselPage from './pages/CarouselPage';
import { WifiOff, X } from 'lucide-react';
import AddCategory from './AddCategory';

// Network Status Component
const NetworkStatus = ({ isOnline }: { isOnline: boolean }) => {
  const [show, setShow] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Hide the notification after 3 seconds when back online
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg
        ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
        transition-all duration-300 ease-in-out
      `}>
        <WifiOff className="w-5 h-5" />
        <span className="font-medium">
          {isOnline ? 'Back online!' : 'No internet connection'}
        </span>
        <button
          onClick={() => setShow(false)}
          className="ml-2 hover:opacity-70"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Loading component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Log the error for debugging purposes
    console.debug('Error boundary caught:', error.message);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Something went wrong</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <NetworkStatus isOnline={isOnline} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
               <Route path="/add-category" element={<AddCategory />} /> 
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <SellerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <SellerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/products" element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/products/:tab" element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/orders" element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              } />
              
              <Route path="/orders/:tab" element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              } />
              
              <Route path="/customers" element={
                <ProtectedRoute>
                  <CustomerPage />
                </ProtectedRoute>
              } />
              
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/analytics/:tab" element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/marketing" element={
                <ProtectedRoute>
                  <MarketingPage />
                </ProtectedRoute>
              } />
              
              <Route path="/marketing/:tab" element={
                <ProtectedRoute>
                  <MarketingPage />
                </ProtectedRoute>
              } />
              
              <Route path="/carousel" element={
                <ProtectedRoute>
                  <CarouselPage />
                </ProtectedRoute>
              } />
              
              <Route path="/finances" element={
                <ProtectedRoute>
                  <FinancesPage />
                </ProtectedRoute>
              } />
              
              <Route path="/finances/:tab" element={
                <ProtectedRoute>
                  <FinancesPage />
                </ProtectedRoute>
              } />
              
              <Route path="/shipping" element={
                <ProtectedRoute>
                  <ShippingPage />
                </ProtectedRoute>
              } />

              <Route path="/shipping/:tab" element={
                <ProtectedRoute>
                  <ShippingPage />
                </ProtectedRoute>
              } />
              
              <Route path="/messages" element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/help" element={
                <ProtectedRoute>
                  <HelpCenterPage />
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;