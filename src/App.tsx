// src/App.tsx
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




const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products/:tab" 
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products" 
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders/:tab" 
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute>
                <CustomerPage />
              </ProtectedRoute>
            } 
          />
          {/* Add the new analytics routes */}
          <Route 
            path="/analytics/:tab" 
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
  path="/marketing/:tab" 
  element={
    <ProtectedRoute>
      <MarketingPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/marketing" 
  element={
    <ProtectedRoute>
      <MarketingPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/finances/:tab" 
  element={
    <ProtectedRoute>
      <FinancesPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/finances" 
  element={
    <ProtectedRoute>
      <FinancesPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/shipping/:tab" 
  element={
    <ProtectedRoute>
      <ShippingPage />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/shipping" 
  element={
    <ProtectedRoute>
      <ShippingPage />
    </ProtectedRoute>
  } 
          />
          <Route 
  path="/messages" 
  element={
    <ProtectedRoute>
      <MessagesPage />
    </ProtectedRoute>
  } 
          />
          <Route 
  path="/settings" 
  element={
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/help" 
  element={
    <ProtectedRoute>
      <HelpCenterPage />
    </ProtectedRoute>
  } 
/>
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;