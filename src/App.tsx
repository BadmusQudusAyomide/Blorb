// src/App.tsx
import React, { Suspense } from 'react';
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
  return (
    <Router>
      <ErrorBoundary>
      <AuthProvider>
          <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
              
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